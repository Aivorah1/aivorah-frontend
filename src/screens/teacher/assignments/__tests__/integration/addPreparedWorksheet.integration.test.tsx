// Prepare Worksheet > Assign: the prepared .docx goes through the SAME
// Upload Worksheet pipeline as a picked file (docx -> PDF -> page images ->
// upload -> AI auto-fill), only without the file picker.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { useUploadWorksheet } from '../../hooks/useUploadWorksheet';

jest.mock('../../../../../config/assignmentsServerUrl', () => 'https://assign.test');
jest.mock('../../utils/pdfHelpers', () => ({
  pdfToImages: jest.fn(async () => [{ name: 'page-1.png', base64: 'PAGE1', mime: 'image/png' }]),
  imagesToPdfBase64: jest.fn(),
}));
jest.mock('../../services/jobsService', () => ({
  detectWorksheetMeta: jest.fn(async () => null),
  pollJob: jest.fn(async () => ({ title: 'Fractions practice', subject: 'Mathematics', questions: ['What is 1/2 + 1/4?'] })),
}));

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });

function Harness({ load, onError, onTitle }: { load: () => Promise<any>; onError: (m: string) => void; onTitle: (t: string) => void }) {
  const h = useUploadWorksheet({
    user: {}, title: '', setTitle: onTitle, chapter: '', setChapter: () => {},
    subject: 'Mathematics', setSubject: () => {}, grade: 'Grade 4', setGrade: () => {}, curriculum: 'CBSE', setCurriculum: () => {},
    gradeOptions: ['Grade 4'], effectiveGrade: 'Grade 4', effectiveCurriculum: 'CBSE',
    selectedLanguage: '', setSelectedLanguage: () => {}, setSuccessCriteria: () => {}, setTeacherNotes: () => {},
    setIbWordBank: () => {}, setIbStamps: () => {}, setFormError: onError,
    quizDifficulty: 'medium', setQuizQuestions: () => {}, setType: () => {},
  });
  return (
    <View>
      <Text testID="docCount">{String(h.docFiles.length)}</Text>
      <Text testID="docUrl">{h.docFiles[0]?.url ?? ''}</Text>
      <Text testID="busy">{String(h.uploadingDoc || h.extractingQuestions)}</Text>
      <TouchableOpacity testID="assign" onPress={() => h.addPreparedWorksheet(load)} />
    </View>
  );
}

test('the prepared .docx is converted, uploaded and auto-filled like an uploaded worksheet', async () => {
  const fetchMock = jest.fn(async (url: string) => {
    if (url.endsWith('/assignments/docx-to-pdf')) return { ok: true, json: async () => ({ pdfBase64: 'PDF64', structuredText: 'Q1' }) };
    if (url.endsWith('/assignments/upload-doc')) return { ok: true, json: async () => ({ url: 'https://res.cloudinary.com/x/page-1.png' }) };
    if (url.endsWith('/assignments/extract-questions-async')) return { ok: true, json: async () => ({ jobId: 'j1' }) };
    throw new Error(`unexpected ${url}`);
  });
  global.fetch = fetchMock as any;
  const onTitle = jest.fn();
  const user = userEvent.setup();
  await render(<Harness load={async () => ({ name: 'Fractions practice.docx', base64: 'DOCX64', mime: DOCX })} onError={jest.fn()} onTitle={onTitle} />);

  await user.press(screen.getByTestId('assign'));
  await waitFor(() => expect(screen.getByTestId('busy').props.children).toBe('false'), { timeout: 10000 });

  const [docxCall] = fetchMock.mock.calls.filter(([u]) => u.endsWith('/docx-to-pdf'));
  expect(JSON.parse((docxCall as any)[1].body)).toEqual({ fileBase64: 'DOCX64' });
  const [extractCall] = fetchMock.mock.calls.filter(([u]) => u.endsWith('/extract-questions-async'));
  expect(JSON.parse((extractCall as any)[1].body)).toMatchObject({ fileBase64: 'PAGE1', mimeType: 'image/png', fileName: 'Fractions practice.docx' });
  expect(screen.getByTestId('docCount').props.children).toBe('1');
  expect(screen.getByTestId('docUrl').props.children).toBe('https://res.cloudinary.com/x/page-1.png');
  expect(onTitle).toHaveBeenCalledWith('Fractions practice');
});

test('if the document cannot be fetched, the teacher sees why and nothing is uploaded', async () => {
  global.fetch = jest.fn() as any;
  const onError = jest.fn();
  const user = userEvent.setup();
  await render(<Harness load={async () => { throw new Error('Document not found'); }} onError={onError} onTitle={jest.fn()} />);
  await user.press(screen.getByTestId('assign'));
  await waitFor(() => expect(onError).toHaveBeenCalledWith('Document not found'));
  expect(screen.getByTestId('busy').props.children).toBe('false');
  expect(global.fetch).not.toHaveBeenCalled();
});
