// Download/Share always re-check with the API that this teacher may download (class teacher only).
import { Platform } from 'react-native';
import { downloadReport, shareReport } from '../../utils/reportActions';
import { fetchStudentReport, shareStudentReport } from '../../services/studentReportApi';
import { buildReportPdf } from '../../utils/reportPdf';

jest.mock('../../services/studentReportApi', () => ({ fetchStudentReport: jest.fn(), shareStudentReport: jest.fn(async () => ({ ok: true, sentTo: [] })) }));
jest.mock('../../utils/reportPdf', () => ({ buildReportPdf: jest.fn() }));

const doc = { save: jest.fn(), output: jest.fn(() => new Blob(['%PDF'])) };
const report = (canDownload: boolean) => ({ canDownload, student: { name: 'Asha Rao' }, academicYear: '2026-27' });
const setOS = (os: string) => Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });

beforeEach(() => {
  jest.clearAllMocks();
  setOS('web');
  (buildReportPdf as jest.Mock).mockResolvedValue(doc);
});

test('download saves the PDF under the student’s name', async () => {
  (fetchStudentReport as jest.Mock).mockResolvedValue(report(true));
  await expect(downloadReport('k1')).resolves.toBe('Asha-Rao-Report-2026-27.pdf');
  expect(doc.save).toHaveBeenCalledWith('Asha-Rao-Report-2026-27.pdf');
});

test('share builds the PDF and hands it to the share API', async () => {
  (fetchStudentReport as jest.Mock).mockResolvedValue(report(true));
  await shareReport('k1');
  expect(shareStudentReport).toHaveBeenCalledWith('k1', expect.any(Blob), 'Asha-Rao-Report-2026-27.pdf');
});

test('a teacher who is not the class teacher cannot download or share', async () => {
  (fetchStudentReport as jest.Mock).mockResolvedValue(report(false));
  await expect(downloadReport('k1')).rejects.toThrow(/Only the class teacher/);
  await expect(shareReport('k1')).rejects.toThrow(/Only the class teacher/);
  expect(doc.save).not.toHaveBeenCalled();
  expect(shareStudentReport).not.toHaveBeenCalled();
});

test('on the phone app it says to use the web app', async () => {
  setOS('ios');
  await expect(downloadReport('k1')).rejects.toThrow(/web app/);
  expect(fetchStudentReport).not.toHaveBeenCalled();
});
