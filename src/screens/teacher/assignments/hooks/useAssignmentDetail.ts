import { useEffect, useState } from 'react';
import type { Assignment } from '../types';
import ASSIGNMENTS_SERVER_URL from '../../../../config/assignmentsServerUrl';

// Owns the assignment Detail modal — submissions fetch on open/close, tab
// state, and per-submission teacher feedback. Both endpoints (GET
// /:id/submissions, PUT /:id/teacher-feedback) now route to
// aivorah-assignments-service (2026-08-25) — ported verbatim into that repo
// alongside this switch, no behavior change.
export function useAssignmentDetail(teacherEmail?: string) {
  const [detailAssignment, setDetailAssignment] = useState<Assignment | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'students' | 'questions'>('overview');
  const [detailSubmissions, setDetailSubmissions] = useState<any[]>([]);
  const [detailTotalLinked, setDetailTotalLinked] = useState(0);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  // Student whose sent feedback is open in the editor (new feedback needs no Edit tap).
  const [editingFeedbackFor, setEditingFeedbackFor] = useState<string | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    if (!detailAssignment) {
      // reset when the detail modal closes — the effect also owns the fetch
      // path below when it's open, so this stays as one effect
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetailSubmissions([]);
      setDetailTotalLinked(0);
      setDetailTab('overview');
      setExpandedStudent(null);
      setTeacherFeedback('');
      setEditingFeedbackFor(null);
      return;
    }
    setLoadingSubmissions(true);
    fetch(`${ASSIGNMENTS_SERVER_URL}/assignments/${detailAssignment.id}/submissions`)
      .then(r => r.ok ? r.json() : { submissions: [], totalLinked: 0 })
      .then(data => { setDetailSubmissions(data.submissions || []); setDetailTotalLinked(data.totalLinked || 0); })
      .catch(() => {})
      .finally(() => setLoadingSubmissions(false));
  }, [detailAssignment?.id]);

  async function sendFeedback(assignmentId: string, studentId: string, perQuestionComments?: Record<number, string>) {
    if (!teacherFeedback.trim() && (!perQuestionComments || Object.keys(perQuestionComments).length === 0)) return;
    setSendingFeedback(true);
    try {
      // Empty comments are sent too: the server treats them as "remove this
      // question's comment", so a teacher can clear one they wrote earlier.
      const commentsArray = perQuestionComments
        ? Object.entries(perQuestionComments)
            .map(([k, v]) => ({ number: parseInt(k, 10), comment: v.trim() }))
            .filter(c => Number.isInteger(c.number) && c.number > 0)
        : [];
      const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/assignments/${assignmentId}/teacher-feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          feedback: teacherFeedback.trim(),
          perQuestionComments: commentsArray,
          teacherEmail,
        }),
      });
      if (res.ok) {
        // The server answers with the merged feedback it saved; use it so the
        // screen shows exactly what the student and parent will see.
        let saved: any = null;
        try { saved = (await res.json())?.feedback ?? null; } catch { saved = null; }
        // Update the local submission with teacher feedback
        setDetailSubmissions(prev => prev.map(s => {
          if (s.studentId !== studentId) return s;
          if (saved && typeof saved === 'object') return { ...s, aiFeedback: JSON.stringify(saved) };
          let fbObj: any = {};
          try { fbObj = JSON.parse(s.aiFeedback || '{}'); } catch { fbObj = { text: s.aiFeedback || '' }; }
          const now = new Date().toISOString();
          if (teacherFeedback.trim()) {
            if (fbObj.teacherFeedback) fbObj.teacherFeedbackEditedAt = now;
            else fbObj.teacherFeedbackAt = now;
            fbObj.teacherFeedback = teacherFeedback.trim();
          }
          if (commentsArray.length > 0) {
            const byNumber = new Map<number, any>();
            (Array.isArray(fbObj.perQuestionComments) ? fbObj.perQuestionComments : [])
              .forEach((c: any) => { if (c && typeof c.number === 'number') byNumber.set(c.number, c); });
            commentsArray.forEach(c => {
              if (!c.comment) byNumber.delete(c.number);
              else if (byNumber.get(c.number)?.comment !== c.comment) byNumber.set(c.number, { ...c, commentedAt: now });
            });
            fbObj.perQuestionComments = [...byNumber.values()].sort((x, y) => x.number - y.number);
          }
          return { ...s, aiFeedback: JSON.stringify(fbObj) };
        }));
        setEditingFeedbackFor(null);
      }
    } catch {/* ignore */}
    setSendingFeedback(false);
  }

  return {
    detailAssignment, setDetailAssignment, detailTab, setDetailTab,
    detailSubmissions, detailTotalLinked, loadingSubmissions,
    expandedStudent, setExpandedStudent,
    teacherFeedback, setTeacherFeedback, sendingFeedback, sendFeedback,
    editingFeedbackFor, setEditingFeedbackFor,
  };
}
