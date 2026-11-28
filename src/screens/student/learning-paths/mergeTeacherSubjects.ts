import { curriculumFlags } from './utils';
import type { SubjectData, TopicItem } from './types';
import type { LoadedTeacherPath } from './teacher-learning-paths/hooks/useTeacherPaths';

const boardKey = (board: string) => curriculumFlags(board).label.toLowerCase().replace(/[ _-]/g, '');
const norm = (v?: string | null) => String(v || '').toLowerCase().replace(/^grade\s*/, '').trim();

// A teacher's published units are part of the subject like its book chapters: they add to that subject card's
// chapter and topic counts, and a subject with no card yet (IB has no standard syllabus) gets one built from them.
export function mergeTeacherSubjects(subjects: SubjectData[], paths: LoadedTeacherPath[], grade: string, curriculum?: string): SubjectData[] {
  const bySubject = new Map<string, { name: string; units: string[]; topics: TopicItem[] }>();
  for (const { summary, path } of paths) {
    const name = summary.subject || path.content.metadata?.subject;
    const pathGrade = summary.grade || path.content.metadata?.grade;
    const pathCurriculum = path.content.metadata?.curriculum;
    if (!name || (pathGrade && norm(pathGrade) !== norm(grade))) continue;
    if (curriculum && pathCurriculum && boardKey(curriculum) !== boardKey(pathCurriculum)) continue;
    const entry = bySubject.get(norm(name)) || { name, units: [], topics: [] };
    for (const unit of path.content.units) {
      entry.units.push(unit.title || '');
      for (const t of unit.topics) entry.topics.push({ topic: t.title || '', unit: unit.title || '', description: '' });
    }
    bySubject.set(norm(name), entry);
  }

  const merged = subjects.map((s) => {
    const extra = bySubject.get(norm(s.subject));
    if (!extra) return s;
    bySubject.delete(norm(s.subject));
    const chapters = s.chapterCount ?? s.chapters?.length ?? 0;
    return {
      ...s,
      ...(chapters > 0 ? { chapterCount: chapters + extra.units.length } : { unitCount: (s.unitCount ?? s.units?.length ?? 0) + extra.units.length }),
      topicCount: s.topicCount + extra.topics.length,
      topics: [...s.topics, ...extra.topics],
      units: [...(s.units || []), ...extra.units],
    };
  });
  const added: SubjectData[] = [...bySubject.values()].map((e) => ({
    subject: e.name, topicCount: e.topics.length, topics: e.topics, chapterCount: e.units.length, unitCount: e.units.length, units: e.units, books: [],
  }));
  return [...merged, ...added];
}
