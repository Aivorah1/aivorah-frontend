// Dates for the Current Affairs admin, in India time like the service
// (aivorah-world-and-you-service CA_TIME_ZONE, default Asia/Kolkata). The
// digest day changes at midnight India time, not UTC.

const TIME_ZONE = 'Asia/Kolkata';

/** Today's date in India as YYYY-MM-DD. */
export function indiaToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** YYYY-MM-DD plus n days. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Today", "Tomorrow" or e.g. "Fri 21 Nov" for a YYYY-MM-DD date. */
export function dayName(date: string, today: string = indiaToday()): string {
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  if (date === addDays(today, -1)) return 'Yesterday';
  const d = new Date(`${date}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * What an approved (published) story means for students on a given date:
 * live today, scheduled for a later day, or a past day.
 */
export function publicationLabel(date: string, today: string = indiaToday()): { label: string; kind: 'live' | 'scheduled' | 'past' } {
  if (date > today) return { label: `Scheduled · students see it ${dayName(date, today).toLowerCase() === 'tomorrow' ? 'tomorrow' : `on ${dayName(date, today)}`}`, kind: 'scheduled' };
  if (date === today) return { label: 'Live today', kind: 'live' };
  return { label: `Was live ${dayName(date, today).toLowerCase() === 'yesterday' ? 'yesterday' : `on ${dayName(date, today)}`}`, kind: 'past' };
}
