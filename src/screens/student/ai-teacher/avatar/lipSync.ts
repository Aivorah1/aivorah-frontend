// Lip-sync for the talking Learning Buddy. Browser speech gives no audio
// levels, only word-start positions while it plays, so the mouth follows the
// letters of the sentence being spoken: open on vowels, closed on m / b / p,
// half-open on other consonants. Each word-start event from the speech engine
// re-anchors the timing to the word actually being heard; when an engine sends
// no word events, the sentence is paced at a typical speaking speed.

const EN_RATE = 14.5; // characters per second at the AI Teacher speaking rate
const HI_RATE = 12;

const DEVANAGARI_VOWEL = /[अआइईउऊऋएऐओऔऍऑािीुूृेैोौॅॉ]/;
const DEVANAGARI_CLOSED = /[मबपभफ]/;

/** How open the mouth is for one character (0 closed – 1 wide open). */
export function mouthOpenFor(ch: string): number {
  if (!ch || /\s/.test(ch)) return 0.05;
  if (/[.,!?;:।]/.test(ch)) return 0;
  const c = ch.toLowerCase();
  if (c === 'a') return 1;
  if (c === 'o') return 0.8;
  if (c === 'e' || c === 'i' || c === 'u' || c === 'y') return 0.6;
  if (/[mbp]/.test(c)) return 0;
  if (/[fv]/.test(c)) return 0.15;
  if (/[a-z]/.test(c)) return 0.3;
  if (/[0-9]/.test(c)) return 0.55;
  if (DEVANAGARI_VOWEL.test(ch)) return 0.85;
  if (DEVANAGARI_CLOSED.test(ch)) return 0;
  if (/[ऀ-ॿ]/.test(ch)) return 0.35;
  return 0.3;
}

export class LipSync {
  private text = '';
  private rate = EN_RATE;
  private anchorChar = 0;
  private anchorAt = 0;
  private sawBoundary = false;
  private active = false;
  private held = false;

  /** A sentence has started playing. */
  begin(text: string, lang: 'en' | 'hi', now: number) {
    this.text = text || '';
    this.rate = lang === 'hi' ? HI_RATE : EN_RATE;
    this.anchorChar = 0;
    this.anchorAt = now;
    this.sawBoundary = false;
    this.active = true;
  }

  /** The speech engine reached the word starting at charIndex. */
  boundary(charIndex: number, now: number) {
    if (!this.active || !Number.isFinite(charIndex)) return;
    const next = Math.max(0, Math.min(charIndex, this.text.length));
    // Learn this voice's speed from the gap between word events.
    const secs = (now - this.anchorAt) / 1000;
    if (this.sawBoundary && next > this.anchorChar && secs > 0.08) {
      const seen = (next - this.anchorChar) / secs;
      this.rate = Math.max(6, Math.min(26, this.rate * 0.6 + seen * 0.4));
    }
    this.anchorChar = next;
    this.anchorAt = now;
    this.sawBoundary = true;
  }

  /** The sentence finished (or was stopped): mouth closes. */
  end() { this.active = false; }

  get speaking() { return this.active; }

  /** Where in the sentence the voice probably is. */
  position(now: number): number {
    let pos = this.anchorChar + ((now - this.anchorAt) / 1000) * this.rate;
    if (this.sawBoundary) {
      // Word events arrive: don't run ahead past the end of the current word before the next event.
      const rest = this.text.slice(this.anchorChar);
      const m = /^\S*\s?/.exec(rest);
      const wordEnd = this.anchorChar + (m ? m[0].length : 0);
      this.held = pos > wordEnd;
      pos = Math.min(pos, wordEnd);
    } else {
      this.held = false;
    }
    return pos;
  }

  /** How open the mouth should be right now (0–1). */
  openness(now: number): number {
    if (!this.active || !this.text) return 0;
    const pos = this.position(now);
    if (this.held && pos < this.text.length) {
      // The voice is still on this word (slower than expected): keep the lips moving softly, not frozen.
      return 0.25 + 0.2 * Math.abs(Math.sin(((now - this.anchorAt) / 1000) * Math.PI * 5));
    }
    if (pos >= this.text.length) return 0;
    const i = Math.floor(pos);
    const frac = pos - i;
    const a = mouthOpenFor(this.text[i]);
    const b = mouthOpenFor(this.text[i + 1] ?? ' ');
    return a + (b - a) * frac;
  }
}
