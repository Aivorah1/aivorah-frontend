// AI Teacher greeting (India time, whatever the device's time zone) and the
// avatar picked from the student's Learning Buddy.
import { greetingFor, greetingLine, indiaHour } from '../utils/greeting';
import { teacherAvatar } from '../utils/buddyAvatar';
import { DEFAULT_BUDDY } from '../../profile/learningBuddyConstants';

// India is UTC+5:30, so 06:30 UTC is 12:00 noon in India.
const utc = (hhmm: string) => new Date(`2026-11-20T${hhmm}:00Z`);

test.each([
  ['00:00', 'Good morning'], // 05:30 IST
  ['06:29', 'Good morning'], // 11:59 IST
  ['06:30', 'Good afternoon'], // 12:00 IST
  ['12:29', 'Good afternoon'], // 17:59 IST
  ['12:30', 'Good evening'], // 18:00 IST
  ['18:29', 'Good evening'], // 23:59 IST
  ['18:30', 'Good morning'], // 00:00 IST, next day
])('at %s UTC the greeting is %s', (time, expected) => {
  expect(greetingFor(utc(time))).toBe(expected);
});

test('indiaHour converts from UTC', () => {
  expect(indiaHour(utc('06:30'))).toBe(12);
  expect(indiaHour(utc('20:00'))).toBe(1);
});

test('the greeting line uses the first name and the buddy name', () => {
  expect(greetingLine('Asha', 'Meera', utc('13:00'))).toBe(
    "Good evening, Asha! I'm Meera, your AI Teacher. Ask me about any topic from your lessons.",
  );
  expect(greetingLine('', 'Aarav', utc('03:00'))).toMatch(/^Good morning, there! I'm Aarav/);
});

test('no saved buddy: the default Learning Buddy', () => {
  const a = teacherAvatar(null);
  expect(a.buddyId).toBe(DEFAULT_BUDDY.buddyId);
  expect(a.name).toBe('Aarav');
  expect(a.source).toBeTruthy();
});

test('the saved Learning Buddy and its custom name are used', () => {
  const a = teacherAvatar({ buddyId: 'meera', customName: 'Miss M', costumeId: DEFAULT_BUDDY.costumeId, emotion: DEFAULT_BUDDY.emotion } as any);
  expect(a.buddyId).toBe('meera');
  expect(a.name).toBe('Miss M');
  expect(a.source).toBeTruthy();
  expect(teacherAvatar({ buddyId: 'kabir', customName: null, costumeId: DEFAULT_BUDDY.costumeId } as any).name).toBe('Kabir');
});

test('an unknown saved buddy falls back to the default', () => {
  expect(teacherAvatar({ buddyId: 'not-a-buddy', customName: null } as any).buddyId).toBe(DEFAULT_BUDDY.buddyId);
});
