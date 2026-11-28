import { useEffect, useState } from 'react';
import LEARNING_PATHS_SERVER_URL from '../../../../config/learningPathsServerUrl';
import { getIBPYPStaticSubjects } from '../utils';
import type { SubjectData } from '../types';

export function useSubjects(curriculum: string, grade: string, isCBSE: boolean, isPYP: boolean) {
  // Every curriculum's subjects now come from aivorah-learning-paths-service
  // (CBSE from its book-derived chapter data, everything else from Qdrant).
  // Verified via live query comparison against the monolith for every
  // curriculum in the real onboarding list (OnboardingScreen.tsx's
  // CURRICULA): IB PYP needed a curriculum-name normalization fix on the
  // service side (Qdrant stores it as "IB_PYP", not "IB PYP" — see
  // services/qdrant.js's normaliseCurriculumForQdrant); Cambridge, IB DP,
  // IB MYP, and CBSE already matched at every grade with no gaps; ICSE has
  // no ingested content anywhere yet (monolith or Qdrant), so it's identical
  // either way.
  // Server (Qdrant) is the source of truth for subjects. We no longer pre-seed a
  // stale static IB PYP list — that painted first then got swapped for the real
  // set (different topic counts + extra subjects), which looked like a flicker.
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [revision, setRevision] = useState(0);
  const scope = JSON.stringify([curriculum, grade]);
  const [resolvedScope, setResolvedScope] = useState('');

  useEffect(() => {
    let cancelled = false;
    // data fetching effect — reset loading/error state before the async fetch below
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    setWarning('');
    // Never show the previous curriculum/grade's list while the new one loads (parent switching child).
    setSubjects([]);
    if (!curriculum || !grade) {
      setResolvedScope(scope);
      setLoading(false);
      return;
    }

    // For CBSE, query Qdrant with curriculum=CBSE
    const queryCurriculum = isCBSE ? 'CBSE' : curriculum;

    fetch(`${LEARNING_PATHS_SERVER_URL}/curriculum/subjects?grade=${encodeURIComponent(grade)}&curriculum=${encodeURIComponent(queryCurriculum)}`)
      .then((r) => { if (r.ok === false) throw new Error('Could not load subjects'); return r.json(); })
      .then((data: { subjects: SubjectData[] }) => {
        if (cancelled) return;
        if (!Array.isArray(data.subjects)) throw new Error('Invalid subjects response');
        if (data.subjects.length > 0) {
          setSubjects(data.subjects.map(subject => ({ ...subject, topics: subject.topics ?? [] })));
        } else if (isPYP) {
          // Offline / empty fallback only (server is the source of truth).
          setSubjects(getIBPYPStaticSubjects(grade));
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (isPYP) {
          setSubjects(getIBPYPStaticSubjects(grade));
          setWarning('Could not load the latest syllabus. Try again.');
        }
        else setError('Could not load curriculum right now. Check if the server is running and try again.');
      })
      .finally(() => {
        if (!cancelled) { setResolvedScope(scope); setLoading(false); }
      });

    return () => {
      cancelled = true;
    };
  }, [curriculum, grade, isCBSE, isPYP, revision, scope]);

  return {
    subjects: resolvedScope === scope ? subjects : [],
    loading: !!curriculum && !!grade && (loading || resolvedScope !== scope),
    error: resolvedScope === scope ? error : '',
    warning: resolvedScope === scope ? warning : '',
    retry: () => setRevision(value => value + 1),
  };
}
