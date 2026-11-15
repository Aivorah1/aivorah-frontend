import type { AgeGroup, Category, QuestionType } from '../../../services/currentAffairsApi';

// Same palette as the rest of the student app (World & You, Daily Habits,
// Dashboard): Aivorah gold + sage, muted green/rose only for right/wrong answers.
export const GOLD = '#BAA467';
export const SAGE = '#9FB2A4';
export const DEEP_SAGE = '#82A896';
export const CORRECT = '#4A9E70';
export const WRONG = '#C85870';
// Light-mode tinted card background and heading colour used by World & You.
export const TINT_BG = '#F0F7F6';
export const TITLE_LIGHT = '#1C2A28';

// Feather icon per category (emoji flags don't render on Windows).
export const CATEGORIES: Record<Category, { label: string; icon: string }> = {
  india: { label: 'India', icon: 'flag' },
  world: { label: 'World', icon: 'globe' },
  economy: { label: 'Economy', icon: 'trending-up' },
  science: { label: 'Science & Tech', icon: 'cpu' },
  environment: { label: 'Environment', icon: 'feather' },
  sports: { label: 'Sports & Achievements', icon: 'award' },
  society: { label: 'Society & Culture', icon: 'users' },
};

export const AGE_GROUPS: Record<AgeGroup, { label: string; storiesPerDay: number; minutes: string }> = {
  // The service picks the same numbers of stories a day.
  '7-12': { label: 'Ages 7-12', storiesPerDay: 6, minutes: '5-7' },
  '13-15': { label: 'Ages 13-15', storiesPerDay: 7, minutes: '7-10' },
};

// Old values (from an old link or a saved screen state) → the two current ones.
const OLD_AGE_GROUPS: Record<string, AgeGroup> = { 'under-8': '7-12', '8-12': '7-12', '13+': '13-15' };

/** A known age group (old values converted), or null. */
export function normalizeAgeGroup(value?: string | null): AgeGroup | null {
  const v = String(value ?? '').trim();
  if (v === '7-12' || v === '13-15') return v;
  return OLD_AGE_GROUPS[v] ?? null;
}

export const QUESTION_TYPES: Record<QuestionType, string> = {
  mcq: 'Multiple choice',
  true_false: 'True or false',
  reasoning: 'Think and reason',
};

// What the service awards (aivorah-world-and-you-service current-affairs/services/rewards.js).
// Only the weekly quiz gives points; reading the digest or a story gives none.
export const POINTS = { quiz: 20, excellenceBonus: 10 };
export const EXCELLENCE_PERCENT = 80;

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Age group from an age in years: 12 or younger (under 8 included) → 7-12, 13 and above → 13-15. */
export function ageGroupForAge(age: number): AgeGroup {
  return age >= 13 ? '13-15' : '7-12';
}

/** Whole years from a date of birth (YYYY-MM-DD…) to today; null if missing or not a real date. */
export function ageFromDob(dob?: string | null, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dob || '').trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const born = new Date(Date.UTC(y, mo - 1, d));
  if (born.getUTCMonth() !== mo - 1 || born.getUTCDate() !== d) return null;
  let age = today.getUTCFullYear() - y;
  if (today.getUTCMonth() + 1 < mo || (today.getUTCMonth() + 1 === mo && today.getUTCDate() < d)) age -= 1;
  return age >= 0 && age < 100 ? age : null;
}

/**
 * Age group from the profile grade: pre-primary (Nursery / LKG / UKG) and
 * Grade 1-8 → 7-12, Grade 9 and above → 13-15. Anything unrecognised → 7-12.
 */
export function ageGroupForGrade(grade?: string | null): AgeGroup {
  const n = parseInt(String(grade || '').match(/\d+/)?.[0] || '', 10);
  return Number.isFinite(n) && n >= 9 ? '13-15' : '7-12';
}

/** The student's age group: from the date of birth when the profile has one, otherwise from the grade. */
export function ageGroupForStudent(user?: { dob?: string | null; grade?: string | null } | null): AgeGroup {
  const age = ageFromDob(user?.dob);
  return age === null ? ageGroupForGrade(user?.grade) : ageGroupForAge(age);
}

export function formatReadTime(seconds: number): string {
  if (!seconds || seconds < 60) return `${Math.max(30, Math.round(seconds || 0))} sec read`;
  return `${Math.round(seconds / 60)} min read`;
}

export function formatDigestDate(date: string | null): string {
  if (!date) return '';
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}
