"""
AI로 만든 고양이 연주 영상(연두색 배경 MP4)을 합성용 프레임 이미지로 바꾼다.
  1) 연두색 제거(번짐 제거 포함)  2) 바깥 윤곽선 빛(크림색 띠) + 은은한 주황 글로우를 구워 넣기
  3) 투명 WebP 프레임으로 저장 (프레임마다 움직이는 실루엣에 정확히 맞는 윤곽선)

사용: python prep_clip.py <clips 폴더> <출력 폴더> [clip이름 ...]
출력: <출력>/<clip>/f000.webp ... 과 <출력>/clips.json (프레임 수, 길이, 크기)
"""
import json
import os
import sys
from multiprocessing import Pool

import cv2
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
NAMES = sys.argv[3:] or ['strum_A', 'strum_B', 'idle', 'final_hit', 'smirk', 'look_down_up', 'tail_ear', 'headbang']
PAD = 60                          # 글로우가 가장자리에서 잘리지 않게 여백을 둔다
RIM, GLOW = (255, 238, 196), (255, 150, 70)
KER_R = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
KER_G = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def process(frame_bgr):
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB).astype(np.float32)
    rgb = cv2.copyMakeBorder(rgb, PAD, PAD, PAD, PAD, cv2.BORDER_CONSTANT, value=(0, 255, 0))
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    alpha = 1 - smooth(g - np.maximum(r, b), 55, 150)
    rgb[..., 1] = np.minimum(g, np.maximum(r, b) + 8)                   # 연두색 번짐 제거
    solid = (alpha > 0.3).astype(np.uint8)
    ring = np.clip(cv2.dilate(solid, KER_R).astype(np.float32) - alpha, 0, 1)
    ring = cv2.GaussianBlur(ring, (0, 0), 1.1)
    glow = cv2.GaussianBlur(cv2.dilate(solid, KER_G).astype(np.float32), (0, 0), 24) * 0.5
    # 아래에서 위로: 글로우 → 윤곽선 → 고양이 (미리 곱한 알파로 합성)
    def layer(color, a):
        c = np.zeros_like(rgb); c[...] = color
        return c * a[..., None], a
    out_rgb, out_a = layer(GLOW, np.clip(glow, 0, 1))
    for color, a in ((RIM, np.clip(ring, 0, 1)), (None, alpha)):
        c = rgb if color is None else np.broadcast_to(np.array(color, np.float32), rgb.shape)
        out_rgb = c * a[..., None] + out_rgb * (1 - a[..., None])
        out_a = a + out_a * (1 - a)
    straight = np.where(out_a[..., None] > 1e-4, out_rgb / np.maximum(out_a[..., None], 1e-4), 0)
    return np.dstack([np.clip(straight, 0, 255), out_a * 255]).astype(np.uint8)


def run(name):
    cap = cv2.VideoCapture(f'{SRC}/{name}.mp4')
    n_fps = cap.get(cv2.CAP_PROP_FPS)
    os.makedirs(f'{OUT}/{name}', exist_ok=True)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    i = 0
    while True:
        ok, f = cap.read()
        if not ok:
            break
        path = f'{OUT}/{name}/f{i:03d}.webp'
        if not os.path.exists(path):                 # 이미 처리한 프레임은 건너뜀
            Image.fromarray(process(f), 'RGBA').save(path, quality=92, alpha_quality=100, method=4)
        i += 1
    return name, {'frames': i, 'fps': round(n_fps, 3), 'duration': round(i / n_fps, 4),
                  'w': 1080 + 2 * PAD, 'h': 1324 + 2 * PAD, 'pad': PAD}


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    with Pool(4) as p:
        meta = dict(p.map(run, NAMES))
    json.dump(meta, open(f'{OUT}/clips.json', 'w'), indent=1)
    print(json.dumps(meta))
