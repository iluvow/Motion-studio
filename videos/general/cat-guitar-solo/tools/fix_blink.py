"""
AI 영상에서 눈이 들쭉날쭉한 선으로 감기는 구간을, 그 직전/직후의 뜬 눈으로 덮어서 없앤다.
머리가 박자마다 끄덕이므로 프레임마다 머리 위치를 추적(위상 상관)해서 눈 조각을 같은 위치로 맞춘다.
prep_clip.py 가 불러 쓴다.
"""
import cv2
import numpy as np

HEAD = (slice(200, 720), slice(150, 850))        # 머리 전체 (위치 추적용)
EYE_BOX = (370, 448, 705, 590)                   # 눈 + 눈썹 영역 (x0, y0, x1, y1) — 첫 프레임 좌표
MARGIN = 5                                       # 감김 구간 앞뒤로 뜬 눈을 가져올 여유 프레임


def _gray(f):
    return cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32)


def _masked(g):
    """눈 영역은 평균값으로 지워서(눈이 바뀌어도 머리 위치 추적에 영향이 없게) 돌려준다"""
    g = g.copy()
    x0, y0, x1, y1 = EYE_BOX
    g[y0 - 10:y1 + 10, x0 - 10:x1 + 10] = g[HEAD].mean()
    return g


_WIN = None


def track(frames):
    """프레임마다 머리 위치(첫 프레임 기준 누적 이동량). 바로 이전 프레임과의 작은 이동을 이어서 더한다."""
    global _WIN
    if _WIN is None:
        _WIN = cv2.createHanningWindow((HEAD[1].stop - HEAD[1].start, HEAD[0].stop - HEAD[0].start), cv2.CV_32F)
    pos = [np.zeros(2, np.float32)]
    prev = _masked(_gray(frames[0]))[HEAD]
    for f in frames[1:]:
        cur = _masked(_gray(f))[HEAD]
        (dx, dy), _ = cv2.phaseCorrelate(prev, cur, _WIN)
        if abs(dx) > 12 or abs(dy) > 12:                 # 말이 안 되는 값은 버리고 이전 이동을 유지
            dx = dy = 0.0
        pos.append(pos[-1] + np.float32([dx, dy]))
        prev = cur
    return pos


def _mask(shape, box, dx, dy, feather=7):
    m = np.zeros(shape[:2], np.float32)
    x0, y0, x1, y1 = box
    m[int(y0 + dy):int(y1 + dy), int(x0 + dx):int(x1 + dx)] = 1
    return cv2.GaussianBlur(m, (0, 0), feather)[..., None]


def fix_span(frames, s, e, pos=None):
    """frames[s..e] (포함) 의 눈을 뜬 눈으로 덮는다. frames 는 BGR uint8 리스트(제자리 수정)."""
    pos = pos if pos is not None else track(frames)
    a_idx, b_idx = max(0, s - MARGIN), min(len(frames) - 1, e + MARGIN)
    refs = {a_idx: frames[a_idx].copy(), b_idx: frames[b_idx].copy()}
    for t in range(s - 2, e + 3):
        if t < 0 or t >= len(frames):
            continue
        orig = frames[t]
        w_b = float(np.clip((t - s) / max(1, e - s), 0, 1))                # 앞쪽 눈 → 뒤쪽 눈으로 서서히 넘어감
        out = np.zeros_like(orig, np.float32)
        for idx, wt in ((a_idx, 1 - w_b), (b_idx, w_b)):
            dx, dy = pos[t] - pos[idx]                                    # 참조 프레임 → 현재 프레임 머리 이동량
            M = np.float32([[1, 0, dx], [0, 1, dy]])
            out += wt * cv2.warpAffine(refs[idx], M, (orig.shape[1], orig.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        m = _mask(orig.shape, EYE_BOX, pos[t][0], pos[t][1])
        frames[t] = np.clip(orig.astype(np.float32) * (1 - m) + out * m, 0, 255).astype(np.uint8)
    return frames
