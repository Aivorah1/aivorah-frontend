import { followStudentAccent } from '../../../theme/studentAccent';

export const TABS = ['Available', 'Assigned', 'In Progress', 'Completed'];

// imageUrl is served directly from server (cloudinary_urls.json) — no URL construction needed

export const DIFF_COLORS: Record<string, string> = {
  Easy:   '#10b981',
  Medium: '#3FB8A8',
  Hard:   '#ef4444',
};

export const CAT_COLORS: Record<string, string> = {
  'Chapter Quiz':    '#C8551C',
  'School Challenge':'#3FB8A8',
};

// Website Redesign, Phase 3: accent follows Light / Dark (see theme/studentAccent).
followStudentAccent(DIFF_COLORS, CAT_COLORS);
