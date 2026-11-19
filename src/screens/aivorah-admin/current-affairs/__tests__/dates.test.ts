import { addDays, dayName, indiaToday, publicationLabel } from '../utils/dates';

test("indiaToday is India's date: after 18:30 UTC it is already the next day", () => {
  expect(indiaToday(new Date('2026-11-19T18:29:00Z'))).toBe('2026-11-19');
  expect(indiaToday(new Date('2026-11-19T18:31:00Z'))).toBe('2026-11-20');
});

test('addDays crosses months and years', () => {
  expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
});

test('dayName and publicationLabel relative to today', () => {
  const today = '2026-11-19';
  expect([dayName('2026-11-19', today), dayName('2026-11-20', today), dayName('2026-11-18', today)]).toEqual(['Today', 'Tomorrow', 'Yesterday']);
  expect(dayName('2026-11-21', today)).toBe('Sat 21 Nov');
  expect(publicationLabel('2026-11-20', today)).toEqual({ label: 'Scheduled · students see it tomorrow', kind: 'scheduled' });
  expect(publicationLabel('2026-11-21', today)).toEqual({ label: 'Scheduled · students see it on Sat 21 Nov', kind: 'scheduled' });
  expect(publicationLabel('2026-11-19', today)).toEqual({ label: 'Live today', kind: 'live' });
  expect(publicationLabel('2026-11-18', today)).toEqual({ label: 'Was live yesterday', kind: 'past' });
});
