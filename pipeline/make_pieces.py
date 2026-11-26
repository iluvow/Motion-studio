#!/usr/bin/env python3
"""한 단어(길면 음절 조각)씩 보여주기 위한 조각 데이터 생성.
사용: python pipeline/make_pieces.py <name> data/<name>_wordko.json [--max 4]
- 일본어 단어를 모라 경계에서 최대 N글자(알파벳 기준)로 쪼갬 (예: hunzuke -> HUN / ZUKE)
- 각 조각이 나오는 시각 = 그 조각 첫 음절의 시각(lines[].steps)
- 한글은 단어 단위(wordko.json: 줄마다 일본어 단어 수만큼)로 짝지어 같은 조각에 붙음
"""
import sys, re, json, os
name, kopath = sys.argv[1], sys.argv[2]
mx = int(sys.argv[sys.argv.index('--max') + 1]) if '--max' in sys.argv else 4
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(ROOT, 'public', 'data', name + '.json')
d = json.load(open(path, encoding='utf-8')); kos = json.load(open(kopath, encoding='utf-8'))
TOK = re.compile(r"(?:ch|sh|ts|ny|py|hy|my|ry|gy|by|ky|jy|[bdfghjkmnprstwyz])?[aiueo]|n(?![aiueo])|[ptkcs](?=[ptkcs])", re.I)
assert len(kos) == len(d['lines'])
for li, l in enumerate(d['lines']):
    en = l['en']; moras = [(m.start(), m.end()) for m in TOK.finditer(en)]
    words = [(m.start(), m.end()) for m in re.finditer(r"[^\s-]+", en)]
    assert len(words) == len(kos[li]), (li, en, len(words), len(kos[li]))
    pieces = []
    for wi, (ws, we) in enumerate(words):
        idx = [j for j, (a, b) in enumerate(moras) if a >= ws and b <= we + 1]
        cur = []
        def flush():
            if not cur: return
            a = moras[cur[0]][0]; b = moras[cur[-1]][1]
            if cur[-1] == idx[-1]: b = we  # 단어 끝 구두점(?,)까지 포함
            pieces.append({'t': l['steps'][cur[0]][0], 'en': en[a:b], 'ko': kos[li][wi]})
        n = 0
        for j in idx:
            ln = moras[j][1] - moras[j][0]
            if cur and n + ln > mx: flush(); cur = []; n = 0
            cur.append(j); n += ln
        flush()
    l['pieces'] = pieces
json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for li in (0, 2, 5, 12, 14, 19, 22, 24): print(li, ' | '.join(f"{p['en']}({p['ko']})@{p['t']}" for p in d['lines'][li]['pieces']))
