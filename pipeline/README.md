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

## 싱크 (whisper가 가사를 못 알아듣는 곡: 가공된 보컬, 일본어 등)
1. 보컬/드럼 분리: `python -m demucs.separate -n htdemucs -d cpu -o .work/<이름>/sep4 .work/<이름>/full.wav` (vocals.wav, drums.wav)
2. 박자 격자: 드럼 스템의 onset에 (t0, beat)를 맞춰서 구함 (분석 스니펫 참고: 8분음표 격자 위상/간격 탐색)
3. 강제 정렬로 검증: `python pipeline/force_align.py <vocals.wav> data/<이름>_lyrics.txt <이름>` (MMS CTC 정렬. 신뢰도는 낮아도 줄 시작이 격자 위에 규칙적으로 떨어지면 구조가 맞는 것)
4. 확정: `python pipeline/grid_sync.py <이름> --t0 .. --beat .. --first-eighth N --lens 2,2,4,...`
   - 줄마다 차지하는 박 수(lens)로 줄 시작을 계산하고, 음절은 16분음표 간격으로 배치
- 주의: 박자 격자는 한 박 단위로 평행이동해도 점수가 비슷해서, 첫 줄 시작은 반드시 정렬기/인식 결과(독립 증거)로 확인하세요.
- 구버전 `fit_moras.py`는 추정 기반이라 쓰지 마세요.
