"""
차 안 고양이 클립(1280x720, 24fps) → 오른쪽을 어두운 차 내부로 이어 붙여 시점을 옮긴 16:9(1440x810) 반복 배경 (무음, 24fps).
 1) 별 모양 워터마크 지우기  2) 오른쪽으로 PAD 만큼 반사+흐림으로 확장 후 X0 부터 W 폭을 자름
 3) 자세가 가장 비슷한 두 프레임(A,B)을 광학 흐름으로 이어 붙이며 길이까지 반복  4) 재생 속도 SLOW 배(0.85=약간 느리게) 반영은 이후 ffmpeg 에서
사용: python prep_bg_car.py <입력.mp4> <출력.mp4> <원본 프레임 수> <A> <B> [morph=14]
"""
import subprocess, sys
import cv2, numpy as np

SRC, OUT, N = sys.argv[1], sys.argv[2], int(sys.argv[3])
A, B = int(sys.argv[4]), int(sys.argv[5]); MORPH = int(sys.argv[6]) if len(sys.argv) > 6 else 14
X0, W, OW, OH = 190, 1274, 1440, 810
PAD = X0 + W - 1280
cap = cv2.VideoCapture(SRC); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
def unstar(f):
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    m = np.zeros(g.shape, np.uint8); m[540:700, 1050:1260] = 255
    s = cv2.dilate(((g > 120).astype(np.uint8)) * m, np.ones((13, 13), np.uint8))
    return cv2.inpaint(f, s, 5, cv2.INPAINT_TELEA)
def prep(f):
    f = unstar(f)
    ext = cv2.copyMakeBorder(f, 0, 0, 0, PAD, cv2.BORDER_REFLECT_101)
    blur = cv2.GaussianBlur(ext, (0, 0), 14)
    w = np.clip((np.arange(ext.shape[1]) - 1280 + 20) / 60.0, 0, 1)[None, :, None]
    ext = (ext * (1 - w) + blur * w).astype(np.uint8)[:, X0:X0 + W]
    return cv2.resize(ext, (OW, 814), interpolation=cv2.INTER_LANCZOS4)[2:2 + OH]
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
timeline = frames[0:B + 1]
bridge = morph(frames[B], frames[A], MORPH)
while len(timeline) < N:
    timeline += bridge + frames[A:B + 1]
timeline = timeline[:N]
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{OW}x{OH}', '-r', '24', '-i', '-',
                      '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', OUT], stdin=subprocess.PIPE)
for f in timeline:
    p.stdin.write(prep(f).tobytes())
p.stdin.close(); p.wait()
print('완료', OUT, len(timeline))
