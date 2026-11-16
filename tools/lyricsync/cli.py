import argparse, json, shutil, sys
from . import align, analyze
from .common import SONGS, PRESETS, load_config, song_dir


def cmd_init(a):
    d = SONGS / a.name
    d.mkdir(parents=True, exist_ok=True)
    audio_name = "audio" + (a.audio.suffix if a.audio else ".mp3")
    if a.audio:
        shutil.copy(a.audio, d / audio_name)
    cfg = {"title": a.name, "audio": audio_name, "lyrics": "lyrics.txt",
           "language": a.lang, "preset": a.preset, "overrides": {}}
    (d / "song.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
    if a.lyrics:
        shutil.copy(a.lyrics, d / "lyrics.txt")
    elif not (d / "lyrics.txt").exists():
        (d / "lyrics.txt").write_text("", encoding="utf-8")
    print(f"만들어짐: {d}\n  lyrics.txt에 가사를 넣고 `run {a.name}` 실행")


def cmd_run(a):
    d, cfg, preset = load_config(a.name)
    if a.preset:
        preset = {**PRESETS[a.preset], **cfg.get("overrides", {})}
    print(f"[{a.name}] preset={a.preset or cfg.get('preset')} engine={a.engine} {preset}")
    data = align.run(d, cfg, preset, a.engine)
    n = sum(len(l["words"]) for l in data["lines"])
    print(f"정렬 완료: {len(data['lines'])}줄 / {n}단어 -> words.json")
    if not a.no_analyze:
        b = analyze.run(d, cfg)
        print(f"분석 완료: BPM {b['bpm']}, 비트 {len(b['beats'])}개 -> beats.json")


def cmd_analyze(a):
    d, cfg, _ = load_config(a.name)
    b = analyze.run(d, cfg)
    print(f"BPM {b['bpm']}, 비트 {len(b['beats'])}개")


def cmd_presets(a):
    for k, v in PRESETS.items():
        print(f"{k:8} {v['desc']}")


def main():
    p = argparse.ArgumentParser(prog="lyricsync")
    s = p.add_subparsers(required=True)
    x = s.add_parser("init"); x.add_argument("name"); x.add_argument("--audio", type=__import__("pathlib").Path)
    x.add_argument("--lyrics", type=__import__("pathlib").Path); x.add_argument("--lang", default=None)
    x.add_argument("--preset", default="default", choices=PRESETS); x.set_defaults(f=cmd_init)
    x = s.add_parser("run"); x.add_argument("name"); x.add_argument("--preset", choices=PRESETS)
    x.add_argument("--engine", choices=["stable", "even"], default="stable")
    x.add_argument("--no-analyze", action="store_true"); x.set_defaults(f=cmd_run)
    x = s.add_parser("analyze"); x.add_argument("name"); x.set_defaults(f=cmd_analyze)
    x = s.add_parser("presets"); x.set_defaults(f=cmd_presets)
    a = p.parse_args(); a.f(a)
