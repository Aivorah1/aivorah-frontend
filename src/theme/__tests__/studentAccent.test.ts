/* eslint-disable @typescript-eslint/no-require-imports -- each test needs a fresh copy of the module registry */
describe('studentAccent (Website Redesign, Phase 3)', () => {
  beforeEach(() => jest.resetModules());

  test('swapAccent keeps alpha suffixes and leaves other colours alone', () => {
    const { swapAccent } = require('../studentAccent');
    expect(swapAccent('#C8551C', '#A9D5FF')).toBe('#A9D5FF');
    expect(swapAccent('#c8551c20', '#A9D5FF')).toBe('#A9D5FF20');
    expect(swapAccent('#B8431240', '#A9D5FF')).toBe('#A9D5FF40');
    expect(swapAccent('#9FB2A4', '#A9D5FF')).toBe('#9FB2A4');
    expect(swapAccent('eye', '#A9D5FF')).toBe('eye');
  });

  test('registered tables and string setters follow light and dark', () => {
    const { followStudentAccent, applyStudentAccent, STUDENT_ACCENT } = require('../studentAccent');
    const table = { a: '#C8551C', nested: [{ color: '#C8551C18', icon: 'star', label: () => 'x' }], other: '#23803A' };
    let single = '#C8551C';
    followStudentAccent(table, (a: string) => { single = a; });

    applyStudentAccent(true);
    expect(table.a).toBe(STUDENT_ACCENT.dark);
    expect(table.nested[0].color).toBe(STUDENT_ACCENT.dark + '18');
    expect(table.nested[0].icon).toBe('star');
    expect(table.other).toBe('#23803A');
    expect(single).toBe(STUDENT_ACCENT.dark);

    applyStudentAccent(false);
    expect(table.a).toBe(STUDENT_ACCENT.light);
    expect(table.nested[0].color).toBe(STUDENT_ACCENT.light + '18');
    expect(single).toBe(STUDENT_ACCENT.light);
  });

  test('a table registered after the theme is set is updated at once', () => {
    const { followStudentAccent, applyStudentAccent, STUDENT_ACCENT } = require('../studentAccent');
    applyStudentAccent(true);
    const late = { c: '#C8551C' };
    followStudentAccent(late);
    expect(late.c).toBe(STUDENT_ACCENT.dark);
  });

  test('World & You accent exports switch with the theme', () => {
    const { applyStudentAccent, STUDENT_ACCENT } = require('../studentAccent');
    const wy = require('../../screens/student/world-and-you/constants');
    expect(wy.TEAL).toBe('#C8551C');
    applyStudentAccent(true);
    expect(wy.TEAL).toBe(STUDENT_ACCENT.dark);
    expect(wy.ROSE).toBe(STUDENT_ACCENT.dark);
  });
});
