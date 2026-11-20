/**
 * Learning Report download (Parent → AI Progress Report → Download Report;
 * Teacher → Student Report → Learning Report). Same server data for both:
 * aivorah-learning-paths-service GET /practice-followup/report/students/:id,
 * which checks the parent is linked / the teacher teaches the student.
 * Built from saved results only — no tutoring chat or reasoning text.
 * PDF via jsPDF (web), same approach as the other report downloads.
 */
import { Platform } from 'react-native';
import { followupApi, type LearningReport, type LearningReportTest } from '../../student/learning-paths/practice-followup/services/practiceFollowupApi';

const LEVEL = ['', 'basic', 'standard', 'challenge'];
const OUTCOME: Record<string, string> = {
  independent: 'remembered and answered on their own',
  assisted: 'answered with a hint',
  incorrect: 'not right yet',
  skipped: 'skipped',
  awaiting_verification: 'answered; explanation being checked',
  solution_shown: 'reviewed the solution',
  correct_unverified: 'answered; reasoning to work on',
};
const fmtDate = (t: string) => {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Plain lines for one test — used by the PDF and testable on its own.
export function testLines(t: LearningReportTest): string[] {
  const lines = [`Test on ${fmtDate(t.takenAt)}: ${t.score != null ? `${Math.round(t.score)}%` : '—'}${t.correct != null && t.total ? ` (${t.correct}/${t.total} correct)` : ''}`];
  if (!t.hasFollowUp) {
    lines.push('No follow-up practice yet.');
    return lines;
  }
  if (t.skillsReviewed.length) lines.push(`Skills reviewed: ${t.skillsReviewed.join(', ')}`);
  if (t.explanationsShown) lines.push(`Explanations reviewed: ${t.explanationsShown}`);
  const p = t.practice;
  if (p.total) {
    const parts = [
      p.independent && `${p.independent} on their own`,
      p.assisted && `${p.assisted} with a hint`,
      p.incorrect && `${p.incorrect} not right yet`,
      p.solution_shown && `${p.solution_shown} with the solution shown`,
      p.skipped && `${p.skipped} skipped`,
      p.awaiting_verification && `${p.awaiting_verification} awaiting a short explanation`,
    ].filter(Boolean);
    lines.push(`Practice: ${p.total} fresh question${p.total === 1 ? '' : 's'} — ${parts.join(', ') || 'answered'}`);
  }
  if (t.recurringMistakes.length) lines.push(`Recurring mistake: ${t.recurringMistakes.map((m) => `${m.step} (in ${m.questions} questions)`).join('; ')}`);
  for (const m of t.memoryChecks) {
    lines.push(`Memory check ${fmtDate(m.at)} (${LEVEL[m.level || 1] || 'basic'} question): ${OUTCOME[m.outcome] || m.outcome}${m.helpUsed && m.helpUsed !== 'none' ? ` (help used: ${m.helpUsed})` : ''}`);
  }
  return lines;
}

export async function buildLearningReportPdf(report: LearningReport) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const ML = 16; const W = 210 - 2 * ML; let y = 18;
  const ensure = (h: number) => { if (y + h > 282) { doc.addPage(); y = 18; } };
  const text = (s: string, size = 10.5, bold = false, color: [number, number, number] = [30, 27, 20]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(s.replace(/[^\x20-\x7E -ÿ]/g, (ch) => ({ '—': '-', '–': '-', '“': '"', '”': '"', '’': "'", '‘': "'" } as Record<string, string>)[ch] ?? ''), W);
    ensure(lines.length * size * 0.45 + 1);
    doc.text(lines, ML, y);
    y += lines.length * size * 0.45 + 1.5;
  };
  text('Learning Report', 18, true, [154, 123, 46]);
  text(`${report.student.name || 'Student'}${report.student.grade ? ` · ${report.student.grade}` : ''}${report.student.curriculum ? ` · ${report.student.curriculum}` : ''}`, 12, true);
  text(`Practice tests and follow-up practice · generated ${fmtDate(report.generatedAt)}`, 9.5, false, [120, 112, 95]);
  y += 3;
  if (!report.tests.length) text('No practice tests yet.');
  for (const t of report.tests) {
    ensure(16);
    doc.setDrawColor(225, 215, 190); doc.line(ML, y - 3, ML + W, y - 3);
    text(`${t.subject} · ${t.topic}`, 12, true);
    for (const l of testLines(t)) text(l);
    y += 2;
  }
  y += 2;
  text('Follow-up results are kept separate from the original test score. A single answer does not show mastery of a skill.', 8.5, false, [120, 112, 95]);
  return doc;
}

export function learningReportFileName(report: LearningReport): string {
  const name = String(report.student.name || 'student').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
  return `Aivorah_Learning_Report_${name}_${new Date(report.generatedAt).toISOString().slice(0, 10)}.pdf`;
}

// Fetches (server checks access), builds and saves the PDF. Web only.
export async function downloadLearningReport(studentId: string): Promise<string> {
  if (Platform.OS !== 'web') throw new Error('Downloading the report is available on the Aivorah web app.');
  const report = await followupApi.learningReport(studentId);
  const doc = await buildLearningReportPdf(report);
  const name = learningReportFileName(report);
  doc.save(name);
  return name;
}
