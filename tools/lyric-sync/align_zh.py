"""
중국어 가사의 글자(字)별 시작/끝 시간을 노래 보컬에서 뽑는다.
wav2vec2 중국어 CTC 모델 + torchaudio 강제 정렬 (WhisperX 의 모델 로더만 사용, 문장 분리 사전은 쓰지 않음).
사용: python align_zh.py <vocals.wav> <lyrics_raw.txt> <출력 json>
lyrics_raw.txt: 중국어 줄(한자 포함) 바로 뒤에 번역 줄이 오는 형식. 빈 줄은 무시.
출력: lines = [{zh, ko, start, end, chars:[{c, start, end, score}]}], 시간은 초.
"""
import json
import re
import sys

import numpy as np
import torch
import torchaudio
import whisperx

vocals, lyrics_path, out = sys.argv[1:4]
HAN = re.compile(r'[一-鿿]')

rows = [l.strip() for l in open(lyrics_path, encoding='utf-8') if l.strip()]
lines, i = [], 0
while i < len(rows):
    if HAN.search(rows[i]):
        ko = rows[i + 1] if i + 1 < len(rows) and not HAN.search(rows[i + 1]) else ''
        lines.append({'zh': rows[i], 'ko': ko}); i += 2 if ko else 1
    else:
        i += 1
text = ''.join(l['zh'] for l in lines)
print('줄 수', len(lines), '글자 수', len(text))

audio = whisperx.load_audio(vocals)                         # 16kHz mono float32
model, meta = whisperx.load_align_model(language_code='zh', device='cpu')
dic = meta['dictionary']
blank = next(v for k, v in dic.items() if k in ('[pad]', '<pad>'))
assert all(c in dic for c in text), [c for c in text if c not in dic]
with torch.inference_mode():
    em = model(torch.from_numpy(audio)[None]).logits
    em = torch.log_softmax(em, dim=-1)
targets = torch.tensor([[dic[c] for c in text]], dtype=torch.int32)
ali, scores = torchaudio.functional.forced_align(em, targets, blank=blank)
spans = torchaudio.functional.merge_tokens(ali[0], scores[0].exp())
assert len(spans) == len(text), (len(spans), len(text))
sec = (len(audio) / 16000) / em.shape[1]                  # 프레임 하나의 길이(초), 보통 0.02
k = 0
for L in lines:
    L['chars'] = []
    for c in L['zh']:
        sp = spans[k]; k += 1
        L['chars'].append({'c': c, 'start': round(sp.start * sec, 3), 'end': round(sp.end * sec, 3), 'score': round(float(sp.score), 3)})
    L['start'], L['end'] = L['chars'][0]['start'], L['chars'][-1]['end']
json.dump({'duration': len(audio) / 16000, 'frame_sec': sec, 'lines': lines}, open(out, 'w'), ensure_ascii=False, indent=1)
print('프레임 길이 %.3f초' % sec)
for n, L in enumerate(lines):
    print(f"{n:2d} {L['start']:6.2f}-{L['end']:6.2f}  {L['zh']}   " + ' '.join(f"{ch['c']}{ch['start']:.2f}" for ch in L['chars']))
