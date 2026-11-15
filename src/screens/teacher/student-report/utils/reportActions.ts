import { Platform } from 'react-native';
import { fetchStudentReport, shareStudentReport } from '../services/studentReportApi';
import type { StudentReport } from '../services/studentReportApi';
import { buildReportPdf } from './reportPdf';
import { reportFileName } from './reportFormat';

const WEB_ONLY = 'Download and Share are available on the Aivorah web app.';

// Always re-fetch: the server decides whether this teacher may download/share (class teacher only).
async function fullReport(studentId: string): Promise<StudentReport> {
  const report = await fetchStudentReport(studentId);
  if (!report.canDownload) throw new Error('Only the class teacher can download or share the full report');
  return report;
}

export async function downloadReport(studentId: string): Promise<string> {
  if (Platform.OS !== 'web') throw new Error(WEB_ONLY);
  const report = await fullReport(studentId);
  const doc = await buildReportPdf(report);
  const name = reportFileName(report);
  doc.save(name);
  return name;
}

export async function shareReport(studentId: string) {
  if (Platform.OS !== 'web') throw new Error(WEB_ONLY);
  const report = await fullReport(studentId);
  const doc = await buildReportPdf(report);
  const blob = doc.output('blob') as Blob;
  return shareStudentReport(studentId, blob, reportFileName(report));
}
