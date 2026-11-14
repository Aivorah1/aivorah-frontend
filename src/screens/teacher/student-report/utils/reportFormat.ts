import type { StudentReport } from '../services/studentReportApi';

// "14 Nov 2026, 10:34 AM" — the report's generated date and time.
export function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
}

export const classLabel = (grade: string, section: string) => `${grade}${section ? ` ${section}` : ''}`;

// Marks without trailing zeros: 72, 72.5, 72.25.
export const formatMarks = (n: number) => String(Math.round(n * 100) / 100);

export function reportFileName(report: Pick<StudentReport, 'student' | 'academicYear'>): string {
  const safe = (s: string) => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safe(report.student.name) || 'Student'}-Report-${safe(report.academicYear)}.pdf`;
}
