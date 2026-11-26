# 가사해석 영상 파이프라인

새 곡을 받으면 아래 순서로 진행합니다.

## 0. 환경 (최초 1회)
```bash
bash pipeline/setup.sh
```

## 1. 음원·가사 준비
- 음원: `public/<이름>.m4a` (mp4에서 추출: `ffmpeg -i in.mp4 -vn -c:a aac public/<이름>.m4a`)
- 가사: `data/<이름>_lyrics.txt` — 줄 묶음을 빈 줄로 구분, 묶음은 `원어 / 해석 / (선택) 보충`

## 2. 분석 (박자 + 가사 타이밍)
```bash
.venv/bin/python pipeline/analyze.py public/<이름>.m4a data/<이름>_lyrics.txt <이름> [--bpm 80] [--lang en]
```
- 결과: `public/data/<이름>.json` (beats, lines[].start 등)
- 보컬 분리(demucs) → 인식(whisper, 가사를 prompt로 사용) → 가사 정렬 → 가까운 박자에 스냅
- `alignMode`가 `bars-fallback`이면 인식 실패. JSON의 `lines[].start`를 직접 고치세요.
- 자동 박자 추정은 틀릴 수 있어요. `tempoCandidates`와 `beats`를 보고 맞지 않으면 `--bpm`으로 고정.

## 3. 렌더 (배경 없는 반전 스타일)
```bash
npx remotion render src/index.ts Invert out/<이름>.mp4 --props='{"name":"<이름>","audio":"<이름>.m4a"}'
```
props 옵션: `colors`(두 색), `flip`(line|beat|none), `position`(center|alternate),
`wordByWord`, `rgbSplit`, `fontSize`, `width`/`height`(기본 1080x1920).

배경 영상이 있는 스타일은 `src/Lyrics.tsx`(PC방 영상용)을 참고.
