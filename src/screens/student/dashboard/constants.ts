import { Feather } from '@expo/vector-icons';

// ── Enchanting Forest palette ──────────────────────────────
// Slightly darkened for use as text/icon on white backgrounds
// Exact landing.html palette: SAGE (#9FB2A4) + GOLD (#BAA467) on #0B0B0B. No purple.
export const BRAND = {
  teal:   '#24877B',   // landing --sage (primary)
  mint:   '#24877B',   // sage
  rose:   '#C98A8A',   // muted rose (kept for "wrong answer" semantics)
  blush:  '#C99A9A',   // mid-rose
  gold:   '#24877B',   // landing --gold
  slate:  '#24877B',   // sage
  silver: '#A9B0AC',   // landing --muted
  // Accents — sage/gold family (no purples/corals)
  violet: '#24877B',   // → gold
  coral:  '#24877B',   // deep gold
  forest: '#24877B',   // sage
  // Aliases used elsewhere in code
  indigo: '#24877B',
  violet2: '#24877B',  // gold
  purple: '#24877B',   // → gold
  orange: '#24877B',   // deep gold
  amber:  '#24877B',   // landing GOLD
  green:  '#24877B',   // sage
  cyan:   '#24877B',   // sage
  blue:   '#24877B',
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
  Mathematics: '#24877B',   // gold
  Science: '#24877B',       // gold
  'Social Studies': '#24877B', // gold
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
const TONES = {
  light: { brand: { green: '#075D75', gold: '#177A4F', rose: '#B4443C', muted: '#4A5E6A' },
           pastel: { green: '#E1F0F7', gold: '#E0F4EA', rose: '#FCE9DA', muted: '#F1F6F8' } },
  dark:  { brand: { green: '#9ADBE9', gold: '#9BE5BE', rose: '#F4A9A3', muted: '#B6C6D1' },
           pastel: { green: '#243746', gold: '#243746', rose: '#243746', muted: '#243746' } },
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
