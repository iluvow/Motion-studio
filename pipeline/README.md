# 가사해석 영상 파이프라인

새 곡을 받으면 아래 순서로 진행합니다.

## 0. 환경 (최초 1회)
```bash
bash pipeline/setup.sh
```

## 1. 음원·가사 준비
- 음원: `public/<이름>.m4a` (mp4에서 추출: `ffmpeg -i in.mp4 -vn -c:a aac public/<이름>.m4a`)
- 가사: `data/<이름>_lyrics.txt` — 줄 묶음을 빈 줄로 구분, 묶음은 `원어 / 해석 / (선택) 보충`

- 후렴처럼 강한 줄은 영어 줄 맨 앞에 `!`를 붙이면 **큰 단어 모드**(굵은 대문자 한 단어씩, 박자마다 색 반전)

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
props 옵션: `colors`(두 색), `glow`(밝은 색 중앙 그라데이션), `bigH`(큰 단어 높이, 기본 0.42), `smallH`(작은 문장 크기, 기본 0.072),
`sparkle`, `zoomIn`(큰 단어→작은 문장 줌 전환), `showKo`(한글 해석), `width`/`height`(기본 1440x1080, 4:3).
레퍼런스 규칙: 글자는 항상 정중앙, 큰 단어는 높이 고정, 작은 문장은 음절 단위로 늘어남, 박자마다 반전.

배경 영상이 있는 스타일은 `src/Lyrics.tsx`(PC방 영상용)을 참고.

## 노래를 whisper가 못 알아들을 때 (일본어 로마자 가사 등)
보컬 분리(`.work/<이름>/sep/htdemucs/full/vocals.wav`)가 있으면 음절 수 x 박자 격자로 싱크:
```bash
.venv/bin/python pipeline/fit_moras.py <vocals.wav> data/<이름>_lyrics.txt <이름> --sections 12,7,6 --unit <16분음표초> --fixed-t0 <시작초> --bars 7,5,5 --mult 1,2,2
```
- `--unit` = 60/BPM/4 (BPM 1%만 틀려도 30초에 0.3초 어긋나니 후보 BPM을 비교해서 고르세요)
- 시작 시각(`--fixed-t0`)은 보컬 onset 일치도 점수와 마지막 음절이 보컬 끝과 맞는지로 정함
