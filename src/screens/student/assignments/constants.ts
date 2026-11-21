import type { StepType } from './types';

export const FILTERS = ['All', 'Pending', 'Completed', 'Quizzes'];

// Every step uses Aivorah gold
export const STEP_COLORS: Record<StepType, string> = {
  // Core
  brainstorm:           '#24877B',
  drawing:              '#24877B',
  structured_writing:   '#24877B',
  problem_solving:      '#24877B',
  // Maths
  tuning_in:            '#24877B',
  math_reflection:      '#24877B',
  // Science
  prior_knowledge:      '#24877B',
  // English
  text_connection:      '#24877B',
  reading_comprehension:'#24877B',
  writing_reflection:   '#24877B',
  // Language Acquisition
  language_culture:     '#24877B',
  language_practice:    '#24877B',
  communication:        '#24877B',
  // Social Studies
  social_inquiry:       '#24877B',
  research_notes:       '#24877B',
  social_synthesis:     '#24877B',
  // Visual Arts
  artistic_exploration: '#24877B',
  art_creation:         '#24877B',
  artistic_reflection:  '#24877B',
  // ICT
  digital_awareness:    '#24877B',
  tech_skill_practice:  '#24877B',
  digital_citizenship:  '#24877B',
  // PE
  movement_exploration: '#24877B',
  skill_practice:       '#24877B',
  physical_reflection:  '#24877B',
};

export const STEP_TEXT_COLORS: Record<StepType, string> = {
  brainstorm:           '#7A6420',
  drawing:              '#7A6420',
  structured_writing:   '#7A6420',
  problem_solving:      '#7A6420',
  tuning_in:            '#7A6420',
  math_reflection:      '#7A6420',
  prior_knowledge:      '#7A6420',
  text_connection:      '#7A6420',
  reading_comprehension:'#7A6420',
  writing_reflection:   '#7A6420',
  language_culture:     '#7A6420',
  language_practice:    '#7A6420',
  communication:        '#7A6420',
  social_inquiry:       '#7A6420',
  research_notes:       '#7A6420',
  social_synthesis:     '#7A6420',
  artistic_exploration: '#7A6420',
  art_creation:         '#7A6420',
  artistic_reflection:  '#7A6420',
  digital_awareness:    '#7A6420',
  tech_skill_practice:  '#7A6420',
  digital_citizenship:  '#7A6420',
  movement_exploration: '#7A6420',
  skill_practice:       '#7A6420',
  physical_reflection:  '#7A6420',
};

export const STEP_ICONS: Record<StepType, string> = {
  brainstorm:           'cloud',
  drawing:              'edit-3',
  structured_writing:   'align-left',
  problem_solving:      'hash',
  tuning_in:            'zap',
  math_reflection:      'rotate-ccw',
  prior_knowledge:      'bookmark',
  text_connection:      'book-open',
  reading_comprehension:'search',
  writing_reflection:   'feather',
  language_culture:     'globe',
  language_practice:    'message-circle',
  communication:        'mic',
  social_inquiry:       'compass',
  research_notes:       'file-text',
  social_synthesis:     'layers',
  artistic_exploration: 'eye',
  art_creation:         'edit-3',
  artistic_reflection:  'aperture',
  digital_awareness:    'monitor',
  tech_skill_practice:  'cpu',
  digital_citizenship:  'shield',
  movement_exploration: 'activity',
  skill_practice:       'trending-up',
  physical_reflection:  'heart',
};

// Aivorah pastel subject colours
export const SUBJECT_ICON: Record<string, string> = {
  Mathematics: 'hash', Science: 'zap', English: 'book-open', 'Social Studies': 'globe',
  'Language Acquisition': 'message-circle', 'Visual Arts': 'aperture',
  ICT: 'monitor', 'Physical Education': 'activity',
};

export const SUBJECT_COLOR: Record<string, string> = {
  Mathematics:           '#24877B',
  Science:               '#24877B',
  English:               '#24877B',
  'Social Studies':      '#24877B',
  'Language Acquisition':'#24877B',
  'Visual Arts':         '#24877B',
  ICT:                   '#24877B',
  'Physical Education':  '#24877B',
};

// ── Stamp config ─────────────────────────────────────────────────────────────
export const STAMPS = [
  { id: 'amazing',    label: 'Amazing Storyteller', icon: 'star',         color: '#3FB8A8', min: 80 },
  { id: 'hardworking',label: 'Hardworking Farmer',  icon: 'award',        color: '#10b981', min: 60 },
  { id: 'keepgoing',  label: 'Keep Going!',          icon: 'trending-up',  color: '#24877B', min: 0  },
];
