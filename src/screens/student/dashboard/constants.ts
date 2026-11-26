import { Feather } from '@expo/vector-icons';

// ── Enchanting Forest palette ──────────────────────────────
// Slightly darkened for use as text/icon on white backgrounds
// Exact landing.html palette: SAGE (#9FB2A4) + GOLD (#BAA467) on #0B0B0B. No purple.
export const BRAND = {
  teal:   '#C8551C',   // landing --sage (primary)
  mint:   '#C8551C',   // sage
  rose:   '#C98A8A',   // muted rose (kept for "wrong answer" semantics)
  blush:  '#C99A9A',   // mid-rose
  gold:   '#C8551C',   // landing --gold
  slate:  '#C8551C',   // sage
  silver: '#A9B0AC',   // landing --muted
  // Accents — sage/gold family (no purples/corals)
  violet: '#C8551C',   // → gold
  coral:  '#C8551C',   // deep gold
  forest: '#C8551C',   // sage
  // Aliases used elsewhere in code
  indigo: '#C8551C',
  violet2: '#C8551C',  // gold
  purple: '#C8551C',   // → gold
  orange: '#C8551C',   // deep gold
  amber:  '#C8551C',   // landing GOLD
  green:  '#C8551C',   // sage
  cyan:   '#C8551C',   // sage
  blue:   '#C8551C',
  red:    '#C98A8A',   // muted rose
  pink:   '#C98A8A',
};

// Light-mode pastel card backgrounds — warm cream + sage/gold tints.
export const PASTEL = {
  blue:   '#E7F1EA',   // pale sage
  teal:   '#D9EEE0',   // mint tint
  green:  '#DCEFE2',   // light green
  orange: '#DCEFEB',   // warm cream-gold
  yellow: '#DCEFEB',   // gold cream
  red:    '#F6E2E2',   // soft rose
  cyan:   '#DEF3E6',   // mint
  indigo: '#E7F1EA',   // pale sage
  pink:   '#F2E3D9',   // warm blush
  purple: '#DCEFEB',   // gold cream (was blush-rose)
  silver: '#ECEFEA',   // soft sage-gray
};

export const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#C8551C',   // gold
  Science: '#C8551C',       // gold
  'Social Studies': '#C8551C', // gold
};

export const SUBJECT_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  Mathematics: 'hash', Science: 'zap', 'Social Studies': 'globe',
};

export const QUICK_NAV = [
  { label: 'My Learning',  icon: 'book'         as const, color: BRAND.teal,   pastel: PASTEL.teal,   screen: 'LearningPaths', desc: 'My Paths' },
  { label: 'AI Coach',     icon: 'cpu'           as const, color: BRAND.rose,   pastel: PASTEL.pink,   screen: 'AICoach',       desc: 'Ask anything' },
  { label: 'Assignments',  icon: 'check-square'  as const, color: BRAND.gold,   pastel: PASTEL.yellow, screen: 'Assignments',   desc: 'Pending' },
  { label: 'Challenges',   icon: 'target'        as const, color: BRAND.blush,  pastel: PASTEL.red,    screen: 'Challenges',    desc: 'Compete' },
  { label: 'Schedule',     icon: 'calendar'      as const, color: BRAND.silver, pastel: PASTEL.silver, screen: 'Schedule',      desc: 'Timetable' },
  { label: 'Progress',     icon: 'trending-up'   as const, color: BRAND.violet, pastel: PASTEL.purple, screen: 'Progress',      desc: 'Analytics' },
];

// ── Student Portal redesign: theme-aware values ─────────────────────────
// BRAND / PASTEL / SUBJECT_COLORS / QUICK_NAV are read while the dashboard
// renders, so they are refreshed in place for the active theme before styles
// are built (DashboardScreen calls this first). Keys and shapes are unchanged.
const BRAND_GROUP: Record<string, 'green' | 'gold' | 'rose' | 'muted'> = {
  teal: 'green', mint: 'green', forest: 'green', slate: 'green', green: 'green', cyan: 'green', blue: 'green', indigo: 'green',
  gold: 'gold', violet: 'gold', coral: 'gold', violet2: 'gold', purple: 'gold', orange: 'gold', amber: 'gold',
  rose: 'rose', blush: 'rose', red: 'rose', pink: 'rose', silver: 'muted',
};
const PASTEL_GROUP: Record<string, 'green' | 'gold' | 'rose' | 'muted'> = {
  blue: 'green', teal: 'green', green: 'green', cyan: 'green', indigo: 'green',
  orange: 'gold', yellow: 'gold', purple: 'gold', red: 'rose', pink: 'rose', silver: 'muted',
};
// Website Redesign, Phase 3: "green" = primary accent (burnt orange / pale blue),
// "gold" = success green, "rose" = error red, "muted" = cocoa / cool white.
const TONES = {
  light: { brand: { green: '#B84312', gold: '#23803A', rose: '#B3261E', muted: '#4F4035' },
           pastel: { green: '#FBE4D4', gold: '#E5F1DA', rose: '#FBE1DC', muted: '#F3ECDF' } },
  dark:  { brand: { green: '#A9D5FF', gold: '#7BD389', rose: '#FF9C8A', muted: '#B4C3D8' },
           pastel: { green: '#2B4663', gold: '#1E3A30', rose: '#3A2626', muted: '#22324B' } },
};
const QUICK_NAV_KEYS = [['teal', 'teal'], ['rose', 'pink'], ['gold', 'yellow'], ['blush', 'red'], ['silver', 'silver'], ['violet', 'purple']] as const;
let appliedDark: boolean | null = null;
export function applyStudentBrand(isDark: boolean) {
  if (appliedDark === isDark) return;
  appliedDark = isDark;
  const t = isDark ? TONES.dark : TONES.light;
  for (const k of Object.keys(BRAND)) (BRAND as any)[k] = t.brand[BRAND_GROUP[k] ?? 'gold'];
  for (const k of Object.keys(PASTEL)) (PASTEL as any)[k] = t.pastel[PASTEL_GROUP[k] ?? 'muted'];
  for (const k of Object.keys(SUBJECT_COLORS)) SUBJECT_COLORS[k] = t.brand.green;
  QUICK_NAV.forEach((q, i) => {
    const [b, pk] = QUICK_NAV_KEYS[i] ?? ['gold', 'yellow'];
    (q as any).color = (BRAND as any)[b];
    (q as any).pastel = (PASTEL as any)[pk];
  });
}
