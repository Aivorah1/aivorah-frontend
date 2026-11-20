import { useCallback, useEffect, useRef, useState } from 'react';
import { followupApi } from '../services/practiceFollowupApi';
import type { Recommendation } from '../types';

// Practise This Skill recommendations (and their saved progress) for one
// original test attempt. Reloads whenever the attempt changes or reload() is
// called (e.g. when the student comes back from Ask Aivorah).
export function useFollowupRecommendations(attemptId: string | null | undefined, topicId?: string) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(!!attemptId);
  const [error, setError] = useState('');
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!attemptId) { setItems([]); setLoading(false); return; }
    const mine = ++seq.current;
    setLoading(true); setError('');
    try {
      const data = await followupApi.recommendations(attemptId, topicId);
      if (mine === seq.current) setItems(data.recommendations || []);
    } catch (e: any) {
      if (mine === seq.current) setError(e?.message || 'Could not load recommended practice.');
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [attemptId, topicId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch when the attempt changes
  useEffect(() => { reload(); }, [reload]);

  return { items, loading, error, reload };
}
