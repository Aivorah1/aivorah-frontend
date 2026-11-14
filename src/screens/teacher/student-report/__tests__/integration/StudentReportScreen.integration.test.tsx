// Student Report page against a mocked /reports API (the T1/T2/T3 example):
// homeroom teacher sees Upload Marks (own subject), View Report, Download and Share;
// a subject teacher sees Upload Marks and View Report only.
import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import StudentReportScreen from '../../StudentReportScreen';
import { downloadReport, shareReport } from '../../utils/reportActions';

jest.mock('../../../../../config/firebase', () => ({
  auth: { authStateReady: jest.fn().mockResolvedValue(undefined), currentUser: { getIdToken: jest.fn().mockResolvedValue('tok') } },
}));
jest.mock('../../../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { accentGreen: '#9a9', accentYellow: '#c90', accentRed: '#e33', textDim: '#999', textMain: '#111', textMuted: '#666', textHeading: '#000', borderColor: '#ddd', cardDark: '#fff', bgDark: '#fafafa' } }),
}));
jest.mock('../../../../../components/common/Header', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ title, subtitle }: any) => <Text>{title} | {subtitle}</Text> };
});
jest.mock('../../../../../components/common/ScreenLayout', () => ({ __esModule: true, default: ({ children }: any) => children }));
jest.mock('../../../../../components/common/Toast', () => {
  const { Text } = require('react-native');
  const R = require('react');
  return {
    useToast: () => {
      const [t, setT] = R.useState(null);
      return { showToast: setT, ToastComponent: t ? <Text testID="toast">{t.title}{t.subtitle ? ` · ${t.subtitle}` : ''}</Text> : null };
    },
  };
});
jest.mock('../../utils/reportActions', () => ({
  downloadReport: jest.fn(async () => 'Asha-Report-2026-27.pdf'),
  shareReport: jest.fn(async () => ({ ok: true, sentTo: [{ email: 'k1@s.org', name: 'Asha', role: 'student' }, { email: 'mum@x.org', name: 'Mum', role: 'parent' }] })),
}));

type Handler = (url: string, init?: any) => { ok?: boolean; status?: number; body: any };
function mockApi(handler: Handler) {
  global.fetch = jest.fn((url: string, init?: any) => {
    const r = handler(String(url), init);
    return Promise.resolve({ ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.body });
  }) as any;
}
const calls = () => (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));

const STUDENTS = [{ id: 'k1', name: 'Asha', admissionNumber: 'A-1' }, { id: 'k2', name: 'Ravi', admissionNumber: null }];
const HOME_8A = { grade: 'Grade 8', section: 'A', academicYear: '2026-27', isHomeClass: true, mySubjects: ['Maths'], canDownload: true, canShare: true, students: STUDENTS };
const SUBJECT = (grade: string, section: string, subject: string) => ({
  grade, section, academicYear: '2026-27', isHomeClass: false, mySubjects: [subject], canDownload: false, canShare: false,
  students: [{ id: `${grade}-${section}-s`, name: `Student ${section}`, admissionNumber: null }],
});
const REPORT = {
  school: { name: 'Sunrise School', logoUrl: null },
  student: { id: 'k1', name: 'Asha', grade: 'Grade 8', section: 'A', admissionNumber: 'A-1' },
  academicYear: '2026-27', generatedAt: '2026-11-14T05:04:00.000Z', canDownload: true, canShare: true, full: true,
  rows: [{ sno: 1, subject: 'Maths', marks: 90, maxMarks: 100, result: 'Pass' }, { sno: 2, subject: 'Science', marks: 20, maxMarks: 100, result: 'Fail' }],
  total: { obtained: 110, max: 200 }, percentage: 55, rating: { label: 'Satisfactory', remark: 'Asha meets the expected standard.' },
  pendingSubjects: ['Hindi'], passMark: 33, maxMarks: 100,
};

beforeEach(() => jest.clearAllMocks());

describe('homeroom teacher (T1)', () => {
  beforeEach(() => mockApi((url, init) => {
    if (url.includes('/reports/classes')) return { body: { academicYear: '2026-27', homeClasses: [{ grade: 'Grade 8', section: 'A', label: 'Grade 8 A' }], grades: [] } };
    if (url.includes('/reports/class?')) return { body: HOME_8A };
    if (url.includes('/reports/marks') && init?.method === 'PUT') return { body: { ok: true, saved: 1, subject: 'Maths' } };
    if (url.includes('/reports/marks')) return { body: { subject: 'Maths', marks: { k1: 72 }, maxMarks: 100 } };
    if (url.includes('/reports/students/')) return { body: REPORT };
    return { ok: false, status: 404, body: {} };
  }));

  test('Home Class opens first with every student and all four actions', async () => {
    await render(<StudentReportScreen navigation={{}} />);
    expect(await screen.findByTestId('report-student-k1')).toBeTruthy();
    expect(screen.getByTestId('report-home-Grade 8-A').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByText('Home Class')).toBeTruthy();
    for (const id of ['upload-k1', 'view-k1', 'download-k1', 'share-k1', 'share-k2']) expect(screen.getByTestId(id)).toBeTruthy();
    expect(screen.getByText(/2026-27/)).toBeTruthy();
  });

  test('Upload Marks shows only their subject, pre-filled, and saves it', async () => {
    const user = userEvent.setup();
    await render(<StudentReportScreen navigation={{}} />);
    await user.press(await screen.findByTestId('upload-k1'));
    const input = await screen.findByTestId('marks-input-Maths');
    await waitFor(() => expect(input.props.value).toBe('72'));
    expect(screen.queryByTestId('marks-input-Science')).toBeNull();
    await user.clear(input);
    await user.type(input, '88');
    await user.press(screen.getByTestId('marks-save'));
    expect(await screen.findByTestId('toast')).toHaveTextContent(/Marks saved for Asha/);
    const put = (global.fetch as jest.Mock).mock.calls.find((c) => c[1]?.method === 'PUT');
    expect(JSON.parse(put[1].body)).toEqual({ grade: 'Grade 8', section: 'A', subject: 'Maths', marks: { k1: 88 } });
  });

  test('Upload Marks rejects marks over 100 without calling the API', async () => {
    const user = userEvent.setup();
    await render(<StudentReportScreen navigation={{}} />);
    await user.press(await screen.findByTestId('upload-k1'));
    const input = await screen.findByTestId('marks-input-Maths');
    await waitFor(() => expect(input.props.value).toBe('72'));
    await user.clear(input);
    await user.type(input, '120');
    await user.press(screen.getByTestId('marks-save'));
    expect(await screen.findByText('Marks must be a number from 0 to 100')).toBeTruthy();
    expect((global.fetch as jest.Mock).mock.calls.some((c) => c[1]?.method === 'PUT')).toBe(false);
  });

  test('View Report shows the full template: school, all subjects, total and rating', async () => {
    const user = userEvent.setup();
    await render(<StudentReportScreen navigation={{}} />);
    await user.press(await screen.findByTestId('view-k1'));
    expect(await screen.findByTestId('report-card')).toBeTruthy();
    expect(screen.getByTestId('report-school-name')).toHaveTextContent('Sunrise School');
    expect(screen.getByTestId('report-row-Maths')).toBeTruthy();
    expect(screen.getByTestId('report-row-Science')).toHaveTextContent(/Fail/);
    expect(screen.getByTestId('report-total')).toHaveTextContent('110 / 200');
    expect(screen.getByTestId('report-rating')).toHaveTextContent(/Overall Rating: Satisfactory/);
    expect(screen.getByTestId('report-pending')).toHaveTextContent(/Hindi/);
    expect(screen.getByTestId('report-modal-download')).toBeTruthy();
  });

  test('Download asks for that student’s PDF', async () => {
    const user = userEvent.setup();
    await render(<StudentReportScreen navigation={{}} />);
    await user.press(await screen.findByTestId('download-k1'));
    expect(downloadReport).toHaveBeenCalledWith('k1');
    expect(await screen.findByTestId('toast')).toHaveTextContent(/Report downloaded/);
  });

  test('Share asks first, then sends to the student and linked parents', async () => {
    const user = userEvent.setup();
    await render(<StudentReportScreen navigation={{}} />);
    await user.press(await screen.findByTestId('share-k1'));
    expect(await screen.findByTestId('share-confirm')).toBeTruthy();
    expect(shareReport).not.toHaveBeenCalled();
    await user.press(screen.getByTestId('share-send'));
    expect(shareReport).toHaveBeenCalledWith('k1');
    expect(await screen.findByTestId('toast')).toHaveTextContent(/Sent to Asha and 1 linked parent in Messages/);
  });
});

describe('subject teacher (T3: home class 7 B, teaches English in 8 A and 8 B)', () => {
  beforeEach(() => mockApi((url) => {
    if (url.includes('/reports/classes')) {
      return { body: { academicYear: '2026-27', homeClasses: [{ grade: 'Grade 7', section: 'B', label: 'Grade 7 B' }], grades: [
        { grade: 'Grade 8', sections: [{ section: 'A', subjects: ['English'] }, { section: 'B', subjects: ['English'] }] },
      ] } };
    }
    if (url.includes('/reports/class?grade=Grade+7&section=B')) return { body: { ...HOME_8A, grade: 'Grade 7', section: 'B', mySubjects: [] } };
    if (url.includes('/reports/class?grade=Grade+8&section=A')) return { body: SUBJECT('Grade 8', 'A', 'English') };
    if (url.includes('/reports/class?grade=Grade+8&section=B')) return { body: SUBJECT('Grade 8', 'B', 'English') };
    return { ok: false, status: 404, body: {} };
  }));

  test('picking a grade shows only the sections taught; a section lists its students with Upload and View only', async () => {
    const user = userEvent.setup();
    await render(<StudentReportScreen navigation={{}} />);
    // Home class first: full rights, but no Upload Marks (they teach no subject there).
    expect(await screen.findByTestId('share-k1')).toBeTruthy();
    expect(screen.queryByTestId('upload-k1')).toBeNull();

    await user.press(screen.getByTestId('report-grade-Grade 8'));
    expect(screen.getByTestId('report-section-Grade 8-A')).toBeTruthy();
    expect(screen.getByTestId('report-section-Grade 8-B')).toBeTruthy();
    expect(screen.queryByTestId('report-section-Grade 8-C')).toBeNull();

    await user.press(screen.getByTestId('report-section-Grade 8-A'));
    const id = 'Grade 8-A-s';
    expect(await screen.findByTestId(`report-student-${id}`)).toBeTruthy();
    expect(screen.queryByTestId('report-student-k1')).toBeNull();
    expect(screen.getByTestId(`upload-${id}`)).toBeTruthy();
    expect(screen.getByTestId(`view-${id}`)).toBeTruthy();
    expect(screen.queryByTestId(`download-${id}`)).toBeNull();
    expect(screen.queryByTestId(`share-${id}`)).toBeNull();
    expect(screen.getByTestId('report-role-note')).toHaveTextContent(/You teach English here/);
    expect(calls().some((u) => u.includes('/reports/class?grade=Grade+8&section=A'))).toBe(true);
  });
});

test('a teacher with no classes sees an empty state', async () => {
  mockApi(() => ({ body: { academicYear: '2026-27', homeClasses: [], grades: [] } }));
  await render(<StudentReportScreen navigation={{}} />);
  expect(await screen.findByTestId('report-empty')).toBeTruthy();
});

test('an API error is shown', async () => {
  mockApi(() => ({ ok: false, status: 403, body: { error: 'Only teachers can use Student Report' } }));
  await render(<StudentReportScreen navigation={{}} />);
  expect(await screen.findByTestId('report-error')).toHaveTextContent(/Only teachers can use Student Report/);
});
