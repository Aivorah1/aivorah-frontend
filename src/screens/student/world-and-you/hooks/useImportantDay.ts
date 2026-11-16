import { useEffect, useState } from 'react';
import SERVER_URL from '../../../../config/worldAndYouServerUrl';
import { readScreenCache, writeScreenCache } from '../../../../utils/screenCache';
import type { ImportantDayEvent } from '../types';

// Every important day on a date (MM-DD) from the GK book, to explain the day
// the GK fact is about. The book doesn't change, so a copy is reused.
export function useImportantDay(date?: string) {
  const key = date ? `gk-day:${date}` : '';
  const [events, setEvents] = useState<ImportantDayEvent[] | null>(() => (key ? readScreenCache<ImportantDayEvent[]>(key) : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!date) { setEvents(null); return; }
      const cached = readScreenCache<ImportantDayEvent[]>(key);
      setEvents(cached);
      setError(false);
      if (cached) return;
      setLoading(true);
      try {
        const res = await fetch(`${SERVER_URL}/current-affairs/gk/date?date=${encodeURIComponent(date)}`);
        if (!res.ok) throw new Error('Server error');
        const json = await res.json();
        const list: ImportantDayEvent[] = Array.isArray(json?.events) ? json.events : [];
        if (cancelled) return;
        setEvents(list);
        if (list.length) writeScreenCache(key, list);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [date, key]);

  return { events, loading, error };
}
