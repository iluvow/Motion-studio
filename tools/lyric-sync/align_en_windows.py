"""
영어 가사 줄별 시작/끝 시간 정제. 대략의 줄 시작 시간(위스퍼 등)을 창으로 삼아, 줄마다 wav2vec2 영어 CTC 로 강제 정렬한다.
사용: python align_en_windows.py <vocals.wav> <lyrics_raw.txt> <출력 json> <줄 시작 근사값(초)들 쉼표로, 가사 영어 줄 수와 같게>
lyrics_raw.txt: 영어 줄 다음 줄이 번역(영어 알파벳이 없는 줄)인 형식. 검열 표시 **** 는 정렬용으로 'death' 로 바꿔 소리만 맞춘다.
"""
import json, re, sys
import torch, torchaudio, whisperx

vocals, lyr, out, approx = sys.argv[1:5]
approx = [float(x) for x in approx.split(',')]
rows = [l.strip() for l in open(lyr, encoding='utf-8') if l.strip()]
lines, i = [], 0
while i < len(rows):
    if re.search(r'[A-Za-z]', rows[i]):
        ko = rows[i + 1] if i + 1 < len(rows) and not re.search(r'[A-Za-z]', rows[i + 1]) else ''
        lines.append({'en': rows[i], 'ko': ko}); i += 2 if ko else 1
    else:
        i += 1
assert len(lines) == len(approx), (len(lines), len(approx))
audio = whisperx.load_audio(vocals); dur = len(audio) / 16000
model, meta = whisperx.load_align_model(language_code='en', device='cpu')
dic = meta['dictionary']; blank = dic['-']
def norm(s): return re.sub(r"[^a-z' ]", '', s.replace('****', 'death').lower()).strip()
res = []
for n, L in enumerate(lines):
    a = max(0.0, approx[n] - 0.5); b = (approx[n + 1] + 0.15) if n + 1 < len(approx) else dur
    wav = audio[int(a * 16000):int(b * 16000)]
    words = norm(L['en']).split()
    text = '|'.join(words)
    with torch.inference_mode():
        o = model(torch.from_numpy(wav)[None]); o = o[0] if isinstance(o, tuple) else o.logits
        em = torch.log_softmax(o, dim=-1)
    tg = torch.tensor([[dic[c] for c in text]], dtype=torch.int32)
    ali, sc = torchaudio.functional.forced_align(em, tg, blank=blank)
    spans = torchaudio.functional.merge_tokens(ali[0], sc[0].exp())
    sec = (len(wav) / 16000) / em.shape[1]
    # 단어별 시작/끝 (| 로 나눠진 글자 묶음)
    ws, k = [], 0
    for w in words:
        s0 = spans[k]; e0 = spans[k + len(w) - 1]; k += len(w) + 1
        ws.append({'w': w, 'start': round(a + s0.start * sec, 3), 'end': round(a + e0.end * sec, 3)})
    L['words'] = ws; L['start'] = ws[0]['start']; L['end'] = ws[-1]['end']
    L['score'] = round(float(sum(s.score for s in spans) / len(spans)), 3)
    res.append(L)
json.dump({'duration': dur, 'lines': res}, open(out, 'w'), ensure_ascii=False, indent=1)
for n, L in enumerate(res, 1):
    print(n, f"{L['start']:.2f}-{L['end']:.2f}  (whisper {approx[n-1]:.2f}, 신뢰 {L['score']})", L['en'])
