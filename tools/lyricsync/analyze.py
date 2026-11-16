"""음악 분석: BPM, 비트, 온셋, 에너지 -> beats.json (연출/스냅용)"""
import json
from pathlib import Path


def run(song_dir, cfg):
    try:
        import librosa, numpy as np
    except ImportError:
        raise SystemExit("librosa가 없습니다: pip install -r requirements.txt")
    d = Path(song_dir)
    y, sr = librosa.load(str(d / cfg["audio"]), sr=22050, mono=True)
    hop = 512
    tempo, beat_f = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
    beats = librosa.frames_to_time(beat_f, sr=sr, hop_length=hop)
    onsets = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop, units="time")
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    step = max(1, int(0.1 * sr / hop))  # 10Hz로 축소
    energy = rms[::step]
    energy = (energy / (energy.max() or 1)).round(3)
    data = {"bpm": round(float(np.atleast_1d(tempo)[0]), 1),
            "beats": [round(float(t), 3) for t in beats],
            "onsets": [round(float(t), 3) for t in onsets],
            "energy": {"rate": 10, "values": energy.tolist()}}
    (d / "beats.json").write_text(json.dumps(data), encoding="utf-8")
    return data
