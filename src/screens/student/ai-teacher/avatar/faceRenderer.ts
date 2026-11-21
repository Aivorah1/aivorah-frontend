// Draws the talking Learning Buddy on a canvas (web): the picture, then a mouth
// that opens with the speech (the jaw and lower lip drop, the dark of the mouth
// and the tongue show between the lips), and eyelids that close for a blink.
// Pure drawing: no React here, so it can be checked on its own.
import { faceShape, jawProfile, maxJawDrop, mouthLineY, type FaceShape, type Pt } from './faceGeometry';

type Ctx = CanvasRenderingContext2D;
type Canvas = HTMLCanvasElement;

export interface Prepared {
  face: FaceShape;
  rect: { x: number; y: number; w: number; h: number };
  dpr: number;
  /** The picture as drawn, with the area below the chin faded out: what slides down when the jaw drops. */
  jaw: Canvas;
  lidColors: [string, string];
  lashColor: string;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function median<T>(xs: T[], key: (t: T) => number): T {
  return [...xs].sort((a, b) => key(a) - key(b))[Math.floor(xs.length / 2)];
}

/** Skin (or fur) colour just above each eye, for the eyelids. */
function sampleLidColors(img: CanvasImageSource & { naturalWidth: number; naturalHeight: number }, points: number[], make: () => Canvas): [string, string] {
  const fallback: [string, string] = ['#c98b62', '#c98b62'];
  try {
    const w = img.naturalWidth; const h = img.naturalHeight;
    const c = make(); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true } as any) as Ctx | null;
    if (!ctx) return fallback;
    ctx.drawImage(img, 0, 0, w, h);
    const eyeColor = (o: number) => {
      const px = (i: number) => ({ x: points[(o + i) * 2] * w, y: points[(o + i) * 2 + 1] * h });
      const outer = px(0); const inner = px(1); const upper = px(2); const lower = px(3);
      const open = Math.max(2, lower.y - upper.y);
      const cx = (outer.x + inner.x) / 2; const ew = Math.abs(inner.x - outer.x);
      const samples = [-0.22, 0, 0.22].map((f) => {
        const d = ctx.getImageData(Math.round(cx + f * ew), Math.round(upper.y - open * 0.75), 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: d[3], l: 0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2] };
      }).filter((s) => s.a > 200);
      if (!samples.length) return fallback[0];
      const m = median(samples, (s) => s.l);
      return `rgb(${m.r},${m.g},${m.b})`;
    };
    return [eyeColor(0), eyeColor(4)];
  } catch {
    return fallback; // e.g. a picture from another site: the canvas can't be read
  }
}

/** Work out the face on the drawn picture and build the layers the animation needs. */
export function prepare(
  img: CanvasImageSource & { naturalWidth: number; naturalHeight: number },
  points: number[],
  rect: { x: number; y: number; w: number; h: number },
  boxW: number, boxH: number, dpr: number,
  make: () => Canvas,
): Prepared {
  const face = faceShape(points, rect);
  const jaw = make();
  jaw.width = Math.max(1, Math.round(boxW * dpr));
  jaw.height = Math.max(1, Math.round(boxH * dpr));
  const j = jaw.getContext('2d') as Ctx;
  j.setTransform(dpr, 0, 0, dpr, 0, 0);
  j.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  // Fade the dropped layer out below the chin so it blends into the neck and clothes.
  const fadeTop = face.chin.y;
  const fadeEnd = face.chin.y + Math.max(6, (face.chin.y - face.mouth.center.y) * 0.45);
  const g = j.createLinearGradient(0, fadeTop, 0, fadeEnd);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  j.globalCompositeOperation = 'destination-in';
  j.fillStyle = g;
  j.fillRect(0, 0, boxW, fadeEnd);
  j.globalCompositeOperation = 'source-over';
  return { face, rect, dpr, jaw, lidColors: sampleLidColors(img, points, make), lashColor: 'rgba(40,24,18,0.85)' };
}

function drawMouth(ctx: Ctx, p: Prepared, open: number) {
  const { face, jaw, dpr } = p;
  const drop = clamp(open, 0, 1) * maxJawDrop(face);
  if (drop < 0.35) return;
  const x0 = Math.floor(face.mouth.left.x);
  const x1 = Math.ceil(face.mouth.right.x);
  const bottom = face.chin.y + Math.max(6, (face.chin.y - face.mouth.center.y) * 0.45);

  // The inside of the mouth, between the upper lip and the dropped lower lip.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, mouthLineY(face, x0));
  for (let x = x0; x <= x1; x += 1) ctx.lineTo(x, mouthLineY(face, x) - 0.4);
  for (let x = x1; x >= x0; x -= 1) ctx.lineTo(x, mouthLineY(face, x) + drop * jawProfile(face, x) + 0.6);
  ctx.closePath();
  const cy = mouthLineY(face, face.mouth.center.x);
  const inside = ctx.createLinearGradient(0, cy, 0, cy + drop);
  inside.addColorStop(0, '#2a0709');
  inside.addColorStop(1, '#5e1a20');
  ctx.fillStyle = inside;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#b8545d';
  ctx.beginPath();
  ctx.ellipse(face.mouth.center.x, cy + drop * 0.95, face.mouth.width * 0.27, drop * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The lower lip, teeth and chin slide down, most in the middle and not at all at the corners.
  for (let x = x0; x < x1; x += 1) {
    const top = mouthLineY(face, x + 0.5);
    const dy = drop * jawProfile(face, x + 0.5);
    if (dy < 0.05) continue;
    const h = bottom - top;
    if (h <= 0) continue;
    ctx.drawImage(jaw, x * dpr, top * dpr, dpr, h * dpr, x, top + dy, 1, h);
  }
}

/** A point on the curve from a to b that passes through m half-way. */
function through(a: Pt, m: Pt, b: Pt, t: number): Pt {
  const c = { x: 2 * m.x - (a.x + b.x) / 2, y: 2 * m.y - (a.y + b.y) / 2 };
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

function darker(color: string, f: number): string {
  const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(color);
  if (!m) return color;
  return `rgb(${Math.round(+m[1] * f)},${Math.round(+m[2] * f)},${Math.round(+m[3] * f)})`;
}

const LID_STEPS = 14;

function drawLids(ctx: Ctx, p: Prepared, blink: number) {
  const b = clamp(blink, 0, 1);
  if (b < 0.02) return;
  p.face.eyes.forEach((eye, i) => {
    // The eye opening, a little larger so the lid also covers the upper lashes and the corners.
    const dir = { x: (eye.inner.x - eye.outer.x) / eye.width, y: (eye.inner.y - eye.outer.y) / eye.width };
    const grow = eye.width * 0.1;
    const outer = { x: eye.outer.x - dir.x * grow, y: eye.outer.y - dir.y * grow };
    const inner = { x: eye.inner.x + dir.x * grow, y: eye.inner.y + dir.y * grow };
    const upper = { x: eye.upper.x, y: eye.upper.y - eye.open * 0.42 };
    const lower = { x: eye.lower.x, y: eye.lower.y + eye.open * 0.06 };
    // The lid's edge moves from the upper curve down to the lower one; closed, it sits on the lower lid.
    const edge: Pt[] = [];
    for (let s = 0; s <= LID_STEPS; s += 1) {
      const t = s / LID_STEPS;
      const up = through(outer, upper, inner, t);
      const lo = through(outer, lower, inner, t);
      edge.push({ x: up.x + (lo.x - up.x) * b, y: up.y + (lo.y - up.y) * b });
    }
    ctx.save();
    ctx.beginPath();
    for (let s = 0; s <= LID_STEPS; s += 1) {
      const pt = through(outer, upper, inner, s / LID_STEPS);
      if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
    }
    for (let s = LID_STEPS; s >= 0; s -= 1) ctx.lineTo(edge[s].x, edge[s].y);
    ctx.closePath();
    const lid = ctx.createLinearGradient(0, upper.y, 0, eye.lower.y);
    lid.addColorStop(0, p.lidColors[i]);
    lid.addColorStop(1, darker(p.lidColors[i], 0.84));
    ctx.fillStyle = lid;
    ctx.fill();
    // The lashes along the lid's edge.
    if (b > 0.2) {
      ctx.beginPath();
      edge.forEach((pt, s) => (s === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.strokeStyle = p.lashColor;
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1, eye.open * 0.16) * Math.min(1, (b - 0.2) * 2.5);
      ctx.stroke();
    }
    ctx.restore();
  });
}

/** One frame: the picture, the mouth opened by `open` (0–1) and the eyes closed by `blink` (0–1). */
export function drawFrame(ctx: Ctx, img: CanvasImageSource, p: Prepared, boxW: number, boxH: number, open: number, blink: number) {
  ctx.setTransform(p.dpr, 0, 0, p.dpr, 0, 0);
  ctx.clearRect(0, 0, boxW, boxH);
  ctx.drawImage(img, p.rect.x, p.rect.y, p.rect.w, p.rect.h);
  drawMouth(ctx, p, open);
  drawLids(ctx, p, blink);
}

/** Blink timing: closed for ~140 ms every few seconds, sometimes twice. */
export class Blinker {
  private next: number;
  private startedAt = -1;
  private double = false;
  constructor(now: number, private rand: () => number = Math.random) { this.next = now + 1200 + this.rand() * 2000; }
  /** How closed the eyes are now (0 open – 1 closed). */
  value(now: number): number {
    if (this.startedAt < 0 && now >= this.next) { this.startedAt = now; this.double = this.rand() < 0.18; }
    if (this.startedAt < 0) return 0;
    const t = now - this.startedAt;
    const one = 150;
    const total = this.double ? one * 2 + 90 : one;
    if (t >= total) {
      this.startedAt = -1;
      this.next = now + 2200 + this.rand() * 3300;
      return 0;
    }
    const local = this.double && t > one + 90 ? t - one - 90 : t > one ? -1 : t;
    if (local < 0) return 0;
    const half = one / 2;
    return local < half ? local / half : 1 - (local - half) / half;
  }
}
