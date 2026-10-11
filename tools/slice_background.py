"""Cut the walker's background pieces out of a generated image on magenta.

    python tools/slice_background.py SOURCE.(png|jpg)

Expects, left to right: a tall wall+floor strip (ignored: the office wall now
comes from slice_office.py), the desk, the coffee station, and (optionally) a
scale-reference character, which is dropped.

Writes assets/desk.png and assets/coffee.png and merges their sizes into
assets/bg.json, at the same scale as assets/me.png (so the widget draws them
with the same WALKER_SCALE as the character).
Needs Pillow, numpy, scipy.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

PROP_SCALE = 0.65    # desk/coffee a bit bigger: he's chibi, furniture matches his body not his head
MIRROR = {"coffee"}   # flip these left-right so they face into the room
MIN_PIXELS = 5000

root = Path(__file__).resolve().parent.parent
src = np.array(Image.open(sys.argv[1]).convert("RGB")).astype(int)
r, g, b = src[..., 0], src[..., 1], src[..., 2]

# 1. Key out magenta. JPEG smears it, so use a tolerance, not an exact match.
magenta = (r > 150) & (b > 150) & (g < 110) & (abs(r - b) < 80)
solid = ndimage.binary_opening(~magenta, iterations=1)

# 2. De-fringe: pixels near the edge pick up a pink tint from the background.
#    Pull red/blue back toward green there.
edge = solid & ~ndimage.binary_erosion(solid, iterations=3)
pink = edge & (r - g > 30) & (b - g > 30)
src[pink, 0] = np.minimum(r[pink], g[pink] + 20)
src[pink, 2] = np.minimum(b[pink], g[pink] + 20)

rgba = np.dstack([src, np.where(solid, 255, 0)]).astype(np.uint8)

# 3. One connected blob per asset, ordered left to right.
labels, _ = ndimage.label(solid, structure=np.ones((3, 3)))
blobs = []
for i, box in enumerate(ndimage.find_objects(labels), start=1):
    if (labels[box] == i).sum() >= MIN_PIXELS:
        blobs.append((box[1].start, box, i))
blobs.sort()
assert len(blobs) >= 3, f"expected wall, desk, coffee; found {len(blobs)} pieces"
names = ["wall", "desk", "coffee"]


def cut(box, i):
    piece = rgba[box].copy()
    piece[labels[box] != i] = 0
    return Image.fromarray(piece)


def shrink(img, scale):
    w, h = img.size
    return img.resize((round(w * scale), round(h * scale)), Image.NEAREST)


meta_path = root / "assets" / "bg.json"
meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
for name, (_, box, i) in zip(names, blobs):
    img = cut(box, i)
    if name == "wall":
        continue
    img = shrink(img, PROP_SCALE)
    if name in MIRROR:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    img.save(root / "assets" / f"{name}.png")
    meta[name] = {"width": img.width, "height": img.height}

meta_path.write_text(json.dumps(meta, indent=2) + "\n")
print(json.dumps(meta, indent=2))
