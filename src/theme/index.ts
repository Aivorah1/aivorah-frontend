// ── Exact landing.html palette (the marketing site = the design reference) ──
// #0B0B0B base, warm off-white text, muted SAGE + GOLD accents, Fraunces serif.
import { Platform } from 'react-native';

export const darkColors = {
  bgDark: '#0B0B0B',        // landing --bg
  cardDark: '#141414',      // dark card surface
  cardHover: '#1C1C1C',
  sidebarDark: '#0B0B0B',   // same as bg (unified)
  borderColor: 'rgba(245,243,238,0.14)',  // landing --line-strong

  textMain: '#F5F3EE',      // landing --text
  textHeading: '#F5F3EE',   // headings (same as text in dark mode)
  textMuted: '#A9B0AC',     // landing --muted
  textDim: '#6E736B',

  // Primary: sage (landing --sage)
  primary: '#9FB2A4',
  primaryHover: '#B2C2B7',
  primaryGlow: 'rgba(159,178,164,0.14)',   // landing --sage-soft

  // Landing accents — sage + gold lead
  accentBlue: '#9FB2A4',    // sage
  accentPurple: '#BAA467',  // gold (landing --gold)
  accentGreen: '#9FB2A4',   // sage
  accentYellow: '#BAA467',  // gold
  accentYellowGlow: 'rgba(186,164,103,0.14)',
  accentRed: '#C98A8A',     // muted rose
  accentCyan: '#9FB2A4',    // sage
  accentOrange: '#C9A24E',  // deep gold
  accentPink: '#BAA467',    // gold

  // Extra tokens (student redesign). Other roles keep their current look.
  onPrimary: '#0B0B0B',
  accent: '#BAA467',
  surfaceSubtle: '#1C1C1C',
  navActiveBg: 'rgba(186,164,103,0.094)',
  navActiveText: '#BAA467',
  tintLilac: '#1C1C1C',
  tintMint: '#1C1C1C',
  tintBlue: '#1C1C1C',
  tintPeach: '#1C1C1C',
};

// Light mode: Aivorah brand on warm cream — same gold/sage accents, inverted bg/text.
export const lightColors = {
  bgDark: '#F5F3EE',        // landing --text (warm cream) used as light bg
  cardDark: '#FFFFFF',
  cardHover: '#EDE8E2',     // slightly warmer card hover
  sidebarDark: '#F5F3EE',
  borderColor: 'rgba(11,11,11,0.10)',  // subtle dark border on cream

  textMain: '#0B0B0B',      // landing --bg as text (full contrast on cream)
  textHeading: '#524738',   // headings: warm brown (clearly softer than black)
  textMuted: '#4A4A48',     // dark muted
  textDim: '#70706B',       // dimmed (darkened for cream readability, ~4.6:1)

  // Primary: sage — darkened for legible text on cream (~4.7:1 on #F5F3EE)
  primary: '#5E7566',
  primaryHover: '#67806F',
  primaryGlow: 'rgba(159,178,164,0.18)',

  // Accents — same gold/sage identity, deeper for cream readability
  accentBlue: '#5E7566',    // sage (readable on cream)
  accentPurple: '#BAA467',  // gold
  accentGreen: '#5E7566',   // sage (readable on cream)
  accentYellow: '#9A7B2E',  // deep gold (readable on cream)
  accentYellowGlow: 'rgba(154,123,46,0.18)',
  accentRed: '#B8595F',     // muted rose
  accentCyan: '#5E7566',    // sage (readable on cream)
  accentOrange: '#B07A1E',  // amber-gold
  accentPink: '#BAA467',    // gold

  onPrimary: '#FFFFFF',
  accent: '#9A7B2E',
  surfaceSubtle: '#EDE8E2',
  navActiveBg: 'rgba(154,123,46,0.094)',
  navActiveText: '#9A7B2E',
  tintLilac: '#EDE8E2',
  tintMint: '#EDE8E2',
  tintBlue: '#EDE8E2',
  tintPeach: '#EDE8E2',
};

// Parent (Website Redesign, Phase 5): the same Aivorah palette as Student and
// Teacher — defined below with them (the Student palette), so declared later.

// Student (Website Redesign, Phase 3): the homepage palette.
// Light = warm ivory page, soft-ivory sidebar, warm-white cards, espresso
// headings, cocoa body, burnt-orange primary, peach active nav, deep-blue focus.
// Dark = ink navy, deep-slate sidebar, slate-blue cards, warm-cream headings,
// cool-white body, pale-blue primary, blue-slate active nav, sky-blue focus.
export const studentLightColors: typeof darkColors = {
  bgDark: '#F7F3E9',
  cardDark: '#FFFCF6',
  cardHover: '#F3ECDF',
  sidebarDark: '#FBF6ED',
  borderColor: '#D5C6B3',
  textMain: '#302117',
  textHeading: '#302117',
  textMuted: '#4F4035',
  textDim: '#6A584A',
  primary: '#B84312',
  primaryHover: '#9F390E',
  primaryGlow: 'rgba(184,67,18,0.10)',
  accentBlue: '#1D5DB5',
  accentPurple: '#B84312',
  accentGreen: '#23803A',
  accentYellow: '#B84312',
  accentYellowGlow: 'rgba(184,67,18,0.10)',
  accentRed: '#B3261E',
  accentCyan: '#1D5DB5',
  accentOrange: '#B84312',
  accentPink: '#B3261E',
  onPrimary: '#FFFFFF',
  accent: '#B84312',
  surfaceSubtle: '#F3ECDF',
  navActiveBg: '#FBE4D4',
  navActiveText: '#8F350D',
  tintLilac: '#E6EEF8',
  tintMint: '#E5F1DA',
  tintBlue: '#E1EDF7',
  tintPeach: '#FBE4D4',
};
export const studentDarkColors: typeof darkColors = {
  bgDark: '#101827',
  cardDark: '#1C2A40',
  cardHover: '#22324B',
  sidebarDark: '#162238',
  borderColor: '#425775',
  textMain: '#FFF3DC',
  textHeading: '#FFF3DC',
  textMuted: '#DCE6F4',
  textDim: '#B4C3D8',
  primary: '#A9D5FF',
  primaryHover: '#C3E4FF',
  primaryGlow: 'rgba(169,213,255,0.14)',
  accentBlue: '#8DD1FF',
  accentPurple: '#A9D5FF',
  accentGreen: '#7BD389',
  accentYellow: '#A9D5FF',
  accentYellowGlow: 'rgba(169,213,255,0.14)',
  accentRed: '#FF9C8A',
  accentCyan: '#8DD1FF',
  accentOrange: '#FFB27A',
  accentPink: '#FF9C8A',
  onPrimary: '#101827',
  accent: '#A9D5FF',
  surfaceSubtle: '#162238',
  navActiveBg: '#2B4663',
  navActiveText: '#C3E4FF',
  tintLilac: '#22324B',
  tintMint: '#1E3A30',
  tintBlue: '#1E3550',
  tintPeach: '#3A2C24',
};

/** Decorative shapes used sparingly in the Student Portal (welcome panel). */
export const studentShapeColors = {
  light: { green: '#77B742', yellow: '#F6C931', orange: '#F58B3A', blue: '#61ABD7' },
  dark: { green: '#6A9F3E', yellow: '#DCA928', orange: '#C85F24', blue: '#477EAB' },
};

// Teacher (Website Redesign, Phase 4): the same Aivorah palette as the
// Student Portal — warm ivory / warm white / espresso / burnt orange in light,
// ink navy / slate / warm cream / pale blue in dark, sand / blue-slate borders.
export const teacherLightColors: typeof darkColors = { ...studentLightColors };
export const teacherDarkColors: typeof darkColors = { ...studentDarkColors };
// Parent (Website Redesign, Phase 5): the same palette.
export const parentLightColors: typeof darkColors = { ...studentLightColors };
export const parentDarkColors: typeof darkColors = { ...studentDarkColors };

// ── School Admin palette (berry / fern / denim / clay / rose / eucalyptus) ──
// Calm cream + white (light) and deep navy + blue-slate (dark) surfaces; the
// multicolour accents go on buttons, links, tabs, icons and badges only.
export const schoolAdminLightColors: typeof darkColors = { ...studentLightColors }; // Website Redesign, Phases 6–7: Aivorah palette

export const schoolAdminDarkColors: typeof darkColors = { ...studentDarkColors }; // Website Redesign, Phases 6–7: Aivorah palette

// ── Company Admin palette: School Admin system with Company Admin surfaces ──
export const companyAdminLightColors: typeof darkColors = { ...studentLightColors }; // Website Redesign, Phases 6–7: Aivorah palette
export const companyAdminDarkColors: typeof darkColors = { ...studentDarkColors }; // Website Redesign, Phases 6–7: Aivorah palette

// Default export keeps backward compat — ThemeContext overrides at runtime
export const colors = darkColors;
export type AppColors = typeof darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 9999,
};
// On web each family is a CSS variable that falls back to Inter. Only the
// Student Portal defines the variables (StudentThemeProvider), so other roles
// render exactly as before.
const SYS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const webFont = (v: string) => (Platform.OS === 'web' ? `var(${v}, Inter), system-ui, sans-serif` : 'system');
export const fonts = {
  serif: webFont('--av-heading'),   // headings: Baloo 2 (student)
  sans:  webFont('--av-body'),      // UI / forms: Karla (student)
  brand: webFont('--av-nav'),       // sidebar + brand: Sora (student)
  card:  webFont('--av-card'),      // card titles / metrics: Quicksand (student)
  // Same idea, but falling back to the system stack: for text that used no
  // fontFamily before, so other roles keep their current rendering.
  nav:   Platform.OS === 'web' ? `var(--av-nav, ${SYS})` : 'system',
  title: Platform.OS === 'web' ? `var(--av-heading, ${SYS})` : 'system',
  ui:    Platform.OS === 'web' ? `var(--av-card, ${SYS})` : 'system',
  // Subheadings: the font preset's subheading face, else the portal's body font.
  sub:   Platform.OS === 'web' ? `var(--av-sub, var(--av-body, ${SYS}))` : 'system',
  reading: Platform.OS === 'web' ? 'var(--av-reading, Inter), Georgia, serif' : 'system', // passages: Lora
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyBold: { fontSize: 14, fontWeight: '600' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
  smallBold: { fontSize: 12, fontWeight: '600' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8 },
};
