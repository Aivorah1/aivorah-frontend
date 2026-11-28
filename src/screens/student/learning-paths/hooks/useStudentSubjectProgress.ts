import { useMemo } from 'react';
import { NO_CONTENT_GRADES } from '../constants';
import { mergeTeacherSubjects } from '../mergeTeacherSubjects';
import { completionPercentage, measureSubjectProgress } from '../subjectProgress';
import { useTeacherPaths } from '../teacher-learning-paths/hooks/useTeacherPaths';
import { curriculumFlags } from '../utils';
import { useSubjects } from './useSubjects';
import { useSubjectTopics } from './useSubjectTopics';

export function useStudentSubjectProgress(curriculum: string, grade: string, completed: Set<string>, studentScope?: string) {
  const { isCBSE, isPYP, label } = curriculumFlags(curriculum);
  const enabled = !!curriculum && !!grade && !NO_CONTENT_GRADES.includes(grade);
  const course = useSubjects(enabled ? curriculum : '', enabled ? grade : '', isCBSE, isPYP);
  const { paths, loaded: teacherLoaded } = useTeacherPaths(enabled ? grade : '', undefined, studentScope);
  const syllabus = useSubjectTopics(course.subjects, label, grade, enabled);
  // Resolve textbook topics first. A teacher path must not suppress syllabus loading by making the topic list nonempty.
  const subjects = useMemo(() => mergeTeacherSubjects(syllabus.subjects, paths, grade, curriculum), [syllabus.subjects, paths, grade, curriculum]);
  const progress = useMemo(() => measureSubjectProgress(subjects, completed), [subjects, completed]);
  const done = progress.reduce((sum, subject) => sum + subject.done, 0);
  const total = progress.reduce((sum, subject) => sum + subject.total, 0);
  const loading = enabled && (course.loading || syllabus.loading || !teacherLoaded);
  const overallPct = loading || course.warning || syllabus.error || progress.some(subject => subject.pct === null)
    ? null
    : completionPercentage(done, total);
  return {
    progress, overallPct, loading,
    error: course.error,
    warning: course.warning || syllabus.error,
    retry: () => { course.retry(); syllabus.retry(); },
  };
}
