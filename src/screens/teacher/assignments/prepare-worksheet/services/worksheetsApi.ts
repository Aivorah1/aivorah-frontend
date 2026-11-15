// Prepare Worksheet - aivorah-assignments-service /worksheets. Signed-in
// requests: the server takes the teacher from the Firebase token and only
// returns their own documents, or ones shared with them by teachers of
// their school (sharing is checked there too).
import ASSIGNMENTS_SERVER_URL from '../../../../../config/assignmentsServerUrl';
import { authHeader } from '../../../../../services/authHeader';

export interface WorksheetSummary { id: string; title: string; created_at?: string; updated_at: string }
export interface Worksheet extends WorksheetSummary {
  html: string;
  isOwner: boolean;
  sharedBy: { name: string; email: string } | null;
  sharedAt: string | null;
}
export interface SharedWorksheet { id: string; title: string; updated_at: string; shared_at: string; shared_by_name: string; shared_by_email: string | null }
export interface SchoolTeacher { id: string; name: string; email: string }
export interface WorksheetDocx { fileName: string; mimeType: string; base64: string }

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}, fallback = 'Request failed'): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeader()) };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/worksheets${path}`, {
    method: init.method || 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || fallback);
  return data as T;
}

export const listWorksheets = () =>
  request<{ items: WorksheetSummary[] }>('', {}, 'Could not load your documents').then((d) => d.items || []);

export const openWorksheet = (id: string) =>
  request<{ item: Worksheet }>(`/${id}`, {}, 'Could not open this document').then((d) => d.item);

export const createWorksheet = (title: string, html: string) =>
  request<{ item: WorksheetSummary }>('', { method: 'POST', body: { title, html } }, 'Could not save this document').then((d) => d.item);

export const updateWorksheet = (id: string, title: string, html: string) =>
  request<{ item: WorksheetSummary }>(`/${id}`, { method: 'PUT', body: { title, html } }, 'Could not save this document').then((d) => d.item);

export const listSharedWorksheets = () =>
  request<{ items: SharedWorksheet[] }>('/shared', {}, 'Could not load documents shared with you').then((d) => d.items || []);

export const listSchoolTeachers = () =>
  request<{ teachers: SchoolTeacher[] }>('/teachers', {}, 'Could not load the teachers of your school').then((d) => d.teachers || []);

export const shareWorksheet = (id: string, teacherId: string) =>
  request<{ sharedWith: SchoolTeacher }>(`/${id}/share`, { method: 'POST', body: { teacherId } }, 'Could not share this document').then((d) => d.sharedWith);

export const fetchWorksheetDocx = (id: string) =>
  request<WorksheetDocx>(`/${id}/docx`, {}, 'Could not create the Word file');
