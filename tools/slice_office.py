"""Cut the office wall + decorations out of a generated image on magenta.

    python tools/slice_office.py SOURCE.(png|jpg)

Expects, left to right: a wall+carpet strip, then the decorations in DECOR
order. Writes assets/bg-tile.png and assets/<decor>.png, and merges their
sizes into assets/bg.json (desk/coffee come from slice_background.py).
Same scale as assets/me.png. Needs Pillow, numpy, scipy.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

DECOR = ["window", "whiteboard", "plant", "clock", "poster"]  # left to right, then top to bottom
TILE_HEIGHT = 320     # sprite-sheet px, about 2x the character
WALL_X = (0.04, 0.96) # trim the strip's shaded side edges so the seam disappears
FEET = 0.5            # where feet go: this far down the carpet band
DIM = {"wall": 0.7, "whiteboard": 0.75}   # darken to sit on a dark dashboard
DIM_DEFAULT = 0.85
MIN_PIXELS = 2000

root = Path(__file__).resolve().parent.parent
src = np.array(Image.open(sys.argv[1]).convert("RGB")).astype(int)
r, g, b = src[..., 0], src[..., 1], src[..., 2]

magenta = (r > 150) & (b > 150) & (g < 110) & (abs(r - b) < 80)
solid = ndimage.binary_opening(~magenta, iterations=1)
edge = solid & ~ndimage.binary_erosion(solid, iterations=3)
pink = edge & (r - g > 30) & (b - g > 30)
src[pink, 0] = np.minimum(r[pink], g[pink] + 20)
src[pink, 2] = np.minimum(b[pink], g[pink] + 20)
rgba = np.dstack([src, np.where(solid, 255, 0)]).astype(np.uint8)

labels, _ = ndimage.label(solid, structure=np.ones((3, 3)))
blobs = []
for i, box in enumerate(ndimage.find_objects(labels), start=1):
    if (labels[box] == i).sum() >= MIN_PIXELS:
        blobs.append((box[1].start // 50, box[0].start, box, i))  # column, then row
blobs.sort()
assert len(blobs) == 1 + len(DECOR), f"expected wall + {len(DECOR)} decor, found {len(blobs)}"


def cut(box, i, name):
    piece = rgba[box].copy()
    piece[labels[box] != i] = 0
    piece[..., :3] = (piece[..., :3] * DIM.get(name, DIM_DEFAULT)).astype(np.uint8)
    return Image.fromarray(piece)


# The wall sets the scale: its full height becomes TILE_HEIGHT.
_, _, wall_box, wall_i = blobs[0]
wall = cut(wall_box, wall_i, "wall")
scale = TILE_HEIGHT / wall.height
wall = wall.crop((round(wall.width * WALL_X[0]), 0, round(wall.width * WALL_X[1]), wall.height))

# Carpet = the last band below the darkest row (the baseboard's bottom edge).
rows = np.array(wall)[..., :3].mean(axis=(1, 2))
baseboard_bottom = int(np.argmin(rows[len(rows) // 2:])) + len(rows) // 2
while baseboard_bottom + 1 < len(rows) and rows[baseboard_bottom + 1] < rows[baseboard_bottom] + 15:
    baseboard_bottom += 1
feet = baseboard_bottom + (len(rows) - baseboard_bottom) * FEET


def shrink(img):
    return img.resize((round(img.width * scale), round(img.height * scale)), Image.NEAREST)


wall = shrink(wall)
wall.save(root / "assets" / "bg-tile.png")

meta_path = root / "assets" / "bg.json"
meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
meta["tile"] = {"width": wall.width, "height": wall.height, "feetY": round(feet * scale)}
for name, (_, _, box, i) in zip(DECOR, blobs[1:]):
    img = shrink(cut(box, i, name))
    img.save(root / "assets" / f"{name}.png")
    meta[name] = {"width": img.width, "height": img.height}

meta_path.write_text(json.dumps(meta, indent=2) + "\n")
print(json.dumps(meta, indent=2))
