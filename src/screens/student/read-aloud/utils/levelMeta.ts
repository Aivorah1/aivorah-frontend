export const LEVEL_META: Record<string, { bg: string; text: string; label: string; border: string }> = {
  easy: { bg: '#9FB2A420', text: '#9FB2A4', label: 'Easy', border: '#9FB2A440' },
  medium: { bg: '#24877B20', text: '#24877B', label: 'Medium', border: '#24877B40' },
  hard: { bg: '#C98A8A20', text: '#C98A8A', label: 'Hard', border: '#C98A8A40' },
};

export const RESULT_META: Record<string, { ring: string; label: string; icon: string }> = {
  excellent: { ring: '#9FB2A4', label: 'Excellent!', icon: 'star' },
  good: { ring: '#C3DCD8', label: 'Good Job!', icon: 'thumbs-up' },
  developing: { ring: '#24877B', label: 'Keep Going!', icon: 'trending-up' },
  'needs-practice': { ring: '#C98A8A', label: 'Keep Practising!', icon: 'heart' },
};

export const STATUS_COLORS = { correct: '#9FB2A4', misread: '#C98A8A', skipped: '#24877B' } as const;

export const DEFAULT_GRADIENT: [string, string] = ['#9FB2A4', '#C3DCD8'];

export function levelMeta(level?: string) {
  return LEVEL_META[level || 'easy'] || LEVEL_META.easy;
}
