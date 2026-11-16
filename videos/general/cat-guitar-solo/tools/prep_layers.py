"""
기타 고양이 이미지(연두색 배경)를 움직일 수 있는 '층'으로 나눈다.
  arm_*.png   : 몸통 + 연주 팔 (머리와 꼬리 제외)  — 연주 자세 5종
  head_*.png  : 머리 부분 (눈/고개 상태 5종)
  tail_*.png  : 꼬리 (기본/위로/오른쪽으로)
모든 층은 978x1608 캔버스에서 같은 좌표를 쓴다.

사용: python prep_layers.py <이미지폴더> <출력폴더>
이미지 파일 번호(업로드 순서): 2 원본, 7 내림, 8 올림, 9 눈감음, 10 중간, 11 고개숙임, 12 갸웃,
                               13 반쯤감음, 14 꼬리위, 16 꼬리오른쪽, 17 올림쪽 중간
"""
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 978, 1608

ARMS = {'down': '7', 'orig': '2', 'mid': '10', 'p17': '17', 'up': '8'}
HEADS = {'neutral': '7', 'nod': '11', 'tilt': '12', 'half': '13', 'blink': '9'}
TAIL_UP, TAIL_SWISH, TAIL_BASE = '14', '16', '2'

# 꼬리 다각형 (원본 이미지 좌표). 바지 가장자리 바로 왼쪽까지.
TAIL_POLY = [(38, 1098), (100, 1055), (140, 1080), (157, 1148), (182, 1182), (225, 1188),
             (246, 1166), (246, 1262), (222, 1264), (146, 1260), (98, 1220), (86, 1203)]
# 머리 영역: 위쪽 700행, 왼쪽 745열 (기타 헤드는 제외)
HEAD_ROWS, HEAD_COLS = 688, 745


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def load(num, resize=False):
    im = Image.open(f'{SRC}/{num}.webp').convert('RGB')
    if resize:
        im = im.resize((W, H), Image.LANCZOS)
    else:
        im = im.crop((0, 0, W, H))
    a = np.array(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    alpha = 1 - smooth(g - np.maximum(r, b), 55, 150)
    a[..., 1] = np.minimum(g, np.maximum(r, b) + 8)      # 연두색 번짐 제거
    return a, alpha


def rgba(rgb, alpha):
    return Image.fromarray(np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8))


def poly_mask(points, feather=1.5):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    m = cv2.GaussianBlur(np.array(m).astype(np.float32) / 255, (0, 0), feather)
    return m


def head_mask():
    m = np.zeros((H, W), np.float32)
    m[:HEAD_ROWS, :HEAD_COLS] = 1
    return m


def align_to(base_gray, num):
    """꼬리 이미지(1001x1572)를 기준 이미지 좌표로 맞춘다."""
    a, alpha = load(num, resize=True)
    g = cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
    mask = np.zeros((H, W), np.uint8)
    mask[700:1560, 200:960] = 255
    w = np.eye(2, 3, dtype=np.float32)
    _, w = cv2.findTransformECC(base_gray, g, w, cv2.MOTION_AFFINE,
                                (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 500, 1e-7), mask, 7)
    flags = cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP
    rgb = cv2.warpAffine(a, w, (W, H), flags=flags, borderMode=cv2.BORDER_REPLICATE)
    al = cv2.warpAffine(alpha.astype(np.float32), w, (W, H), flags=flags, borderValue=0)
    return rgb, al


def main():
    PM, HM = poly_mask(TAIL_POLY), head_mask()
    # 몸통 층에서는 꼬리 다각형을 바깥으로 4px 넓혀 가장자리 찌꺼기를 지운다 (바지 쪽 x>246은 건드리지 않음)
    wide = cv2.dilate((PM > 0.1).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
    wide[:, 247:] = 0
    PMW = cv2.GaussianBlur(np.maximum(wide, PM), (0, 0), 1.0)
    # 몸통 층: 머리 영역과 꼬리를 뺀 몸
    for name, num in ARMS.items():
        rgb, al = load(num)
        rgba(rgb, al * (1 - PMW) * (1 - HM)).save(f'{OUT}/arm_{name}.png')
    for name, num in HEADS.items():
        rgb, al = load(num)
        rgba(rgb, al * HM).save(f'{OUT}/head_{name}.png')
    # 꼬리 층
    base_rgb, base_al = load(TAIL_BASE)
    rgba(base_rgb, base_al * PM).save(f'{OUT}/tail_base.png')
    body_alpha = base_al * (1 - PMW) * (1 - HM)          # 몸이 차지하는 부분(꼬리 아래에 깔릴 곳)
    kernel = np.ones((5, 5), np.uint8)
    body_dil = cv2.dilate((body_alpha > 0.5).astype(np.uint8), kernel).astype(np.float32)
    base_gray = cv2.cvtColor(base_rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
    for name, num, box in (('up', TAIL_UP, (0, 760, 330, 1320)), ('swish', TAIL_SWISH, (540, 930, 930, 1300))):
        rgb, al = align_to(base_gray, num)
        x0, y0, x1, y1 = box
        sel = np.zeros((H, W), np.float32)
        sel[y0:y1, x0:x1] = 1
        # 몸과 겹치지 않는 부분만 꼬리로 인정 (뿌리 근처는 몸 아래에 깔리므로 그대로 둔다)
        keep = al * sel * (1 - body_dil * (1 - poly_mask([(200, 1120), (300, 1120), (300, 1300), (200, 1300)], 1)) ) \
            if name == 'up' else al * sel * (1 - body_dil)
        rgba(rgb, keep).save(f'{OUT}/tail_{name}.png')
    print('done', OUT)


main()
