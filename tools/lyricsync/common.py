import json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SONGS = ROOT / "songs"
PRESETS = json.loads((Path(__file__).parent / "presets.json").read_text(encoding="utf-8"))


def song_dir(name):
    d = SONGS / name
    if not d.is_dir():
        raise SystemExit(f"곡 폴더가 없습니다: {d}  (먼저 `init {name}`)")
    return d


def load_config(name):
    d = song_dir(name)
    cfg = json.loads((d / "song.json").read_text(encoding="utf-8"))
    preset = dict(PRESETS.get(cfg.get("preset", "default"), PRESETS["default"]))
    preset.update(cfg.get("overrides", {}))  # 곡별 개별 덮어쓰기
    return d, cfg, preset


def audio_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)
