// Teacher → AI Teaching Insights → Learning Path → Need Support.
// One row per student (counted once) with every reason that applies:
//   - Inactive: the existing rule (resolveStudentStatus === 'needs_attention',
//     no learning activity for 7+ days) — unchanged.
//   - Needs topic help: from learning-paths-service /practice-followup/teacher/support
//     (difficulty on 2+ distinct questions for one skill, still unresolved).
import type { TopicHelp } from '../../../student/learning-paths/practice-followup/services/practiceFollowupApi';

export type SupportReason =
  | { kind: 'inactive'; label: 'Inactive'; detail: string }
  | { kind: 'topic_help'; label: 'Needs topic help'; detail: string; skillId: string };

export interface NeedSupportRow {
  student: any;
  reasons: SupportReason[];
}

export type TopicHelpByStudent = Record<string, TopicHelp[]>;

function inactiveDetail(lastActive: string | null | undefined, now: number): string {
  if (!lastActive) return 'No learning activity yet';
  const t = new Date(lastActive).getTime();
  if (Number.isNaN(t)) return 'No recent learning activity';
  const days = Math.max(0, Math.floor((now - t) / 86400000));
  return `No learning activity for ${days} day${days === 1 ? '' : 's'}`;
}

export function buildNeedSupport(students: any[], allNeedsAttention: any[], topicHelp: TopicHelpByStudent = {}, now: number = Date.now()): NeedSupportRow[] {
  const inactiveIds = new Set(allNeedsAttention.map((s) => s.id));
  const rows: NeedSupportRow[] = [];
  for (const s of students) {
    const reasons: SupportReason[] = [];
    if (inactiveIds.has(s.id)) reasons.push({ kind: 'inactive', label: 'Inactive', detail: inactiveDetail(s.lastActive, now) });
    for (const h of topicHelp[s.id] || []) {
      reasons.push({ kind: 'topic_help', label: 'Needs topic help', detail: `${h.shortName} · repeated difficulty`, skillId: h.skillId });
    }
    if (reasons.length) rows.push({ student: s, reasons });
  }
  // Students the teacher sees as inactive but who aren't in `students` (defensive).
  for (const s of allNeedsAttention) {
    if (!rows.some((r) => r.student.id === s.id)) rows.push({ student: s, reasons: [{ kind: 'inactive', label: 'Inactive', detail: inactiveDetail(s.lastActive, now) }] });
  }
  // Topic help first, then by name.
  return rows.sort((a, b) => {
    const ah = a.reasons.some((r) => r.kind === 'topic_help') ? 0 : 1;
    const bh = b.reasons.some((r) => r.kind === 'topic_help') ? 0 : 1;
    return ah - bh || String(a.student.name || '').localeCompare(String(b.student.name || ''));
  });
}
