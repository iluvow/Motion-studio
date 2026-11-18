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
LOOP_A, LOOP_B, MORPH = 64, 195, 14                 # 반복 구간(프레임): 끝(B)에서 시작(A)으로 돌아갈 때 자세가 가장 비슷한 쌍. MORPH 프레임 동안 광학 흐름으로 자연스럽게 이어 붙임
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

dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
def warp(img, flow):
    h, w = flow.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
def morph(A, B, n):
    """A 자세에서 B 자세로 가는 중간 장면 n장 (양방향 광학 흐름으로 두 그림을 서로 끌어당겨 섞는다. 단순 크로스페이드처럼 두 겹으로 보이지 않는다)"""
    gA, gB = cv2.cvtColor(A, cv2.COLOR_BGR2GRAY), cv2.cvtColor(B, cv2.COLOR_BGR2GRAY)
    f01, f10 = dis.calc(gA, gB, None), dis.calc(gB, gA, None)
    out = []
    for k in range(1, n + 1):
        t = k / (n + 1)
        ft0 = -t * (1 - t) * f01 + t * t * f10
        ft1 = (1 - t) ** 2 * f01 - t * (1 - t) * f10
        I0, I1 = warp(A, ft0).astype(np.float32), warp(B, ft1).astype(np.float32)
        out.append(((1 - t) * I0 + t * I1).clip(0, 255).astype(np.uint8))
    return out
n_out = int(DUR * FPS)
timeline = frames[0:LOOP_B + 1]
bridge = morph(frames[LOOP_B], frames[LOOP_A], MORPH)
while len(timeline) < n_out:
    timeline += bridge + frames[LOOP_A:LOOP_B + 1]
timeline = timeline[:n_out]
print('출력 프레임', len(timeline))

H = (len(frames[0]) - CROP_TOP + EXT) * 2
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'1440x{H}', '-r', str(FPS), '-i', '-',
                      '-vf', 'crop=1440:2160:0:0' if H >= 2160 else 'pad=1440:2160', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', OUT], stdin=subprocess.PIPE)
for f in timeline:
    p.stdin.write(extend(f).tobytes())
p.stdin.close(); p.wait()
print('완료', OUT, 'H', H)
