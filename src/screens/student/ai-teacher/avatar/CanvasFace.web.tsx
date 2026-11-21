// Web: the Learning Buddy drawn on a canvas, so its lips move with the speech
// and its eyes blink (see faceRenderer.ts). Runs one animation loop while the
// screen is open; the mouth follows `lips` (lipSync.ts).
import React, { useEffect, useRef } from 'react';
import { Asset } from 'expo-asset';
import { containRect } from './faceGeometry';
import { Blinker, drawFrame, prepare, type Prepared } from './faceRenderer';
import type { LipSync } from './lipSync';

function uriOf(source: any): string {
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object' && typeof source.uri === 'string') return source.uri;
  try { return Asset.fromModule(source).uri; } catch { return ''; }
}

export default function CanvasFace({ source, points, lips, label, onFail }: {
  source: any;
  points: number[];
  lips: LipSync;
  label: string;
  /** The picture couldn't be drawn: show the plain picture instead. */
  onFail: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrap || !canvas || !ctx) { onFail(); return undefined; }
    let alive = true;
    let raf = 0;
    let prepared: Prepared | null = null;
    let boxW = 0;
    let boxH = 0;
    let open = 0;
    let last = performance.now();
    const blinker = new Blinker(last);
    const img = new Image();

    const layout = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      boxW = r.width; boxH = r.height;
      if (boxW < 2 || boxH < 2) return;
      canvas.width = Math.round(boxW * dpr);
      canvas.height = Math.round(boxH * dpr);
      if (!img.naturalWidth) return;
      const rect = containRect(img.naturalWidth, img.naturalHeight, boxW, boxH);
      prepared = prepare(img, points, rect, boxW, boxH, dpr, () => document.createElement('canvas'));
    };

    const frame = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (prepared) {
        // Ease toward the target so the lips move smoothly between sounds.
        open += (lips.openness(now) - open) * Math.min(1, dt * 22);
        try { drawFrame(ctx, img, prepared, boxW, boxH, open, blinker.value(now)); } catch { /* next frame */ }
      }
      raf = requestAnimationFrame(frame);
    };

    img.onload = layout;
    img.onerror = () => { if (alive) onFail(); };
    const uri = uriOf(source);
    if (!uri) { onFail(); return undefined; }
    img.src = uri;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
    ro?.observe(wrap);
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [source, points, lips, onFail]);

  return (
    <div ref={wrapRef} role="img" aria-label={label} data-testid="ai-teacher-buddy" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
