"""
가로(16:9) 배경 클립 → 2:3 세로(1440x2160) 반복 배경 영상(무음, 24fps). 워터마크가 잘려 나가는 폭으로 자른다.
 1) x 위치에서 cw 만큼 세로로 자르기  2) 아래에 PAD 행을 번져 늘리고 흐리게(고양이를 위로 올려 아래 안전영역 확보)
 3) 자세가 가장 비슷한 두 프레임(A,B)을 골라 B→A 로 돌아갈 때 광학 흐름으로 이어 붙이며 길이까지 반복
사용: python prep_bg_wide.py <입력.mp4> <출력.mp4> <길이초> <cx> <cw> <pad> <A> <B> [morph=14] [출력폭=1440] [출력높이=2160]
환경변수 STAR=x0,y0,x1,y1 이면 그 안의 밝은 별 워터마크를 지운다 (자르기 전 원본 좌표).
"""
import subprocess, sys
import cv2, numpy as np

SRC, OUT, DUR = sys.argv[1], sys.argv[2], float(sys.argv[3])
CX, CW, PAD, A, B = (int(v) for v in sys.argv[4:9])
MORPH = int(sys.argv[9]) if len(sys.argv) > 9 else 14
OW = int(sys.argv[10]) if len(sys.argv) > 10 else 1440
OH = int(sys.argv[11]) if len(sys.argv) > 11 else 2160
import os
STAR = [int(v) for v in os.environ['STAR'].split(',')] if os.environ.get('STAR') else None
FPS = 24
cap = cv2.VideoCapture(SRC); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
H0 = frames[0].shape[0]
def unstar(f):
    if not STAR: return f
    f = f.copy(); x0, y0, x1, y1 = STAR
    m = np.zeros(f.shape[:2], np.uint8); m[y0:y1, x0:x1] = 255
    star = cv2.dilate(((cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) > 95).astype(np.uint8)) * m, np.ones((15, 15), np.uint8))
    return cv2.inpaint(f, star, 5, cv2.INPAINT_TELEA)
def prep(f):
    c = unstar(f)[:, CX:CX + CW]
    if PAD > 0:
        ext = cv2.GaussianBlur(np.repeat(c[-1:], PAD, axis=0), (0, 0), 3)
        k = np.linspace(1, 0.5, PAD)[:, None, None]
        c = np.concatenate([c, (ext * k).astype(np.uint8)])
    return cv2.resize(c, (OW, OH), interpolation=cv2.INTER_LANCZOS4)
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
def warp(img, flow):
    h, w = flow.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
def morph(P, Q, n):
    gP, gQ = cv2.cvtColor(P, cv2.COLOR_BGR2GRAY), cv2.cvtColor(Q, cv2.COLOR_BGR2GRAY)
    f01, f10 = dis.calc(gP, gQ, None), dis.calc(gQ, gP, None); out = []
    for k in range(1, n + 1):
        t = k / (n + 1)
        ft0 = -t * (1 - t) * f01 + t * t * f10; ft1 = (1 - t) ** 2 * f01 - t * (1 - t) * f10
        out.append(((1 - t) * warp(P, ft0).astype(np.float32) + t * warp(Q, ft1).astype(np.float32)).clip(0, 255).astype(np.uint8))
    return out
n_out = int(DUR * FPS)
timeline = frames[0:B + 1]
bridge = morph(frames[B], frames[A], MORPH)
while len(timeline) < n_out:
    timeline += bridge + frames[A:B + 1]
timeline = timeline[:n_out]
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{OW}x{OH}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', OUT], stdin=subprocess.PIPE)
for f in timeline:
    p.stdin.write(prep(f).tobytes())
p.stdin.close(); p.wait()
print('완료', OUT, len(timeline), '프레임')
