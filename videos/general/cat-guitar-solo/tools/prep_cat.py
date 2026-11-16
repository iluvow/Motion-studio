"""연두색 배경을 지우고(디스필 포함) 따뜻한 윤곽선 빛 레이어를 입혀 투명 PNG로 저장한다.
사용: python prep_cat.py <입력폴더> <출력폴더>   (입력: down.webp up.webp blink.webp)"""
import sys, numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
names = {'down': '7.webp', 'up': '8.webp', 'blink': '9.webp'}
W, H = 978, 1608          # 세 장의 공통 크기 (1px 차이 맞춤)
RIM = (255, 238, 196)     # 윤곽선 색
def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
for k, f in names.items():
    im = Image.open(f'{src}/{f}').convert('RGB').crop((0, 0, W, H))
    a = np.array(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gd = g - np.maximum(r, b)
    alpha = 1 - smooth(gd, 55, 150)
    g2 = np.minimum(g, np.maximum(r, b) + 8)          # 연두색 번짐 제거
    rgb = np.stack([r, g2, b], -1)
    cat = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    # 윤곽선: 알파를 부풀린 뒤 원래 알파를 뺀 띠
    al = Image.fromarray((alpha * 255).astype(np.uint8))
    dil = np.array(al.filter(ImageFilter.MaxFilter(13))).astype(np.float32) / 255
    ring = np.clip(dil - alpha, 0, 1)
    rim = np.zeros((H, W, 4), np.uint8)
    rim[..., 0], rim[..., 1], rim[..., 2] = RIM
    rim[..., 3] = (ring * 255).astype(np.uint8)
    base = Image.fromarray(rim); base.alpha_composite(Image.fromarray(cat))
    base.save(f'{out}/{k}.png')
    print(k, base.size)
