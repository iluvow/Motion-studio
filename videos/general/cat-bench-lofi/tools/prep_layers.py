"""장면 이미지에서 고양이/벤치 부분을 부드러운 가장자리로 오려내고(미세한 숨쉬기용), 필름 그레인 프레임을 만든다.
사용: python prep_layers.py <public 폴더>  (scene.png 가 있어야 함)"""
import sys
import numpy as np
from PIL import Image, ImageFilter

pub = sys.argv[1]
im = Image.open(f'{pub}/scene.png').convert('RGB')
W, H = im.size                                   # 1440 x 2160
# 고양이 + 벤치 영역 (눈으로 확인한 좌표)
box = (690, 1350, 1310, 1890)
crop = im.crop(box).convert('RGBA')
mask = Image.new('L', crop.size, 0)
inner = Image.new('L', (crop.width - 90, crop.height - 90), 255)
mask.paste(inner, (45, 45))
mask = mask.filter(ImageFilter.GaussianBlur(26))
crop.putalpha(mask)
crop.save(f'{pub}/cats.png')
print('cats', box, crop.size)
# 필름 그레인 8장 (중간 회색 기준 노이즈, overlay 로 얹는다)
rng = np.random.default_rng(7)
for k in range(8):
    n = rng.normal(128, 38, (1080, 720)).clip(0, 255).astype(np.uint8)
    Image.fromarray(n, 'L').resize((W, H), Image.BICUBIC).save(f'{pub}/grain_{k}.png')
print('grain done')
