import { useEffect, useState } from 'react';
import { fetchWeeklyActivity } from '../services/progressService';
import type { DayActivity } from '../types';

export function useWeeklyActivity(studentId: string | undefined, activityRevision = 0) {
  const [result, setResult] = useState<{ key: string; days: DayActivity[]; error: boolean }>({ key: '', days: [], error: false });
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([studentId, activityRevision, revision]);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    fetchWeeklyActivity(studentId)
      .then(weekly => { if (!cancelled) setResult({ key, days: weekly.days, error: false }); })
      .catch(() => { if (!cancelled) setResult({ key, days: [], error: true }); });
    return () => { cancelled = true; };
  }, [studentId, key]);

  return {
    weeklyDays: result.key === key ? result.days : [],
    loading: result.key !== key,
    error: result.key === key && result.error,
    retry: () => setRevision(value => value + 1),
  };
}
