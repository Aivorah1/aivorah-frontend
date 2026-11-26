/**
 * Student Portal accent that follows Light / Dark (Website Redesign, Phase 3).
 *
 * Many student screens keep their accent in module constants (string exports,
 * colour tables). Those modules register here, and the student theme provider
 * calls applyStudentAccent(isDark) before its children render, so every
 * registered value switches between burnt orange (light) and pale blue (dark)
 * in place — keys, shapes and alpha suffixes ("#B8431220") stay the same.
 */
export const STUDENT_ACCENT = { light: '#B84312', dark: '#A9D5FF' } as const;
// The single legacy accent the constants were written with.
export const LEGACY_STUDENT_ACCENT = '#C8551C';

// Legacy Teacher Portal teal (Phase 4) — the Teacher Portal shares this accent.
export const LEGACY_TEACHER_ACCENTS = ['#0E6E86', '#075D75'];
const KNOWN = [LEGACY_STUDENT_ACCENT, ...LEGACY_TEACHER_ACCENTS, STUDENT_ACCENT.light, STUDENT_ACCENT.dark].map((h) => h.toUpperCase());

type Setter = (accent: string) => void;
const tables: object[] = [];
const setters: Setter[] = [];
let current: string | null = null;

/** Replaces any accent hex (keeping an alpha suffix) with `accent`. */
export function swapAccent(value: string, accent: string): string {
  const head = value.slice(0, 7).toUpperCase();
  return KNOWN.includes(head) ? accent + value.slice(7) : value;
}

function walk(node: any, accent: string, seen: Set<object>) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (typeof v === 'string') node[k] = swapAccent(v, accent);
    else if (v && typeof v === 'object') walk(v, accent, seen);
  }
}

/**
 * Register colour tables (objects / arrays, walked deeply) and/or a setter for
 * string exports (`export let X = …`). Applied at once if a theme is known.
 */
export function followStudentAccent(...targets: (object | Setter)[]) {
  for (const t of targets) {
    if (typeof t === 'function') setters.push(t as Setter);
    else tables.push(t);
    if (current) {
      if (typeof t === 'function') (t as Setter)(current);
      else walk(t, current, new Set());
    }
  }
}

export function applyStudentAccent(isDark: boolean) {
  const accent = isDark ? STUDENT_ACCENT.dark : STUDENT_ACCENT.light;
  if (accent === current) return;
  current = accent;
  const seen = new Set<object>();
  tables.forEach((t) => walk(t, accent, seen));
  setters.forEach((s) => s(accent));
}
