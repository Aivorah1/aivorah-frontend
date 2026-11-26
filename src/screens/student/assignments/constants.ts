import type { StepType } from './types';

export const FILTERS = ['All', 'Pending', 'Completed', 'Quizzes'];

// Every step uses Aivorah gold
export const STEP_COLORS: Record<StepType, string> = {
  // Core
  brainstorm:           '#C8551C',
  drawing:              '#C8551C',
  structured_writing:   '#C8551C',
  problem_solving:      '#C8551C',
  // Maths
  tuning_in:            '#C8551C',
  math_reflection:      '#C8551C',
  // Science
  prior_knowledge:      '#C8551C',
  // English
  text_connection:      '#C8551C',
  reading_comprehension:'#C8551C',
  writing_reflection:   '#C8551C',
  // Language Acquisition
  language_culture:     '#C8551C',
  language_practice:    '#C8551C',
  communication:        '#C8551C',
  // Social Studies
  social_inquiry:       '#C8551C',
  research_notes:       '#C8551C',
  social_synthesis:     '#C8551C',
  // Visual Arts
  artistic_exploration: '#C8551C',
  art_creation:         '#C8551C',
  artistic_reflection:  '#C8551C',
  // ICT
  digital_awareness:    '#C8551C',
  tech_skill_practice:  '#C8551C',
  digital_citizenship:  '#C8551C',
  // PE
  movement_exploration: '#C8551C',
  skill_practice:       '#C8551C',
  physical_reflection:  '#C8551C',
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
  Mathematics:           '#C8551C',
  Science:               '#C8551C',
  English:               '#C8551C',
  'Social Studies':      '#C8551C',
  'Language Acquisition':'#C8551C',
  'Visual Arts':         '#C8551C',
  ICT:                   '#C8551C',
  'Physical Education':  '#C8551C',
};

// ── Stamp config ─────────────────────────────────────────────────────────────
export const STAMPS = [
  { id: 'amazing',    label: 'Amazing Storyteller', icon: 'star',         color: '#3FB8A8', min: 80 },
  { id: 'hardworking',label: 'Hardworking Farmer',  icon: 'award',        color: '#10b981', min: 60 },
  { id: 'keepgoing',  label: 'Keep Going!',          icon: 'trending-up',  color: '#C8551C', min: 0  },
];
