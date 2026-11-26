#!/usr/bin/env python3
"""가사 글자(로마자)를 보컬 음원에 강제 정렬(CTC forced alignment, MMS 모델) -> 줄/단어/음절 시각.
추정이 아니라 모델이 실제 소리를 듣고 각 글자가 나오는 시점을 찾는다.

사용: python pipeline/force_align.py <vocals.wav> <lyrics.txt> <name>
결과: public/data/<name>.json 의 lines[].start / lines[].steps([[시각, 보이는 글자 수],..]) 갱신
"""
import sys, re, json, os
import numpy as np, torch, torchaudio, librosa
from transformers import AutoModelForCTC, AutoTokenizer

vocals, lyrics, name = sys.argv[1:4]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = 'MahmoudAshraf/mms-300m-1130-forced-aligner'
tok = AutoTokenizer.from_pretrained(MODEL); vocab = tok.get_vocab()
model = AutoModelForCTC.from_pretrained(MODEL).eval()

y, _ = librosa.load(vocals, sr=16000, mono=True)
x = torch.from_numpy((y - y.mean()) / (y.std() + 1e-7)).float()[None]
with torch.inference_mode():
    logits = model(x).logits
lp = torch.log_softmax(logits, -1)
stride = len(y) / 16000 / lp.shape[1]
print(f'frames {lp.shape[1]} stride {stride*1000:.1f}ms')

blocks = [b.strip().split('\n') for b in re.split(r'\n\s*\n', open(lyrics, encoding='utf-8').read().strip())]
en = [b[0].strip().lstrip('!').strip() for b in blocks]
targets, owner = [], []  # owner: (line, 글자 인덱스)
for li, e in enumerate(en):
    for ci, ch in enumerate(e.lower()):
        if ch in vocab and ch.isalpha() and ch not in ('<',):
            targets.append(vocab[ch]); owner.append((li, ci))
ali, scores = torchaudio.functional.forced_align(lp, torch.tensor([targets], dtype=torch.int32), blank=0)
spans = torchaudio.functional.merge_tokens(ali[0], scores[0].exp())
assert len(spans) == len(targets), (len(spans), len(targets))
tstart = [s.start * stride for s in spans]
conf = [float(s.score) for s in spans]
print(f'mean token confidence {np.mean(conf):.2f}, low(<0.3): {sum(c < 0.3 for c in conf)}/{len(conf)}')

TOK = re.compile(r"(?:ch|sh|ts|ny|py|hy|my|ry|gy|by|ky|jy|[bdfghjkmnprstwyz])?[aiueo]|n(?![aiueo])|[ptkcs](?=[ptkcs])", re.I)
path = os.path.join(ROOT, 'public', 'data', name + '.json')
d = json.load(open(path, encoding='utf-8'))
per_line = {}
for k, (li, ci) in enumerate(owner): per_line.setdefault(li, {})[ci] = (tstart[k], conf[k])
for li, l in enumerate(d['lines']):
    cm = per_line[li]
    first = min(cm)
    l['start'] = round(cm[first][0], 3)
    steps = []
    for m in TOK.finditer(en[li]):
        # 모라의 첫 글자 중 정렬된 글자의 시각
        cs = [c for c in range(m.start(), m.end()) if c in cm]
        if cs: steps.append([round(cm[cs[0]][0], 3), m.end()])
    # 시각이 역전되지 않게 보정
    for j in range(1, len(steps)):
        if steps[j][0] < steps[j - 1][0]: steps[j][0] = steps[j - 1][0]
    l['steps'] = steps
    l['conf'] = round(float(np.mean([v[1] for v in cm.values()])), 2)
d['alignMode'] = 'ctc-forced'
json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for li, l in enumerate(d['lines']):
    print(f"{li:2d} {l['start']:6.2f} conf {l['conf']:.2f}  {l['en']}")
