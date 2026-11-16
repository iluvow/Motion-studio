"""가사 정렬: 음원 + 가사 텍스트 -> 단어별 타임스탬프 (words.json)

engine=stable : stable-ts(Whisper) 강제 정렬 (실사용)
engine=even   : 모델 없이 LRC 줄 시간/글자 수 비례로 분배 (초안·테스트용)
"""
import re, json, subprocess, shutil
from pathlib import Path
from .common import audio_duration

LRC = re.compile(r"^\[(\d+):(\d+(?:\.\d+)?)\](.*)$")


def read_lyrics(path):
    """줄 단위로 읽는다. [mm:ss.xx] 태그가 있으면 줄 시작 시각으로 사용."""
    lines = []
    for raw in Path(path).read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw:
            continue
        m = LRC.match(raw)
        if m:
            lines.append({"text": m.group(3).strip(), "t": int(m.group(1)) * 60 + float(m.group(2))})
        else:
            lines.append({"text": raw, "t": None})
    return [l for l in lines if l["text"]]


def separate_vocals(audio, workdir):
    out = Path(workdir) / "demucs"
    voc = out / "htdemucs" / Path(audio).stem / "vocals.wav"
    if voc.exists():
        return voc
    subprocess.run(["python3", "-m", "demucs", "--two-stems=vocals", "-o", str(out), str(audio)], check=True)
    return voc


def align_even(audio, lines):
    dur = audio_duration(audio)
    starts = [l["t"] for l in lines]
    # 태그 없는 줄은 앞뒤 태그 사이를 글자 수 비례로 채움
    if all(s is None for s in starts):
        w = [max(len(l["text"]), 1) for l in lines]
        tot, acc = sum(w), 0
        for l, x in zip(lines, w):
            l["t"] = dur * acc / tot
            acc += x
    for i, l in enumerate(lines):
        if l["t"] is None:
            l["t"] = lines[i - 1]["t"] + 2 if i else 0.0
    out = []
    for i, l in enumerate(lines):
        start = l["t"]
        end = lines[i + 1]["t"] if i + 1 < len(lines) else min(start + 4, dur)
        end = min(end, start + 8)  # 간주 구간이 한 줄에 몰리지 않게
        toks = l["text"].split()
        wts = [max(len(t), 1) for t in toks]
        tot, acc, words = sum(wts), 0, []
        for t, x in zip(toks, wts):
            words.append({"text": t, "start": round(start + (end - start) * acc / tot, 3),
                          "end": round(start + (end - start) * (acc + x) / tot, 3), "conf": None})
            acc += x
        out.append({"text": l["text"], "start": round(start, 3), "end": round(end, 3), "words": words})
    return out


def align_stable(audio, lines, language, preset, workdir):
    try:
        import stable_whisper
    except ImportError:
        raise SystemExit("stable-ts가 없습니다: pip install -r requirements.txt")
    src = separate_vocals(audio, workdir) if preset["separate"] else audio
    model = stable_whisper.load_model(preset["model"])
    text = "\n".join(l["text"] for l in lines)
    res = model.align(str(src), text, language=language, original_split=True, vad=preset["vad"])
    if preset.get("refine"):
        model.refine(str(src), res)
    out = []
    for seg in res.segments:
        words = [{"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3),
                  "conf": round(getattr(w, "probability", None) or 0, 3)} for w in seg.words if w.word.strip()]
        if words:
            out.append({"text": seg.text.strip(), "start": words[0]["start"], "end": words[-1]["end"], "words": words})
    return out


def run(name_dir, cfg, preset, engine):
    d = Path(name_dir)
    audio = d / cfg["audio"]
    lines = read_lyrics(d / cfg.get("lyrics", "lyrics.txt"))
    if engine == "even":
        out = align_even(audio, lines)
    else:
        out = align_stable(audio, lines, cfg.get("language"), preset, d / "work")
    data = {"audio": cfg["audio"], "duration": round(audio_duration(audio), 3),
            "engine": engine, "lines": out}
    (d / "words.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    return data
