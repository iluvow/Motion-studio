#!/usr/bin/env python3
"""드럼 박자 격자 + 줄별 박자 수로 줄/음절 타이밍 계산.
격자(t0, beat)는 드럼 스템에서 구한 값, 줄 길이(박)는 곡 구조에서 정함.
각 줄의 음절(모라)은 16분음표(beat/4) 간격으로 줄 시작부터 배치.

사용: python pipeline/grid_sync.py <name> --t0 0.448 --beat 0.4682 --first-eighth 7 --lens 2,2,4,... [--mora-div 4]
  --first-eighth : 첫 줄이 시작하는 8분음표 번호 (t = t0 + n*beat/2)
  --lens         : 줄마다 차지하는 박 수 (줄 개수만큼). 다음 줄 시작 = 이전 줄 시작 + lens*beat
"""
import sys, re, json, os, argparse
ap = argparse.ArgumentParser()
ap.add_argument('name'); ap.add_argument('--t0', type=float, required=True); ap.add_argument('--beat', type=float, required=True)
ap.add_argument('--first-eighth', type=int, required=True); ap.add_argument('--lens', required=True)
ap.add_argument('--mora-div', type=float, default=4.0)
ap.add_argument('--lyrics', default=None)
a = ap.parse_args()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(ROOT, 'public', 'data', a.name + '.json')
d = json.load(open(path, encoding='utf-8'))
lens = [float(x) for x in a.lens.split(',')]
assert len(lens) == len(d['lines']), (len(lens), len(d['lines']))
TOK = re.compile(r"(?:ch|sh|ts|ny|py|hy|my|ry|gy|by|ky|jy|[bdfghjkmnprstwyz])?[aiueo]|n(?![aiueo])|[ptkcs](?=[ptkcs])", re.I)
t = a.t0 + a.first_eighth * a.beat / 2
mu = a.beat / a.mora_div
for l, ln in zip(d['lines'], lens):
    l['start'] = round(t, 3)
    l['steps'] = [[round(t + mu * j, 3), m.end()] for j, m in enumerate(TOK.finditer(l['en']))]
    l['beatLen'] = ln
    t += ln * a.beat
d['beats'] = [round(a.t0 + k * a.beat, 3) for k in range(int((d['duration'] - a.t0) / a.beat) + 1)]
d['bpm'] = round(60 / a.beat, 1); d['beatStep'] = a.beat; d['alignMode'] = 'drum-grid'
json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('end of last line %.2f' % t)
for i, l in enumerate(d['lines']): print(f"{i:2d} {l['start']:6.2f} {l['beatLen']:.0f}박  {l['en']}")
