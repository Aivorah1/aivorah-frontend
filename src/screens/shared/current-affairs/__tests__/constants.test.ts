import {
  ageGroupForGrade, ageGroupForAge, ageFromDob, ageGroupForStudent, normalizeAgeGroup,
  formatReadTime, CATEGORIES, AGE_GROUPS, GOLD, SAGE,
} from '../constants';

test.each([
  ['Nursery', '7-12'], ['LKG', '7-12'], ['UKG', '7-12'], ['Pre-KG', '7-12'],
  ['Grade 1', '7-12'], ['Grade 5', '7-12'], ['Grade 8', '7-12'], ['8', '7-12'],
  ['Grade 9', '13-15'], ['Grade 12', '13-15'], ['10', '13-15'],
  [undefined, '7-12'], ['', '7-12'], ['Unknown', '7-12'],
])('grade %p → %s', (grade, expected) => {
  expect(ageGroupForGrade(grade as any)).toBe(expected);
});

test.each([[4, '7-12'], [7, '7-12'], [12, '7-12'], [13, '13-15'], [15, '13-15'], [17, '13-15']])(
  'age %p → %s (under 8 reads 7-12)', (age, expected) => {
    expect(ageGroupForAge(age)).toBe(expected);
  });

test('ageFromDob counts whole years and ignores bad dates', () => {
  const today = new Date('2026-11-15T10:00:00Z');
  expect(ageFromDob('2013-11-15', today)).toBe(13);
  expect(ageFromDob('2013-11-16', today)).toBe(12);
  expect(ageFromDob('2019-02-01T00:00:00.000Z', today)).toBe(7);
  expect(ageFromDob('2013-02-30', today)).toBeNull();
  expect(ageFromDob('', today)).toBeNull();
  expect(ageFromDob(undefined, today)).toBeNull();
  expect(ageFromDob('15/11/2013', today)).toBeNull();
});

test('ageGroupForStudent uses the date of birth first, then the grade', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-11-15T10:00:00Z'));
  try {
    expect(ageGroupForStudent({ dob: '2013-01-01', grade: 'Grade 7' })).toBe('13-15');
    expect(ageGroupForStudent({ dob: '2020-05-01', grade: 'UKG' })).toBe('7-12');
    expect(ageGroupForStudent({ grade: 'Grade 10' })).toBe('13-15');
    expect(ageGroupForStudent({ dob: 'not a date', grade: 'Grade 3' })).toBe('7-12');
    expect(ageGroupForStudent(null)).toBe('7-12');
  } finally {
    jest.useRealTimers();
  }
});

test('old age-group values are converted; unknown ones are not', () => {
  expect(normalizeAgeGroup('under-8')).toBe('7-12');
  expect(normalizeAgeGroup('8-12')).toBe('7-12');
  expect(normalizeAgeGroup('13+')).toBe('13-15');
  expect(normalizeAgeGroup('7-12')).toBe('7-12');
  expect(normalizeAgeGroup('13-15')).toBe('13-15');
  expect(normalizeAgeGroup('adult')).toBeNull();
  expect(normalizeAgeGroup(undefined)).toBeNull();
});

test('only two age groups, with the service’s stories per day', () => {
  expect(Object.keys(AGE_GROUPS)).toEqual(['7-12', '13-15']);
  expect(AGE_GROUPS['7-12'].storiesPerDay).toBe(6);
  expect(AGE_GROUPS['13-15'].storiesPerDay).toBe(7);
});

test('all 7 categories have a label and a Feather icon (no emoji)', () => {
  expect(Object.keys(CATEGORIES).sort()).toEqual(['economy', 'environment', 'india', 'science', 'society', 'sports', 'world']);
  for (const cat of Object.values(CATEGORIES)) {
    expect(cat.label).toBeTruthy();
    expect(cat.icon).toMatch(/^[a-z-]+$/);
  }
});

test('uses the app palette (gold + sage, same as World & You / Daily Habits)', () => {
  expect(GOLD).toBe('#BAA467');
  expect(SAGE).toBe('#9FB2A4');
});

test('formatReadTime', () => {
  expect(formatReadTime(45)).toBe('45 sec read');
  expect(formatReadTime(10)).toBe('30 sec read');
  expect(formatReadTime(75)).toBe('1 min read');
  expect(formatReadTime(150)).toBe('3 min read');
});
