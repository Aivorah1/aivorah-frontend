import type { SubjectData } from './types';

export function completionPercentage(done: number, total: number): number | null {
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return null;
  return Math.round(100 * Math.min(total, Math.max(0, done)) / total);
}

export function measureSubjectProgress(subjects: SubjectData[], completed: Set<string>) {
  const owners = new Map<string, Set<string>>();
  for (const subject of subjects) {
    for (const { topic, unit } of subject.topics) {
      if (!topic) continue;
      const names = owners.get(topic) ?? new Set();
      names.add(JSON.stringify([subject.subject, unit]));
      owners.set(topic, names);
    }
  }
  return subjects.map(subject => {
    const distinctTopics = new Map(subject.topics.filter(({ topic }) => topic).map(({ topic, unit }) => [JSON.stringify([unit, topic]), topic]));
    const isDone = (name: string) => completed.has(name) && owners.get(name)?.size === 1;
    const done = [...distinctTopics.values()].filter(isDone).length;
    // An incomplete index may be enough to navigate, but cannot establish a percentage.
    const total = !subject.topicsIncomplete && subject.topicCount <= subject.topics.length ? distinctTopics.size : 0;
    const chapters = new Map<string, Set<string>>();
    for (const { unit, topic } of subject.topics) {
      if (!unit || !topic) continue;
      const topics = chapters.get(unit) ?? new Set();
      topics.add(topic);
      chapters.set(unit, topics);
    }
    const totalChapters = subject.chapterCount ?? subject.chapters?.length ?? 0;
    const chapterTitles = new Set((subject.chapters ?? []).map(chapter => chapter.title));
    const completedChapters = totalChapters > 0
      ? [...chapters].filter(([unit, topics]) =>
        (chapterTitles.has(unit) || subject.units?.includes(unit)) && [...topics].every(isDone)).length
      : 0;
    return { subject, done, total, pct: completionPercentage(done, total), totalChapters, completedChapters };
  });
}

export type SubjectProgress = ReturnType<typeof measureSubjectProgress>[number];
