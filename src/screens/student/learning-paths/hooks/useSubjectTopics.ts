import { useEffect, useMemo, useState } from 'react';
import { fetchPublishedSyllabus, getCuratedSyllabus } from '../subject-syllabus/api';
import type { SubjectData } from '../types';

// The CBSE/NCERT subject list carries chapter titles. Resolve topics from the same syllabus as the chapter page.
export function useSubjectTopics(subjects: SubjectData[], curriculum: string, grade: string, enabled: boolean) {
  const [result, setResult] = useState<{ key: string; topics: Record<string, SubjectData['topics']>; failed: boolean }>({ key: '', topics: {}, failed: false });
  const [revision, setRevision] = useState(0);
  const missing = useMemo(
    () => subjects.filter((s) => !s.topics.length && s.chapters?.length).map((s) => s.subject),
    [subjects],
  );
  const key = JSON.stringify([curriculum, grade, missing, revision]);

  useEffect(() => {
    if (!enabled || !missing.length) return;
    let cancelled = false;
    Promise.allSettled(missing.map(async (subject) => {
      const units = await fetchPublishedSyllabus(curriculum, grade, subject, true);
      const chapters = units.length ? units : (getCuratedSyllabus(curriculum, grade, subject) ?? []);
      return [subject, chapters.flatMap(chapter => (chapter.topics ?? [])
        .filter(topic => !!topic.name)
        .map(topic => ({ topic: topic.name, unit: chapter.title, description: '' })))] as const;
    })).then((rows) => {
      if (cancelled) return;
      setResult({
        key,
        topics: Object.fromEntries(rows.flatMap(row => row.status === 'fulfilled' ? [row.value] : [])),
        failed: rows.some(row => row.status === 'rejected'),
      });
    });
    return () => { cancelled = true; };
    // `missing` is captured by `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, curriculum, grade]);

  const loadedSubjects = useMemo(() => subjects.map(subject => {
    const topics = result.key === key ? result.topics[subject.subject] : undefined;
    if (!topics) return subject;
    const coveredChapters = new Set(topics.map(topic => topic.unit));
    const missingChapters = (subject.chapters ?? []).filter(chapter => !chapter.title || !coveredChapters.has(chapter.title));
    return { ...subject, topicCount: topics.length, topicsIncomplete: missingChapters.length > 0, topics };
  }), [subjects, result, key]);

  return {
    subjects: loadedSubjects,
    loading: enabled && missing.length > 0 && result.key !== key,
    error: result.key === key && result.failed ? 'Could not load some subject topics. Try again.' : '',
    retry: () => setRevision(value => value + 1),
  };
}
