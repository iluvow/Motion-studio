"""
사람이 확인한 '줄 시작 시간'(앵커)으로 구간을 나눠, 구간마다 따로 강제 정렬한다.
사용: python align_anchored.py <vocals.wav> <lyrics_raw.txt> <출력 json> <줄번호(1부터):시작초> ...
예:   ... 4:4.73 8:13.70 12:22.11   (1번 줄은 맨 앞, 앵커 사이 줄들은 그 구간 안에서만 정렬)
"""
import json, re, sys
import torch, torchaudio, whisperx

vocals, lyrics_path, out = sys.argv[1:4]
anchors = sorted((int(a.split(':')[0]), float(a.split(':')[1])) for a in sys.argv[4:])
HAN = re.compile(r'[一-鿿]')
rows = [l.strip() for l in open(lyrics_path, encoding='utf-8') if l.strip()]
lines, i = [], 0
while i < len(rows):
    if HAN.search(rows[i]):
        ko = rows[i + 1] if i + 1 < len(rows) and not HAN.search(rows[i + 1]) else ''
        lines.append({'zh': rows[i], 'ko': ko}); i += 2 if ko else 1
    else:
        i += 1
audio = whisperx.load_audio(vocals)
dur = len(audio) / 16000
model, meta = whisperx.load_align_model(language_code='zh', device='cpu')
dic = meta['dictionary']; blank = next(v for k, v in dic.items() if k in ('[pad]', '<pad>'))
bounds = [(1, 0.0)] + anchors + [(len(lines) + 1, dur)]
for (a, ta), (b, tb) in zip(bounds, bounds[1:]):
    seg = lines[a - 1:b - 1]
    text = ''.join(l['zh'] for l in seg)
    wav = audio[int(ta * 16000):int(tb * 16000)]
    with torch.inference_mode():
        em = torch.log_softmax(model(torch.from_numpy(wav)[None]).logits, dim=-1)
    targets = torch.tensor([[dic[c] for c in text]], dtype=torch.int32)
    ali, sc = torchaudio.functional.forced_align(em, targets, blank=blank)
    spans = torchaudio.functional.merge_tokens(ali[0], sc[0].exp())
    sec = (len(wav) / 16000) / em.shape[1]; k = 0
    for L in seg:
        L['chars'] = []
        for c in L['zh']:
            sp = spans[k]; k += 1
            L['chars'].append({'c': c, 'start': round(ta + sp.start * sec, 3), 'end': round(ta + sp.end * sec, 3)})
        L['start'], L['end'] = L['chars'][0]['start'], L['chars'][-1]['end']
json.dump({'duration': dur, 'lines': lines}, open(out, 'w'), ensure_ascii=False, indent=1)
for n, L in enumerate(lines, 1):
    print(n, f"{L['start']:.2f}-{L['end']:.2f}", L['zh'])
