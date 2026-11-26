#!/usr/bin/env python3
"""일본어 로마자 가사용 싱크: 음절(모라) 수 x 박자 격자를 보컬 onset에 맞춰 줄/음절 타이밍을 계산.
whisper가 노래를 못 알아듣는 곡(가공된 보컬, 빠른 곡)에서 사용.

사용:
  python pipeline/fit_moras.py <vocals.wav> <lyrics.txt> <name> --sections 12,7,6 --vocal-end 32.4 [--t0 1.8,2.4]
  --sections : 구간별 줄 수(콤마). 같은 속도로 이어지는 덩어리. 합계 = 가사 줄 수
결과: public/data/<name>.json 의 lines[].start / lines[].steps([[시각, 보이는 글자 수],...]) 갱신
"""
import sys, re, json, os, random, argparse
import numpy as np, librosa

ap = argparse.ArgumentParser()
ap.add_argument('vocals'); ap.add_argument('lyrics'); ap.add_argument('name')
ap.add_argument('--sections', required=True)
ap.add_argument('--vocal-end', type=float, default=0.0)
ap.add_argument('--t0', default='1.8,2.4')
ap.add_argument('--seed', type=int, default=1)
ap.add_argument('--fixed-t0', type=float, default=None, help='시작 시각을 고정하고 마디 구조로 계산(탐색 생략)')
ap.add_argument('--bars', default=None, help='구간별 마디 수 (예: 7,5,5). --fixed-t0와 함께 사용')
ap.add_argument('--mult', default=None, help='구간별 음절 길이 배수 (예: 1,2,2)')
ap.add_argument('--unit', type=float, required=True, help='16분음표 길이(초) = 60/BPM/4')
a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOK = re.compile(r"(?:ch|sh|ts|ny|py|hy|my|ry|gy|by|ky|jy|[bdfghjkmnprstwyz])?[aiueo]|n(?![aiueo])|[ptkcs](?=[ptkcs])", re.I)

def tokens(text):
    """로마자 문장 -> [(모라 끝 글자 인덱스)]"""
    ends = []
    for m in TOK.finditer(text):
        ends.append(m.end())
    return ends

blocks = [b.strip().split('\n') for b in re.split(r'\n\s*\n', open(a.lyrics, encoding='utf-8').read().strip())]
en = [b[0].strip().lstrip('!').strip() for b in blocks]
toks = [tokens(e) for e in en]
sec = [int(x) for x in a.sections.split(',')]
assert sum(sec) == len(en), f'sections {sum(sec)} != lines {len(en)}'
mor = [len(t) for t in toks]
groups, i = [], 0
for n in sec: groups.append(mor[i:i + n]); i += n

y, sr = librosa.load(a.vocals, sr=22050, mono=True)
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
on = np.array(librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=256, units='time', delta=0.08, wait=3))

def build(p):
    t = p[0]; starts = []; pts = []; units = []
    k = 1
    for gi, g in enumerate(groups):
        u = p[k]; gap = p[k + 1]; k += 2
        for m in g:
            starts.append(t); units.append(u); pts += [t + u * j for j in range(m)]; t += m * u
        t += gap
    return starts, units, np.array(pts)

def obj(p):
    st, un, pts = build(p)
    d = np.abs(pts[:, None] - on[None, :]).min(1)
    s = float(np.sum(np.exp(-(d / 0.035) ** 2)))
    last = pts[-1]; lo, hi = a.vocal_end - 1.0, a.vocal_end + 0.2
    pen = 0 if lo <= last <= hi else 6 * min(abs(last - lo), abs(last - hi))
    return s - pen

if a.fixed_t0 is not None:
    bars = [int(x) for x in a.bars.split(',')]; mult = [float(x) for x in a.mult.split(',')]
    barlen = a.unit * 16; p = [a.fixed_t0]; tt = a.fixed_t0
    for g in range(len(groups)):
        p += [a.unit * mult[g], 0.0]
    st, un, pts = build(p)
    # 구간 시작을 마디 경계로 맞춤
    st2, un2, pts2 = [], [], []; i = 0; tstart = a.fixed_t0
    for g, n in enumerate(sec if False else [len(x) for x in groups]):
        t = tstart
        for m in groups[g]:
            st2.append(t); un2.append(a.unit * mult[g]); pts2 += [t + a.unit * mult[g] * j for j in range(m)]; t += m * a.unit * mult[g]
        tstart += bars[g] * barlen
    st, un, pts = st2, un2, np.array(pts2)
    d_ = np.abs(pts[:, None] - on[None, :]).min(1)
    score = float(np.sum(np.exp(-(d_ / 0.035) ** 2))); p = None
    print(f'fixed structure: score {score:.1f} / {len(pts)} moras, last mora {pts[-1]:.2f}s')
    path = os.path.join(ROOT, 'public', 'data', a.name + '.json')
    d = json.load(open(path, encoding='utf-8'))
    for i, l in enumerate(d['lines']):
        l['start'] = round(float(st[i]), 3)
        l['steps'] = [[round(float(st[i] + un[i] * j), 3), e] for j, e in enumerate(toks[i])]
        l['unit'] = round(float(un[i]), 4)
    d['alignMode'] = 'moras-fixed'
    json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for i, l in enumerate(d['lines']): print(f"{l['start']:6.2f} {len(l['steps']):2d}  {l['en']}")
    sys.exit(0)
lo0, hi0 = [float(x) for x in a.t0.split(',')]
random.seed(a.seed); best = (-1e9, None)
ng = len(groups)
import itertools
for mult in itertools.product([1.0, 1.5, 2.0], repeat=ng):
    base = [a.unit * m for m in mult]
    for r in range(6):
        p = [random.uniform(lo0, hi0)]
        for g in range(ng): p += [base[g], random.uniform(0, 0.8)]
        cur = obj(p)
        for it in range(500):
            j = random.randrange(len(p)); q = list(p)
            if j == 0 or j % 2 == 0: q[j] += random.gauss(0, 0.05)
            else: q[j] += random.gauss(0, 0.0007)
            if q[0] < lo0 - 0.3 or q[0] > hi0 + 0.3: continue
            if any(abs(q[1 + 2 * g] - base[g]) > 0.004 or q[2 + 2 * g] < 0 for g in range(ng)): continue
            v = obj(q)
            if v >= cur: p, cur = q, v
        if cur > best[0]: best = (cur, p)
score, p = best
st, un, pts = build(p)
print(f'score {score:.1f} / {len(pts)} moras, last mora {pts[-1]:.2f}s, onsets {len(on)}')
print('section unit/gap:', [(round(p[1 + 2 * g], 3), round(p[2 + 2 * g], 2)) for g in range(ng)])

path = os.path.join(ROOT, 'public', 'data', a.name + '.json')
d = json.load(open(path, encoding='utf-8'))
assert len(d['lines']) == len(en)
for i, l in enumerate(d['lines']):
    l['start'] = round(float(st[i]), 3)
    l['steps'] = [[round(float(st[i] + un[i] * j), 3), e] for j, e in enumerate(toks[i])]
    l['unit'] = round(float(un[i]), 4)
d['alignMode'] = 'moras'
json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for i, l in enumerate(d['lines']): print(f"{l['start']:6.2f} {len(l['steps']):2d}  {l['en']}")
