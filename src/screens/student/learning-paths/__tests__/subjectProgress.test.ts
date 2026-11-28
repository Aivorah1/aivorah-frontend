import type { SubjectData } from '../types';
import { completionPercentage, measureSubjectProgress } from '../subjectProgress';

const subject = (name: string): SubjectData => ({
  subject: name,
  chapters: [{ title: 'Unit 1' }, { title: 'Unit 2' }],
  topicCount: 3,
  topics: ['Unit 1', 'Unit 1', 'Unit 2'].map((unit, index) => ({
    topic: name + ' topic ' + index, unit, description: '',
  })),
});

test.each(['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Arts', 'Physical Education and Well Being'])(
  '%s uses topic progress and a separate chapter count', name => {
    const course = subject(name);
    const other = subject('Another subject');
    const measure = (count: number) => measureSubjectProgress([course, other], new Set(course.topics.slice(0, count).map(item => item.topic)));
    expect(measure(0)[0]).toMatchObject({ done: 0, total: 3, pct: 0, completedChapters: 0 });
    expect(measure(1)[0]).toMatchObject({ done: 1, total: 3, pct: 33, completedChapters: 0 });
    expect(measure(2)[0]).toMatchObject({ done: 2, total: 3, pct: 67, completedChapters: 1 });
    expect(measure(3)).toMatchObject([{ done: 3, pct: 100, completedChapters: 2 }, { done: 0, pct: 0 }]);
  },
);

test('incomplete metadata and missing denominators remain unavailable', () => {
  const course = subject('History');
  expect(measureSubjectProgress([{ ...course, topicsIncomplete: true }], new Set())[0].pct).toBeNull();
  expect(measureSubjectProgress([{ ...course, topicCount: 4 }], new Set())[0].pct).toBeNull();
  expect(completionPercentage(0, 0)).toBeNull();
  expect(completionPercentage(-1, 3)).toBe(0);
  expect(completionPercentage(4, 3)).toBe(100);
});

test('a legacy name shared across subjects or chapters cannot complete both records', () => {
  const course = subject('History');
  const other = subject('Arts');
  const shared = course.topics[0].topic;
  other.topics[0].topic = shared;
  expect(measureSubjectProgress([course, other], new Set([shared])).map(entry => entry.done)).toEqual([0, 0]);

  course.topics[2].topic = shared;
  expect(measureSubjectProgress([course], new Set([shared]))[0]).toMatchObject({ done: 0, total: 3 });
});
