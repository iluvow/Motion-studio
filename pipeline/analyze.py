#!/usr/bin/env python3
"""음원 + 가사 -> data/<name>.json (박자, 가사 줄/단어 타이밍)

사용:
  python pipeline/analyze.py <audio> <lyrics.txt> <name> [--lang en] [--bars-fallback]

lyrics.txt 형식: 줄 묶음을 빈 줄로 구분. 묶음 = 원어 줄 / 해석 줄 / (선택) 보충 줄
  Less than three, you love me
  <3, 넌 날 사랑해
"""
import sys, os, json, re, subprocess, difflib, tempfile, argparse
import numpy as np, librosa

ap = argparse.ArgumentParser()
ap.add_argument('audio'); ap.add_argument('lyrics'); ap.add_argument('name')
ap.add_argument('--lang', default='en')
ap.add_argument('--model', default='small')
ap.add_argument('--no-separate', action='store_true')
ap.add_argument('--bpm', type=float, default=None, help='박자 추정이 틀릴 때 BPM 직접 지정(4분음표 기준)')
a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
work = os.path.join(ROOT, '.work', a.name); os.makedirs(work, exist_ok=True)

# 1. 가사 파싱
blocks = [b.strip().split('\n') for b in re.split(r'\n\s*\n', open(a.lyrics, encoding='utf-8').read().strip())]
lines = [{'en': b[0].strip(), 'ko': b[1].strip() if len(b) > 1 else '', 'sub': b[2].strip() if len(b) > 2 else ''} for b in blocks]

# 2. 오디오 -> wav
wav = os.path.join(work, 'full.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.audio, '-vn', '-ar', '44100', '-ac', '2', wav], check=True)
dur = librosa.get_duration(path=wav)

# 3. 박자
y, sr = librosa.load(wav, sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time', bpm=a.bpm) if a.bpm else librosa.beat.beat_track(y=y, sr=sr, units='time')
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units='time', backtrack=False)
tempo = float(np.atleast_1d(tempo)[0])
beat_list = [round(float(b), 3) for b in beats]
cands = sorted({round(float(t), 1) for t in np.atleast_1d(librosa.feature.tempo(y=y, sr=sr, aggregate=None))})
# 마디(4박) 경계: 비트 간격이 8분음표처럼 짧으면 8개 묶음을 1마디로
step = float(np.median(np.diff(beats))) if len(beats) > 2 else 60 / tempo
beats_per_bar = 4
if a.bpm: step = 60 / a.bpm
bar_len = step * beats_per_bar

# 4. 보컬 분리
voc = wav
if not a.no_separate:
    out = os.path.join(work, 'sep')
    voc_path = os.path.join(out, 'htdemucs', 'full', 'vocals.wav')
    if not os.path.exists(voc_path):
        subprocess.run([sys.executable, '-m', 'demucs.separate', '-n', 'htdemucs', '--two-stems=vocals', '-d', 'cpu', '-o', out, wav], check=True)
    voc = voc_path

# 5. 음성 인식 (가사를 prompt로 줘서 환각 감소)
from faster_whisper import WhisperModel
yv, _ = librosa.load(voc, sr=16000, mono=True)
model = WhisperModel(a.model, device='cpu', compute_type='int8')
prompt = ' '.join(l['en'] for l in lines)
segs, _ = model.transcribe(yv, word_timestamps=True, language=a.lang, vad_filter=False,
                           condition_on_previous_text=False, initial_prompt=prompt, beam_size=5)
words = [(w.start, w.end, w.word.strip()) for s in segs for w in s.words]

# 6. 가사 정렬: 인식 단어 <-> 가사 단어 시퀀스 매칭
norm = lambda s: re.sub(r"[^a-z0-9가-힣ぁ-んァ-ヶ一-龥]", '', s.lower())
lyr_tokens = []  # (line_idx, word_idx, norm)
for li, l in enumerate(lines):
    for wi, w in enumerate(l['en'].replace('-', ' ').split()):
        lyr_tokens.append((li, wi, norm(w)))
asr_norm = [norm(w[2]) for w in words]
sm = difflib.SequenceMatcher(None, [t[2] for t in lyr_tokens], asr_norm, autojunk=False)
matched = {}
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        matched[blk.a + k] = words[blk.b + k]
coverage = len(matched) / max(1, len(lyr_tokens))

line_start = [None] * len(lines)
for idx, (li, wi, _) in enumerate(lyr_tokens):
    if idx in matched and line_start[li] is None:
        line_start[li] = matched[idx][0]

# 7. 보정: 못 찾은 줄은 앞뒤 줄 사이 보간, 전체가 실패하면 마디 격자에 균등 배치
mode = 'aligned'
if coverage < 0.4 or sum(s is not None for s in line_start) < max(2, len(lines) // 3):
    mode = 'bars-fallback'
    per = dur / len(lines)
    grid = [round(i * bar_len, 3) for i in range(int(dur / bar_len) + 1)]
    line_start = []
    for i in range(len(lines)):
        t = i * per
        line_start.append(min(grid, key=lambda g: abs(g - t)) if grid else t)
else:
    known = [(i, s) for i, s in enumerate(line_start) if s is not None]
    for i in range(len(lines)):
        if line_start[i] is None:
            prev = max([k for k in known if k[0] < i], default=(-1, 0.0), key=lambda k: k[0])
            nxt = min([k for k in known if k[0] > i], default=(len(lines), dur), key=lambda k: k[0])
            line_start[i] = prev[1] + (nxt[1] - prev[1]) * (i - prev[0]) / (nxt[0] - prev[0])

# 가장 가까운 비트로 스냅(선택): 비트와 0.12초 이내면 비트 위치로
def snap(t):
    if not beat_list: return t
    b = min(beat_list, key=lambda x: abs(x - t))
    return b if abs(b - t) <= 0.12 else t
for i in range(len(line_start)):
    line_start[i] = round(snap(line_start[i]), 3)
for i in range(1, len(line_start)):
    if line_start[i] <= line_start[i - 1]: line_start[i] = round(line_start[i - 1] + 0.1, 3)

result = {
    'name': a.name, 'duration': round(dur, 3), 'bpm': round(tempo, 1), 'beatStep': round(step, 3),
    'barLength': round(bar_len, 3), 'beats': beat_list, 'onsets': [round(float(o), 3) for o in onsets],
    'tempoCandidates': cands, 'alignMode': mode, 'coverage': round(coverage, 2),
    'asrWords': [{'s': round(s, 2), 'e': round(e, 2), 'w': w} for s, e, w in words],
    'lines': [dict(l, start=line_start[i]) for i, l in enumerate(lines)],
}
os.makedirs(os.path.join(ROOT, 'public', 'data'), exist_ok=True)
outp = os.path.join(ROOT, 'data', a.name + '.json')
json.dump(result, open(outp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"saved {outp}\nmode={mode} coverage={coverage:.0%} bpm={tempo:.1f} bar={bar_len:.2f}s beats={len(beat_list)}")
print('ASR:', ' '.join(w[2] for w in words)[:200])
for l in result['lines']: print(f"{l['start']:6.2f}  {l['en']}")
