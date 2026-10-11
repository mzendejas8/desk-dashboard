"""Turn a loose character sheet (uneven spacing, glow, labels) into a clean
grid sprite sheet the walker widget can slice.

    python tools/slice_sprites.py SOURCE.png

Writes assets/me.png (one animation per row, every frame the same size) and
assets/me.json (frame size + which row/how many frames each animation has).
Needs Pillow, numpy, scipy.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# Row order in the source image, top to bottom.
ANIMATIONS = ["idle", "walkRight", "walkLeft", "drinkStand", "drinkWalk"]
ALPHA_MIN = 230      # glow is ~175 alpha, the character is ~250+
LABEL_MAX_X = 225    # text labels sit left of this
MIN_PIXELS = 1000    # ignore stray specks
PAD = 4

root = Path(__file__).resolve().parent.parent
src = np.array(Image.open(sys.argv[1]).convert("RGBA"))

# 1. Strip the glow: keep only (nearly) solid pixels, make them fully solid.
solid = src[..., 3] >= ALPHA_MIN
src[..., 3] = np.where(solid, 255, 0)

# 2. Find each character as one connected blob of solid pixels.
labels, _ = ndimage.label(solid, structure=np.ones((3, 3)))
sprites = []
for i, box in enumerate(ndimage.find_objects(labels), start=1):
    ys, xs = box
    if xs.start < LABEL_MAX_X or (labels[box] == i).sum() < MIN_PIXELS:
        continue
    sprites.append((ys, xs, i))

# 3. Group blobs into rows by vertical position, left-to-right within a row.
sprites.sort(key=lambda s: s[0].start)
rows = []
for s in sprites:
    if rows and s[0].start < rows[-1][0][0].stop:
        rows[-1].append(s)
    else:
        rows.append([s])
rows = [sorted(r, key=lambda s: s[1].start) for r in rows]
assert len(rows) == len(ANIMATIONS), f"found {len(rows)} rows, expected {len(ANIMATIONS)}"


def head_center_x(ys, xs, i):
    # Center on the head (top 35%), not the whole box, so swinging arms/legs
    # and the coffee cup don't make the body jitter left and right.
    blob = labels[ys, xs] == i
    top = blob[: int(blob.shape[0] * 0.35)]
    return xs.start + np.nonzero(top)[1].mean()


half_w = max(max(c - s[1].start, s[1].stop - c) for r in rows for s in r
             for c in [head_center_x(*s)])
frame_w = int(np.ceil(half_w * 2)) + PAD * 2
frame_h = max(s[0].stop - s[0].start for r in rows for s in r) + PAD * 2
cols = max(len(r) for r in rows)

# 4. Paste every frame into an identical cell: head centered, feet on the floor.
sheet = Image.new("RGBA", (cols * frame_w, len(rows) * frame_h), (0, 0, 0, 0))
meta = {"frameWidth": frame_w, "frameHeight": frame_h, "animations": {}}
for r, (name, row) in enumerate(zip(ANIMATIONS, rows)):
    for c, (ys, xs, i) in enumerate(row):
        crop = src[ys, xs].copy()
        crop[labels[ys, xs] != i] = 0           # drop bits of neighbours
        cx = head_center_x(ys, xs, i) - xs.start
        x = c * frame_w + round(frame_w / 2 - cx)
        y = (r + 1) * frame_h - PAD - crop.shape[0]
        sheet.alpha_composite(Image.fromarray(crop), (x, y))
    meta["animations"][name] = {"row": r, "frames": len(row)}

sheet.save(root / "assets" / "me.png")
(root / "assets" / "me.json").write_text(json.dumps(meta, indent=2) + "\n")
print(json.dumps(meta, indent=2))
