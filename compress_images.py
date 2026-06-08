"""
Meal images'ları 800x450 JPEG'e küçültür ve sıkıştırır.
2816x1536 -> 800x450: 12x daha az piksel = çok daha hızlı decode
16:9 en-boy oranı korunur.
"""
from PIL import Image
import os

INPUT_DIR = r"c:\Users\Gaming\BioBistro\mobile\assets\images"
MAX_WIDTH  = 800
QUALITY    = 82

compressed = 0
skipped    = 0

for i in range(1, 41):
    src = os.path.join(INPUT_DIR, f"{i}.png")
    if not os.path.exists(src):
        print(f"  SKIP {i}.png bulunamadi")
        skipped += 1
        continue

    original_size = os.path.getsize(src)
    img = Image.open(src).convert("RGB")
    w, h = img.size

    # En-boy oranini koruyarak MAX_WIDTH'e küçült
    if w > MAX_WIDTH:
        new_h = int(h * MAX_WIDTH / w)
        img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)

    new_w, new_h = img.size
    img.save(src, format="JPEG", quality=QUALITY, optimize=True)

    new_size = os.path.getsize(src)
    ratio = (1 - new_size / original_size) * 100
    print(f"  OK {i}.png: {original_size//1024}KB -> {new_size//1024}KB (-%{ratio:.0f}) | {w}x{h} -> {new_w}x{new_h}")
    compressed += 1

print(f"\nToplam: {compressed} resim islendi, {skipped} atlandi.")
