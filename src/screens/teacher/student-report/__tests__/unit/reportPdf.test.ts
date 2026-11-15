// The fixed report template: header (logo left, school centre, generated right), the
// S.No | Subject Name | Marks | Pass / Fail table with a Total marks row, then the rating.
import { buildReportPdf } from '../../utils/reportPdf';
import { formatGeneratedAt, reportFileName, formatMarks } from '../../utils/reportFormat';
import type { StudentReport } from '../../services/studentReportApi';

const texts: { text: any; x: number; y: number; opts?: any }[] = [];
const images: any[] = [];
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => {
    const doc: any = {};
    for (const m of ['setFont', 'setFontSize', 'setTextColor', 'setFillColor', 'setDrawColor', 'setLineWidth', 'rect', 'line', 'addPage']) doc[m] = jest.fn(() => doc);
    doc.text = jest.fn((text: any, x: number, y: number, opts?: any) => { texts.push({ text, x, y, opts }); return doc; });
    doc.addImage = jest.fn((...a: any[]) => { images.push(a); return doc; });
    doc.splitTextToSize = jest.fn((t: string) => [t]);
    return doc;
  }),
}));

const REPORT: StudentReport = {
  school: { name: 'Sunrise School', logoUrl: 'https://res.cloudinary.com/logo.png' },
  student: { id: 'k1', name: 'Asha Rao', grade: 'Grade 8', section: 'A', admissionNumber: 'A-1' },
  academicYear: '2026-27',
  generatedAt: '2026-11-14T05:04:00.000Z',
  canDownload: true, canShare: true, full: true,
  rows: [
    { sno: 1, subject: 'English', marks: 30, maxMarks: 100, result: 'Fail' },
    { sno: 2, subject: 'Maths', marks: 90.5, maxMarks: 100, result: 'Pass' },
  ],
  total: { obtained: 120.5, max: 200 },
  percentage: 60.3,
  rating: { label: 'Satisfactory', remark: 'Asha Rao meets the expected standard in most areas.' },
  pendingSubjects: ['Hindi'],
  passMark: 33,
  maxMarks: 100,
};

class FakeFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL() { this.result = 'data:image/png;base64,AAAA'; setTimeout(() => this.onloadend?.(), 0); }
}

beforeEach(() => {
  (global as any).FileReader = FakeFileReader;
  texts.length = 0;
  images.length = 0;
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, blob: async () => new Blob(['png'], { type: 'image/png' }) })) as any;
});
const find = (t: string) => texts.find((x) => (Array.isArray(x.text) ? x.text.join(' ') : x.text) === t);

test('header: logo top left, school name top centre, generated date/time top right', async () => {
  await buildReportPdf(REPORT);
  expect(images).toHaveLength(1);
  expect(images[0][2]).toBe(16); // left margin
  const school = find('Sunrise School')!;
  expect(school.x).toBe(105);
  expect(school.opts).toEqual({ align: 'center' });
  const gen = find(formatGeneratedAt(REPORT.generatedAt))!;
  expect(gen.x).toBe(194);
  expect(gen.opts).toEqual({ align: 'right' });
  expect(gen.y).toBeLessThan(25);
});

test('table columns, one row per subject, Pass/Fail and the Total marks row', async () => {
  await buildReportPdf(REPORT);
  for (const h of ['S.No', 'Subject Name', 'Marks', 'Pass / Fail']) expect(find(h)).toBeTruthy();
  expect(find('Maths')).toBeTruthy();
  expect(find('90.5 / 100')).toBeTruthy();
  expect(find('Fail')).toBeTruthy();
  expect(find('Pass')).toBeTruthy();
  expect(find('Total marks')).toBeTruthy();
  expect(find('120.5 / 200')).toBeTruthy();
  expect(find('Total marks')!.y).toBeGreaterThan(find('Maths')!.y);
});

test('rating and remark come below the table', async () => {
  await buildReportPdf(REPORT);
  const rating = find('Overall Rating: Satisfactory')!;
  expect(rating.y).toBeGreaterThan(find('Total marks')!.y);
  expect(find(REPORT.rating!.remark)).toBeTruthy();
});

test('a missing logo is skipped, not an error', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('offline'))) as any;
  await buildReportPdf({ ...REPORT, school: { name: 'Sunrise School', logoUrl: null } });
  await buildReportPdf(REPORT);
  expect(images).toHaveLength(0);
  expect(find('Sunrise School')).toBeTruthy();
});

test('formatting helpers', () => {
  expect(reportFileName(REPORT)).toBe('Asha-Rao-Report-2026-27.pdf');
  expect(formatMarks(72)).toBe('72');
  expect(formatMarks(72.456)).toBe('72.46');
  expect(formatGeneratedAt('nope')).toBe('');
  expect(formatGeneratedAt('2026-11-14T05:04:00.000Z')).toMatch(/^14 Nov 2026, \d{1,2}:\d{2}\s?[AP]M$/);
});
