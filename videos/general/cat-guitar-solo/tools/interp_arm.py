"""
연주 팔 자세(내림/원본/중간/17/올림) 사이의 중간 그림을 광학 흐름으로 만든다.
손이 10px 정도씩만 움직이도록 촘촘하게 채워서, 60fps에서 팔이 끊김 없이 움직이게 한다.

사용: python interp_arm.py <cat 폴더>      (arm_*.png 가 있는 폴더, 결과도 같은 폴더에 저장)
출력: arm_i###.png 와 arm_poses.json (이름과 손 높이 목록)
"""
import json
import sys

import cv2
import numpy as np
from PIL import Image

D = sys.argv[1]
STEP = 9.0                           # 손이 한 장마다 움직이는 최대 거리(px)
ORDER = [('down', 961), ('orig', 910), ('mid', 831), ('p17', 810), ('up', 768)]


def load(name):
    a = np.array(Image.open(f'{D}/arm_{name}.png')).astype(np.float32) / 255
    pm = np.dstack([a[..., :3] * a[..., 3:4], a[..., 3]])          # 미리 곱한 알파
    return pm


def gray(pm):
    rgb = pm[..., :3] + 0.5 * (1 - pm[..., 3:4])
    return (cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY))


def warp(img, flow):
    h, w = flow.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def save(pm, path):
    a = pm[..., 3:4]
    rgb = np.where(a > 1e-4, pm[..., :3] / np.maximum(a, 1e-4), 0)
    out = np.dstack([np.clip(rgb, 0, 1), np.clip(a, 0, 1)])
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(path)


def main():
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    poses = [{'name': n, 'y': y} for n, y in ORDER]
    out = []
    k = 0
    for i in range(len(ORDER) - 1):
        (na, ya), (nb, yb) = ORDER[i], ORDER[i + 1]
        A, B = load(na), load(nb)
        gA, gB = gray(A), gray(B)
        f01 = dis.calc(gA, gB, None)
        f10 = dis.calc(gB, gA, None)
        n_mid = max(0, int(np.ceil(abs(ya - yb) / STEP)) - 1)
        out.append({'name': na, 'y': ya})
        for j in range(1, n_mid + 1):
            t = j / (n_mid + 1)
            # 중간 시점에서 각 원본으로 가는 흐름 (Super SloMo 근사)
            ft0 = -t * (1 - t) * f01 + t * t * f10
            ft1 = (1 - t) ** 2 * f01 - t * (1 - t) * f10
            I0, I1 = warp(A, ft0), warp(B, ft1)
            blend = (1 - t) * I0 + t * I1
            # 두 그림이 서로 많이 다른 곳(손이 가리던 부분이 드러나는 곳)은 섞으면 손이 두 개로 보이므로
            # 시점이 가까운 쪽 그림을 그대로 쓴다.
            diff = np.abs(I0 - I1).max(axis=2)
            diff = cv2.GaussianBlur(diff, (0, 0), 2.0)
            m = np.clip((diff - 0.12) / 0.25, 0, 1)[..., None]
            near = I0 if t < 0.5 else I1
            I = (1 - m) * blend + m * near
            name = f'i{k:03d}'
            save(I, f'{D}/arm_{name}.png')
            out.append({'name': name, 'y': round(ya + (yb - ya) * t, 1)})
            k += 1
    out.append({'name': ORDER[-1][0], 'y': ORDER[-1][1]})
    json.dump(out, open(f'{D}/arm_poses.json', 'w'))
    print(len(out), 'poses:', [round(p['y']) for p in out])


main()
