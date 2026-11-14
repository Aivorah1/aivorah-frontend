// Teacher Student Report — aivorah-attendance-service /reports (permissions are enforced there).
import ATTENDANCE_SERVER_URL from '../../../../config/attendanceServerUrl';
import { authHeader } from '../../../../services/authHeader';
import { uploadAttachment } from '../../../shared/messages/services/messagesService';

export interface ReportClassRef { grade: string; section: string }
export interface HomeClass extends ReportClassRef { label: string }
export interface TaughtGrade { grade: string; sections: { section: string; subjects: string[] }[] }
export interface ReportClasses { academicYear: string; homeClasses: HomeClass[]; grades: TaughtGrade[] }

export interface ReportStudent { id: string; name: string; admissionNumber: string | null }
export interface ClassReportInfo extends ReportClassRef {
  academicYear: string;
  isHomeClass: boolean;
  mySubjects: string[];
  canDownload: boolean;
  canShare: boolean;
  students: ReportStudent[];
}

export interface ReportRow { sno: number; subject: string; marks: number; maxMarks: number; result: 'Pass' | 'Fail' }
export interface StudentReport {
  school: { name: string; logoUrl: string | null };
  student: { id: string; name: string; grade: string; section: string; admissionNumber: string | null };
  academicYear: string;
  generatedAt: string;
  canDownload: boolean;
  canShare: boolean;
  full: boolean;
  rows: ReportRow[];
  total: { obtained: number; max: number };
  percentage: number | null;
  rating: { label: string; remark: string } | null;
  pendingSubjects: string[];
  passMark: number;
  maxMarks: number;
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeader()) };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${ATTENDANCE_SERVER_URL}${path}`, {
    method: init.method || 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
}

const q = (params: Record<string, string>) => new URLSearchParams(params).toString();

export const fetchReportClasses = () => request<ReportClasses>('/reports/classes');

export const fetchClassReportInfo = (c: ReportClassRef) =>
  request<ClassReportInfo>(`/reports/class?${q({ grade: c.grade, section: c.section })}`);

export const fetchSubjectMarks = (c: ReportClassRef, subject: string) =>
  request<{ subject: string; marks: Record<string, number>; maxMarks: number }>(
    `/reports/marks?${q({ grade: c.grade, section: c.section, subject })}`);

export const saveSubjectMarks = (c: ReportClassRef, subject: string, marks: Record<string, number>) =>
  request<{ ok: true; saved: number; subject: string }>('/reports/marks', {
    method: 'PUT', body: { grade: c.grade, section: c.section, subject, marks },
  });

export const fetchStudentReport = (studentId: string) =>
  request<StudentReport>(`/reports/students/${encodeURIComponent(studentId)}`);

// Upload the PDF through messages-service (Cloudinary), then ask the report API to
// send it — the API checks this teacher is the class teacher and picks the recipients.
export async function shareStudentReport(studentId: string, pdf: Blob, fileName: string) {
  const form = new FormData();
  form.append('file', pdf as any, fileName);
  const up = await uploadAttachment(form);
  const uploaded = await up.json().catch(() => ({}));
  if (!up.ok || !uploaded?.url) throw new Error(uploaded?.error || 'Could not upload the report PDF');
  return request<{ ok: true; sentTo: { email: string; name: string; role: 'student' | 'parent' }[] }>(
    `/reports/students/${encodeURIComponent(studentId)}/share`,
    { method: 'POST', body: { attachmentUrl: uploaded.url, attachmentName: fileName, attachmentSize: uploaded.size ?? pdf.size } },
  );
}
