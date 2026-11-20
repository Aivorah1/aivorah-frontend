"""
Finds the eyes, mouth and chin on every Learning Buddy picture so AI Teacher can
animate them (lip movement and blinking). Writes
src/screens/student/ai-teacher/avatar/buddyFaces.generated.ts.

Re-run after adding or replacing buddy pictures:
  py -3.12 -m venv .venv-faces
  .venv-faces/Scripts/python -m pip install "mediapipe==0.10.14" pillow
  .venv-faces/Scripts/python scripts/buddy-faces.py

Pictures where no face is found (or a face is found in the wrong place) are left
out; AI Teacher shows those with whole-picture motion only.
"""
import glob
import os

import mediapipe as mp
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets', 'learning-buddies')
OUT = os.path.join(ROOT, 'src', 'screens', 'student', 'ai-teacher', 'avatar', 'buddyFaces.generated.ts')
REL = '../../../../../assets/learning-buddies/'

# MediaPipe face-mesh landmark numbers (the picture's left/right as seen).
EYE_1 = [33, 133, 159, 145]     # outer corner, inner corner, upper lid, lower lid
EYE_2 = [263, 362, 386, 374]
MOUTH = [61, 291, 13, 14, 17]   # corners, inner upper lip, inner lower lip, outer lower lip
FACE = [152, 234, 454]          # chin, face edges

# Detected in the wrong place on visual review: leave these to whole-picture motion.
SKIP = set()

# Characters whose eyes sit inside dark fur patches (the panda): the face mesh finds them only
# roughly, so each eye is re-measured as the light opening inside its patch.
PATCH_EYES = {'pip'}


def match_mirrored(im, eye, guess):
    """Place the other eye where a left-right flipped copy of `eye` best matches, near `guess`."""
    import cv2
    h, w = im.shape[:2]
    xs = [p[0] for p in eye]; ys = [p[1] for p in eye]
    m = 0.35 * (max(xs) - min(xs))
    x0, x1, y0, y1 = int(min(xs) - m), int(max(xs) + m), int(min(ys) - m), int(max(ys) + m)
    if x0 < 0 or y0 < 0 or x1 > w or y1 > h:
        return guess
    tpl = np.ascontiguousarray(im[y0:y1, x0:x1][:, ::-1])
    gx = (min(p[0] for p in guess) + max(p[0] for p in guess)) / 2
    gy = (min(p[1] for p in guess) + max(p[1] for p in guess)) / 2
    r = 0.06 * w
    sx0, sy0 = int(max(0, gx - r - tpl.shape[1] / 2)), int(max(0, gy - r - tpl.shape[0] / 2))
    sx1, sy1 = int(min(w, gx + r + tpl.shape[1] / 2)), int(min(h, gy + r + tpl.shape[0] / 2))
    area = im[sy0:sy1, sx0:sx1]
    if area.shape[0] < tpl.shape[0] or area.shape[1] < tpl.shape[1]:
        return guess
    res = cv2.matchTemplate(area, tpl, cv2.TM_CCOEFF_NORMED)
    _, score, _, (bx, by) = cv2.minMaxLoc(res)
    if score < 0.5:
        return guess
    # Where the flipped template's box landed: map each eye point (mirrored inside the box) there.
    nx0, ny0 = sx0 + bx, sy0 + by
    return [(nx0 + (x1 - x), ny0 + (y - y0)) for x, y in eye]


def refine_patch_eye(im, pts):
    """pts = [outer, inner, upper, lower] as (x, y) in pixels; returns them re-measured, or None."""
    import cv2
    h, w = im.shape[:2]
    cx = (pts[0][0] + pts[1][0]) / 2
    cy = (pts[2][1] + pts[3][1]) / 2
    r = max(abs(pts[1][0] - pts[0][0]) * 2.2, w * 0.07)
    x0, x1 = int(max(0, cx - r)), int(min(w, cx + r))
    y0, y1 = int(max(0, cy - r)), int(min(h, cy + r))
    win = im[y0:y1, x0:x1].astype(np.float32)
    lum = 0.299 * win[..., 0] + 0.587 * win[..., 1] + 0.114 * win[..., 2]
    light = (lum > 60).astype(np.uint8)
    n, labels, stats, cents = cv2.connectedComponentsWithStats(light, connectivity=4)
    best = None
    for k in range(1, n):
        x, y, bw, bh, area = stats[k]
        if x == 0 or y == 0 or x + bw >= light.shape[1] or y + bh >= light.shape[0]:
            continue  # touches the window edge: fur, not the eye opening
        if area < 30:
            continue
        d = np.hypot(cents[k][0] + x0 - cx, cents[k][1] + y0 - cy)
        if best is None or (area, -d) > (best[0], -best[1]):
            best = (area, d, x, y, bw, bh)
    if best is None:
        return None
    _, _, x, y, bw, bh = best
    # The pupil is dark too: close the opening over it by taking the outline's extent.
    left, right, top, bottom = x0 + x, x0 + x + bw, y0 + y, y0 + y + bh
    midy = (top + bottom) / 2
    midx = (left + right) / 2
    outer_is_left = pts[0][0] < pts[1][0]
    outer = (left, midy) if outer_is_left else (right, midy)
    inner = (right, midy) if outer_is_left else (left, midy)
    return [outer, inner, (midx, top), (midx, bottom)]


def main():
    fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True,
                                         min_detection_confidence=0.2)
    files = sorted(glob.glob(os.path.join(ASSETS, 'v2', '*', '*.webp'))) + sorted(glob.glob(os.path.join(ASSETS, '*.png')))
    rows = []
    missing = []
    for f in files:
        key = os.path.relpath(f, ASSETS).replace(os.sep, '/')
        if key in SKIP:
            missing.append(key)
            continue
        im = np.array(Image.open(f).convert('RGB'))
        r = fm.process(im)
        if not r.multi_face_landmarks:
            missing.append(key)
            continue
        lm = r.multi_face_landmarks[0].landmark
        H, W = im.shape[:2]
        xy = [(lm[i].x * W, lm[i].y * H) for i in EYE_1 + EYE_2 + MOUTH + FACE]
        if key.split('/')[1:2] and key.split('/')[1] in PATCH_EYES:
            e1 = refine_patch_eye(im, xy[0:4])
            e2 = refine_patch_eye(im, xy[4:8])
            # An eye whose opening runs into the white fur can't be measured: mirror the other one
            # across the middle of the mouth (these pictures face the front).
            axis = (xy[8][0] + xy[9][0]) / 2
            mirror = lambda e: match_mirrored(im, e, [(2 * axis - x, y) for x, y in e])
            size = lambda e: abs(e[1][0] - e[0][0]) * abs(e[3][1] - e[2][1])
            if e1 and e2 and size(e2) < size(e1) * 0.5:
                e2 = None  # found only a highlight, not the whole opening
            if e1 and e2 and size(e1) < size(e2) * 0.5:
                e1 = None
            if e1 and not e2:
                e2 = mirror(e1)
            if e2 and not e1:
                e1 = mirror(e2)
            if e1 and e2:
                xy[0:4] = e1
                xy[4:8] = e2
        pts = []
        for x, y in xy:
            pts += [round(x / W, 4), round(y / H, 4)]
        rows.append((key, pts))
    lines = [
        '// GENERATED by scripts/buddy-faces.py. Do not edit by hand; re-run the script instead.',
        '// Where the eyes, mouth and chin are on each Learning Buddy picture (0-1 of the picture size),',
        '// so AI Teacher can move the lips and blink. Order of the numbers: see FACE_POINTS in faceGeometry.ts.',
        '// No face found (whole-picture motion only): ' + (', '.join(missing) or 'none') + '.',
        'export const BUDDY_FACES: { source: any; points: number[] }[] = [',
    ]
    for key, pts in rows:
        lines.append("  { source: require('%s%s'), points: [%s] }," % (REL, key, ', '.join(str(p) for p in pts)))
    lines.append('];')
    with open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(lines) + '\n')
    print('faces:', len(rows), 'missing:', missing)


if __name__ == '__main__':
    main()
