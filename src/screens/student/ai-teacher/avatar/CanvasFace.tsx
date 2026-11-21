// Phones / tablets (native): no canvas face yet. TalkingFace shows the picture
// with whole-picture motion instead; see CanvasFace.web.tsx for the web face.
import type { LipSync } from './lipSync';

export default function CanvasFace(_props: { source: any; points: number[]; lips: LipSync; label: string; onFail: () => void }) {
  return null;
}
