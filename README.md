# Motion-studio — 가사 싱크 모션그래픽

곡별 폴더(`songs/<이름>/`) + 프리셋으로 가사 타이밍을 정렬·분석·보정한 뒤 영상으로 만든다.

## 사용
```bash
pip install -r requirements.txt            # ffmpeg 필요
python3 -m tools.lyricsync presets         # 프리셋 목록 (ballad/rap/clean/fast/default)
python3 -m tools.lyricsync init mysong --audio a.mp3 --lyrics lyrics.txt --lang ko --preset rap
python3 -m tools.lyricsync run mysong      # 보컬분리 → 정렬 → BPM/비트 분석
python3 -m tools.lyricsync.serve           # http://localhost:8765 타이밍 에디터
```
- `lyrics.txt`는 줄 단위. `[00:12.5]` LRC 태그가 있으면 줄 시작 앵커로 사용.
- 곡별 세부 조정은 `songs/<이름>/song.json`의 `preset`, `overrides`(model/separate/vad/refine).
- `--engine even`: 모델 없이 초안 분배(테스트용).

## 산출물
- `words.json`: 줄/단어별 start·end·conf(신뢰도). 에디터에서 주황색 = 확인 필요.
- `beats.json`: BPM, 비트, 온셋, 에너지(10Hz).
