// Same rules as the service (current-affairs/services/content.js): a warning,
// never a block, when "What happened" is outside these word counts.
export const LENGTH_LIMITS: Record<string, { label: string; target: string; min: number; max: number }> = {
  what_happened_kid: { label: 'Ages 7-12', target: '50-80', min: 40, max: 95 },
  what_happened_teen: { label: 'Ages 13-15', target: '100-150', min: 90, max: 165 },
};

export function countWords(text?: string | null): number {
  return String(text || '').split(/\s+/).filter(Boolean).length;
}

/** "68 words" plus a warning when outside the limits, for one text box. */
export function lengthCheck(field: string, text?: string | null): { words: number; warning: string | null } {
  const words = countWords(text);
  const l = LENGTH_LIMITS[field];
  if (!l || (words >= l.min && words <= l.max)) return { words, warning: null };
  return { words, warning: `${words} words; aim for ${l.target}.` };
}

/** Pictures come only from an https link the editor pastes. */
export const isHttpsUrl = (value?: string | null) => /^https:\/\/\S+$/i.test(String(value || '').trim());
