"""Turn a chibi sheet (3 rows × 8 poses on a flat dark background) into a
clean grid sprite sheet the walker widget can slice.

    python tools/slice_chibi.py "Chibi Girl Pixel Sprite Sheet.png" kid
    python tools/slice_chibi.py "ChatGPT Image Oct 16, 2026, 06_13_09 PM.png" baby

Writes assets/<name>.png + assets/<name>.json, same format as me.png / me.json.
Unlike me.png, the size is baked in here (scale), so the walker draws them at 1×.
Needs Pillow, numpy, scipy.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# Each animation is a list of (row, col) cells in the source, played in order.
# Source rows: 0 = standing, 8 directions · 1 = walking, 8 directions ·
# 2 = poses (cheer, shy, sit, drink, wave, crouch, back, nap).
# Col 2 faces right. There's one walking frame per direction, so walks
# alternate stand → stride.
ANIMATIONS = {
    "idle": [(0, 0)],
    "walkRight": [(0, 2), (1, 2)],
    "walkLeft": [(0, 4), (1, 4)],
    "wave": [(2, 4), (0, 0)],
    "cheer": [(2, 0), (2, 1)],
    "sit": [(2, 2)],
    "drink": [(2, 3)],
    "back": [(2, 6)],
}

# Per character: scale (source poses are ~240px tall) and whether walkLeft
# is mirrored from walkRight — the baby's col-4 walking pose faces right.
CHARACTERS = {
    "kid": {"scale": 0.25, "mirror_walk": False},   # ~60px, about 2/3 of me
    "baby": {"scale": 0.2, "mirror_walk": True},    # ~48px
}

BG_TOL = 12      # background is ~(17,18,24) plus a faint darker halo
SPECK = 40       # enclosed background bits smaller than this are kept (e.g. eye shine)
PAD = 2          # in output pixels

root = Path(__file__).resolve().parent.parent
src = np.array(Image.open(sys.argv[1]).convert("RGBA"))
name = sys.argv[2]
SCALE = CHARACTERS[name]["scale"]

# 1. Key out the background: background-colored regions that touch the edge
#    or are big (gaps between arms/legs). Outlines are pure black, so they stay.
#    The darkest hair shadows (~(25,16,15)) are within BG_TOL too, but they're
#    reddish and the background is bluish, so blue > red keeps them.
bg = np.median(src[:20, :, :3].reshape(-1, 3), axis=0)
rgb = src[..., :3].astype(int)
bglike = (np.abs(rgb - bg).max(-1) <= BG_TOL) & (rgb[..., 2] > rgb[..., 0])
labels, n = ndimage.label(bglike)
sizes = ndimage.sum(bglike, labels, range(1, n + 1))
edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])))
drop = [i for i in range(1, n + 1) if i in edge or sizes[i - 1] >= SPECK]
src[np.isin(labels, drop), 3] = 0
solid = src[..., 3] > 0


def runs(mask):
    """[(start, stop), …] of the True stretches in a 1-D mask."""
    edges = np.diff(np.concatenate([[0], mask.astype(int), [0]]))
    return list(zip(np.nonzero(edges == 1)[0], np.nonzero(edges == -1)[0]))


# 2. Find the grid: 3 bands of rows, then the poses within each band.
bands = [b for b in runs(solid.any(1)) if b[1] - b[0] > 50]
assert len(bands) == 3, f"found {len(bands)} rows, expected 3"
cells = []
for y0, y1 in bands:
    cols = [c for c in runs(solid[y0:y1].any(0)) if c[1] - c[0] > 20]
    assert len(cols) == 8, f"found {len(cols)} poses in a row, expected 8"
    cells.append([(slice(y0, y1), slice(x0, x1)) for x0, x1 in cols])


# 3. Crop + shrink each pose. Pillow's resize blends alpha properly; then
#    snap alpha back to 0/255 so the edges stay crisp pixel-art.
def pose(r, c):
    ys, xs = cells[r][c]
    crop = src[ys, xs]
    yy, xx = np.nonzero(crop[..., 3])
    crop = crop[yy.min():yy.max() + 1, xx.min():xx.max() + 1]
    w, h = crop.shape[1], crop.shape[0]
    img = Image.fromarray(crop).resize((round(w * SCALE), round(h * SCALE)), Image.BOX)
    a = np.array(img)
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    return a


def center_x(a):
    top = a[: int(a.shape[0] * 0.35), :, 3]  # head, so swinging limbs don't jitter
    return np.nonzero(top)[1].mean()


frames = {anim: [pose(r, c) for r, c in cells_] for anim, cells_ in ANIMATIONS.items()}
if CHARACTERS[name]["mirror_walk"]:
    frames["walkLeft"] = [a[:, ::-1].copy() for a in frames["walkRight"]]
half_w = max(max(cx, a.shape[1] - cx) for fs in frames.values() for a in fs
             for cx in [center_x(a)])
frame_w = int(np.ceil(half_w * 2)) + PAD * 2
frame_h = max(a.shape[0] for fs in frames.values() for a in fs) + PAD * 2
cols = max(len(fs) for fs in frames.values())

# 4. Paste every frame into an identical cell: centered, feet on the floor.
sheet = Image.new("RGBA", (cols * frame_w, len(frames) * frame_h), (0, 0, 0, 0))
meta = {"frameWidth": frame_w, "frameHeight": frame_h, "animations": {}}
for r, (anim, fs) in enumerate(frames.items()):
    for c, a in enumerate(fs):
        x = c * frame_w + round(frame_w / 2 - center_x(a))
        y = (r + 1) * frame_h - PAD - a.shape[0]
        sheet.alpha_composite(Image.fromarray(a), (x, y))
    meta["animations"][anim] = {"row": r, "frames": len(fs)}

sheet.save(root / "assets" / f"{name}.png")
(root / "assets" / f"{name}.json").write_text(json.dumps(meta, indent=2) + "\n")
print(json.dumps(meta, indent=2))
