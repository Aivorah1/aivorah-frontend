import {
  fetchReportClasses, fetchClassReportInfo, fetchSubjectMarks, saveSubjectMarks, fetchStudentReport, shareStudentReport,
} from '../../services/studentReportApi';

jest.mock('../../../../../config/firebase', () => ({
  auth: { authStateReady: jest.fn().mockResolvedValue(undefined), currentUser: { getIdToken: jest.fn().mockResolvedValue('tok') } },
}));
jest.mock('../../../../../config/attendanceServerUrl', () => ({ __esModule: true, default: 'https://att.test' }));
jest.mock('../../../../../config/messagesServerUrl', () => ({ __esModule: true, default: 'https://msg.test' }));

const reply = (body: any, ok = true, status = 200) => Promise.resolve({ ok, status, json: async () => body });

beforeEach(() => { global.fetch = jest.fn(() => reply({})) as any; });
const call = (i = 0) => (global.fetch as jest.Mock).mock.calls[i];

test('every report call sends the Firebase token to the attendance service', async () => {
  await fetchReportClasses();
  expect(call()[0]).toBe('https://att.test/reports/classes');
  expect(call()[1].headers).toEqual({ Authorization: 'Bearer tok' });
});

test('class and marks queries are URL-encoded', async () => {
  await fetchClassReportInfo({ grade: 'Grade 8', section: 'A' });
  expect(call(0)[0]).toBe('https://att.test/reports/class?grade=Grade+8&section=A');
  await fetchSubjectMarks({ grade: 'Grade 8', section: '' }, 'Social Science');
  expect(call(1)[0]).toBe('https://att.test/reports/marks?grade=Grade+8&section=&subject=Social+Science');
});

test('saving marks PUTs JSON', async () => {
  await saveSubjectMarks({ grade: 'Grade 8', section: 'A' }, 'Maths', { k1: 72 });
  const [url, init] = call();
  expect(url).toBe('https://att.test/reports/marks');
  expect(init.method).toBe('PUT');
  expect(init.headers['Content-Type']).toBe('application/json');
  expect(JSON.parse(init.body)).toEqual({ grade: 'Grade 8', section: 'A', subject: 'Maths', marks: { k1: 72 } });
});

test("the API's error message is shown to the teacher", async () => {
  global.fetch = jest.fn(() => reply({ error: 'You do not teach this student' }, false, 403)) as any;
  await expect(fetchStudentReport('k1')).rejects.toThrow('You do not teach this student');
});

test('share uploads the PDF through Messages, then asks the report API to send it', async () => {
  global.fetch = jest.fn((url: string) => (url.includes('/messages/upload')
    ? reply({ url: 'https://res.cloudinary.com/x/r.pdf', size: 1234 })
    : reply({ ok: true, sentTo: [{ email: 'k1@s.org', name: 'Asha', role: 'student' }] }))) as any;
  const res = await shareStudentReport('k1', new Blob(['%PDF']), 'Asha-Report-2026-27.pdf');
  expect(call(0)[0]).toBe('https://msg.test/messages/upload');
  expect(call(0)[1].body).toBeInstanceOf(FormData);
  expect(call(1)[0]).toBe('https://att.test/reports/students/k1/share');
  expect(JSON.parse(call(1)[1].body)).toEqual({ attachmentUrl: 'https://res.cloudinary.com/x/r.pdf', attachmentName: 'Asha-Report-2026-27.pdf', attachmentSize: 1234 });
  expect(res.sentTo).toHaveLength(1);
});

test('share stops if the upload fails', async () => {
  global.fetch = jest.fn(() => reply({ error: 'Only images and PDFs are allowed' }, false, 400)) as any;
  await expect(shareStudentReport('k1', new Blob(['x']), 'r.pdf')).rejects.toThrow('Only images and PDFs are allowed');
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
