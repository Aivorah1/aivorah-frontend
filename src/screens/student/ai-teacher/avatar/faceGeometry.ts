// Face layout for the talking Learning Buddy: where the eyes and mouth are on
// the picture (from buddyFaces.generated.ts), turned into the shapes the
// avatar animates. Coordinates are in pixels of the drawn picture.
import { BUDDY_FACES } from './buddyFaces.generated';

export type Pt = { x: number; y: number };

export interface EyeShape { outer: Pt; inner: Pt; upper: Pt; lower: Pt; center: Pt; width: number; open: number }

export interface FaceShape {
  eyes: [EyeShape, EyeShape];
  mouth: { left: Pt; right: Pt; upperInner: Pt; lowerInner: Pt; lowerOuter: Pt; center: Pt; width: number };
  chin: Pt;
  faceLeft: Pt;
  faceRight: Pt;
}

/** The order of the numbers in BUDDY_FACES[].points: x,y pairs. */
export const FACE_POINTS = [
  'eye1Outer', 'eye1Inner', 'eye1Upper', 'eye1Lower',
  'eye2Outer', 'eye2Inner', 'eye2Upper', 'eye2Lower',
  'mouthLeft', 'mouthRight', 'upperInner', 'lowerInner', 'lowerOuter',
  'chin', 'faceLeft', 'faceRight',
] as const;

/** The face map for a picture, or null when its face isn't known (then only the whole picture moves). */
export function facePointsFor(source: any): number[] | null {
  if (source == null) return null;
  const hit = BUDDY_FACES.find((f) => f.source === source);
  return hit && hit.points.length === FACE_POINTS.length * 2 ? hit.points : null;
}

/** Where a picture of natural size (iw × ih) lands when drawn "contain" into a box of bw × bh. */
export function containRect(iw: number, ih: number, bw: number, bh: number) {
  const scale = Math.min(bw / iw, bh / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { x: (bw - w) / 2, y: (bh - h) / 2, w, h };
}

/** Face points placed on the drawn picture. */
export function faceShape(points: number[], rect: { x: number; y: number; w: number; h: number }): FaceShape {
  const p = (i: number): Pt => ({ x: rect.x + points[i * 2] * rect.w, y: rect.y + points[i * 2 + 1] * rect.h });
  const eye = (o: number): EyeShape => {
    const outer = p(o); const inner = p(o + 1); const upper = p(o + 2); const lower = p(o + 3);
    return {
      outer, inner, upper, lower,
      center: { x: (outer.x + inner.x) / 2, y: (upper.y + lower.y) / 2 },
      width: Math.hypot(inner.x - outer.x, inner.y - outer.y),
      open: Math.max(1, lower.y - upper.y),
    };
  };
  const left = p(8); const right = p(9); const upperInner = p(10); const lowerInner = p(11);
  return {
    eyes: [eye(0), eye(4)],
    mouth: {
      left, right, upperInner, lowerInner, lowerOuter: p(12),
      center: { x: (left.x + right.x) / 2, y: (upperInner.y + lowerInner.y) / 2 },
      width: Math.hypot(right.x - left.x, right.y - left.y),
    },
    chin: p(13),
    faceLeft: p(14),
    faceRight: p(15),
  };
}

/**
 * The line the lips part along: through both mouth corners and the middle of
 * the lips (a smile's corners sit higher than its middle).
 */
export function mouthLineY(face: FaceShape, x: number): number {
  const { left, right, center } = face.mouth;
  const half = Math.max(1, (right.x - left.x) / 2);
  const u = Math.max(-1, Math.min(1, (x - center.x) / half));
  const cornerY = left.y + ((right.y - left.y) * (u + 1)) / 2;
  const midCorner = (left.y + right.y) / 2;
  return cornerY + (center.y - midCorner) * (1 - u * u);
}

/** How far the jaw drops at x, as a share of the full drop: 1 under the middle of the mouth, 0 at and beyond its corners. */
export function jawProfile(face: FaceShape, x: number): number {
  const half = Math.max(1, face.mouth.width / 2);
  const u = Math.abs(x - face.mouth.center.x) / half;
  if (u >= 1) return 0;
  return Math.pow(Math.cos((u * Math.PI) / 2), 1.3);
}

/** The largest jaw drop, in pixels, for a fully open mouth. */
export function maxJawDrop(face: FaceShape): number {
  const lipToChin = Math.max(4, face.chin.y - face.mouth.center.y);
  return Math.min(face.mouth.width * 0.32, lipToChin * 0.42);
}
