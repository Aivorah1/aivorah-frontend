import { useCallback, useEffect, useRef, useState } from 'react';
import { followupApi, type WorkedOn } from '../services/practiceFollowupApi';

// "What you worked on" for every wrong question of one test (saved records only).
export function useWorkedOn(attemptId: string | null | undefined) {
  const [byIndex, setByIndex] = useState<Record<number, WorkedOn>>({});
  const seq = useRef(0);
  const reload = useCallback(async () => {
    if (!attemptId) { setByIndex({}); return; }
    const mine = ++seq.current;
    try {
      const d = await followupApi.workedOn(attemptId);
      if (mine === seq.current) setByIndex(Object.fromEntries((d.questions || []).map((q) => [q.index, q])));
    } catch {
      // The report itself never depends on this box.
    }
  }, [attemptId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load when the attempt changes
  useEffect(() => { reload(); }, [reload]);
  return { byIndex, reload };
}
