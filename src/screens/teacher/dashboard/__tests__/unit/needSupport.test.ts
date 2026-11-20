import { buildNeedSupport } from '../../utils/needSupport';

const NOW = new Date('2026-11-20T12:00:00Z').getTime();

test('Inactive, Needs topic help, or both — each student once, topic help first', () => {
  const students = [
    { id: 'dev', name: 'Dev', lastActive: '2026-11-12' },
    { id: 'kiran', name: 'Kiran', lastActive: '2026-11-20' },
    { id: 'asha', name: 'Asha', lastActive: '2026-11-01' },
    { id: 'ok', name: 'Okay', lastActive: '2026-11-20' },
  ];
  const rows = buildNeedSupport(students, [students[0], students[2]], {
    kiran: [{ skillId: 'p', shortName: 'Puns and alliteration' } as any],
    asha: [{ skillId: 'f', shortName: 'Equivalent fractions' } as any],
  }, NOW);
  expect(rows.map((r) => r.student.id)).toEqual(['asha', 'kiran', 'dev']);
  expect(rows[0].reasons.map((r) => r.label)).toEqual(['Inactive', 'Needs topic help']);
  expect(rows[1].reasons[0]).toMatchObject({ kind: 'topic_help', detail: 'Puns and alliteration · repeated difficulty', skillId: 'p' });
  expect(rows[2].reasons[0].detail).toBe('No learning activity for 8 days');
});
