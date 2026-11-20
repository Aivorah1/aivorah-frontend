import { testLines, learningReportFileName, downloadLearningReport } from '../learningReport';

const mockReport = jest.fn();
jest.mock('../../../student/learning-paths/practice-followup/services/practiceFollowupApi', () => ({ followupApi: { learningReport: (...a: any[]) => mockReport(...a) } }));
const mockSave = jest.fn();
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    setFont: jest.fn(), setFontSize: jest.fn(), setTextColor: jest.fn(), setDrawColor: jest.fn(), line: jest.fn(), addPage: jest.fn(),
    splitTextToSize: (s: string) => [s], text: jest.fn(), save: mockSave,
  })),
}), { virtual: true });
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

const base = { attemptId: 'a1', subject: 'Mathematics', topic: 'Adding fractions', takenAt: '2026-11-18T10:00:00Z', score: 60, correct: 3, total: 5, skillsReviewed: [], explanationsShown: 0, recurringMistakes: [], memoryChecks: [], hasFollowUp: false,
  practice: { total: 0, independent: 0, assisted: 0, incorrect: 0, skipped: 0, awaiting_verification: 0, solution_shown: 0 } };

test('a test with no follow-up still shows its original result', () => {
  expect(testLines(base)).toEqual(['Test on 18 Nov 2026: 60% (3/5 correct)', 'No follow-up practice yet.']);
});

test('follow-up results: skills, explanations, independent vs assisted practice, recurring mistakes, memory checks', () => {
  const lines = testLines({ ...base, hasFollowUp: true, skillsReviewed: ['Finding the LCM'], explanationsShown: 2,
    practice: { total: 4, independent: 2, assisted: 1, incorrect: 1, skipped: 0, awaiting_verification: 0, solution_shown: 0 },
    recurringMistakes: [{ step: 'finding the LCM', questions: 2 }],
    memoryChecks: [{ at: '2026-11-27T10:00:00Z', level: 3, outcome: 'independent', helpUsed: 'none' }] });
  expect(lines).toEqual([
    'Test on 18 Nov 2026: 60% (3/5 correct)',
    'Skills reviewed: Finding the LCM',
    'Explanations reviewed: 2',
    'Practice: 4 fresh questions — 2 on their own, 1 with a hint, 1 not right yet',
    'Recurring mistake: finding the LCM (in 2 questions)',
    'Memory check 27 Nov 2026 (challenge question): remembered and answered on their own',
  ]);
});

test('download fetches the server report (access checked there) and saves a PDF', async () => {
  mockReport.mockResolvedValue({ student: { id: 's1', name: 'Riya Test', grade: 'Grade 6' }, generatedAt: '2026-11-20T10:00:00Z', tests: [base] });
  const name = await downloadLearningReport('s1');
  expect(mockReport).toHaveBeenCalledWith('s1');
  expect(name).toBe('Aivorah_Learning_Report_Riya_Test_2026-11-20.pdf');
  expect(mockSave).toHaveBeenCalledWith(name);
  expect(learningReportFileName({ student: { id: 'x' }, generatedAt: '2026-11-20T00:00:00Z', tests: [] })).toBe('Aivorah_Learning_Report_student_2026-11-20.pdf');
});

test('an unauthorised account gets the server refusal, not a report', async () => {
  mockReport.mockRejectedValue(new Error('Not authorised.'));
  await expect(downloadLearningReport('s1')).rejects.toThrow('Not authorised.');
});
