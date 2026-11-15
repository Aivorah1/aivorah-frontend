import { Platform } from 'react-native';
import { fetchWorksheetDocx } from '../services/worksheetsApi';

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const WEB_ONLY = 'Download is available on the Aivorah web app.';

// "12 Nov 2026, 3:05 PM"
export function formatWorksheetDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Saves the document to the teacher's device as a Word (.docx) file. Returns the file name. */
export async function downloadWorksheetDocx(id: string): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') throw new Error(WEB_ONLY);
  const { base64, fileName, mimeType } = await fetchWorksheetDocx(id);
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType || DOCX_MIME }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}

/** The prepared document as the file the Upload Worksheet flow takes (for Assign). */
export async function preparedWorksheetFile(id: string): Promise<{ name: string; base64: string; mime: string }> {
  const { base64, fileName, mimeType } = await fetchWorksheetDocx(id);
  return { name: fileName, base64, mime: mimeType || DOCX_MIME };
}
