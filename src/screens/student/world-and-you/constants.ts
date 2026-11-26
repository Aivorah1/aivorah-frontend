import { followStudentAccent } from '../../../theme/studentAccent';

// Website Redesign, Phase 3: accent follows Light / Dark (see theme/studentAccent).
export let TEAL = '#C8551C';
export let ROSE = '#C8551C';
followStudentAccent((a) => { TEAL = a; ROSE = a; });

export const CATEGORY_ICONS: Record<string, string> = {
  'Geography':                'globe',
  'Science & Nature':         'zap',
  'Human Body':               'heart',
  'Indian History & Culture': 'book-open',
  'Space & Universe':         'moon',
  'Animals':                  'feather',
  'Technology':               'cpu',
  'Amazing World Records':    'award',
  'Current Affairs':          'radio',
  'Important Day':            'calendar', // GK fact from the important-days book
};
