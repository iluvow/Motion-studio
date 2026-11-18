"""
Veo 배경 클립(720x1280, 24fps) → 2:3 세로(1440x2160) 반복 배경 영상(무음).
 1) 별 모양 워터마크 지우기  2) 위쪽 하늘을 잘라 고양이를 위로 올리고 아래를 땅으로 연장(아래 18% 안전영역 확보)
 3) 2배 확대 4) 앞뒤를 크로스페이드로 이어 붙여 원하는 길이까지 반복
사용: python prep_bg.py <입력.mp4> <출력_24fps.mp4> <길이초>
"""
import subprocess, sys
import cv2, numpy as np

SRC, OUT, DUR = sys.argv[1], sys.argv[2], float(sys.argv[3])
FPS = 24
LOOP_START, LOOP_END, XFADE = 1.5, 8.5, 1.2          # 반복 구간(초)과 이어 붙일 때 겹치는 길이
CROP_TOP, EXT = 270, 70                               # 위에서 자를 행 수, 아래에 덧붙일 행 수(원본 해상도 기준)
STAR = (560, 1125, 640, 1195)                         # 워터마크 영역 x0,y0,x1,y1

cap = cv2.VideoCapture(SRC)
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    m = np.zeros(f.shape[:2], np.uint8); m[STAR[1]:STAR[3], STAR[0]:STAR[2]] = 255
    # 별만 찾아서 지운다 (주변보다 훨씬 밝은 점)
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    star = (g > 120).astype(np.uint8) * m
    star = cv2.dilate(star, np.ones((7, 7), np.uint8))
    f = cv2.inpaint(f, star, 5, cv2.INPAINT_TELEA)
    frames.append(f)
print('원본 프레임', len(frames))

def extend(f):
    c = f[CROP_TOP:]
    bottom = c[-40:][::-1]                                             # 아래쪽 땅을 거울처럼 이어 붙인 뒤 흐리게
    ext = np.concatenate([bottom, bottom])[:EXT]
    ext = cv2.GaussianBlur(ext, (0, 0), 6)
    k = np.linspace(1, 0.55, EXT)[:, None, None]
    out = np.concatenate([c, (ext * k).astype(np.uint8)])
    return cv2.resize(out, (1440, out.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)

a, b = int(LOOP_START * FPS), int(LOOP_END * FPS)
xf = int(XFADE * FPS)
seg = frames[a:b]
n_out = int(DUR * FPS)
# 순서: 처음 구간(0~LOOP_END) 한 번, 이후 반복 구간을 크로스페이드로 연결
seq = list(range(0, b))
timeline = [frames[i] for i in seq]
def blend_in(tl, nxt_frames):
    """tl 의 끝 xf 프레임을 nxt_frames 의 앞 xf 프레임과 섞고, 나머지를 이어 붙인다."""
    head, tail = tl[:-xf], tl[-xf:]
    mix = [cv2.addWeighted(tail[i], 1 - (i + 1) / (xf + 1), nxt_frames[i], (i + 1) / (xf + 1), 0) for i in range(xf)]
    return head + mix + nxt_frames[xf:]
while len(timeline) < n_out + xf:
    timeline = blend_in(timeline, seg)
timeline = timeline[:n_out]
print('출력 프레임', len(timeline))

H = (len(frames[0]) - CROP_TOP + EXT) * 2
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'1440x{H}', '-r', str(FPS), '-i', '-',
                      '-vf', 'crop=1440:2160:0:0' if H >= 2160 else 'pad=1440:2160', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', OUT], stdin=subprocess.PIPE)
for f in timeline:
    p.stdin.write(extend(f).tobytes())
p.stdin.close(); p.wait()
print('완료', OUT, 'H', H)
