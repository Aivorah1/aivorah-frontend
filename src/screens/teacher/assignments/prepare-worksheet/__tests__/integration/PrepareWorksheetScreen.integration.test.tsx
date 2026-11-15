// Prepare Worksheet page: History (New Document, Download, Share, Assign),
// the editor (Save asks for a file name, Back returns to History) and opening
// a document shared by another teacher.
import React from 'react';
import { render, screen, userEvent, waitFor, within } from '@testing-library/react-native';
import PrepareWorksheetScreen from '../../PrepareWorksheetScreen';
import * as api from '../../services/worksheetsApi';
import { downloadWorksheetDocx } from '../../utils/worksheetFiles';

jest.mock('../../../../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { accentGreen: '#9a9', accentYellow: '#c90', accentRed: '#e33', textDim: '#999', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff', bgDark: '#fafafa' } }),
}));
jest.mock('../../../../../../components/common/Header', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ title }: any) => <Text>{title}</Text> };
});
jest.mock('../../../../../../components/common/ScreenLayout', () => ({ __esModule: true, default: ({ children }: any) => children }));
jest.mock('../../../../../../components/common/Toast', () => {
  const { Text } = require('react-native');
  const R = require('react');
  return {
    useToast: () => {
      const [t, setT] = R.useState(null);
      return { showToast: setT, ToastComponent: t ? <Text testID="toast">{t.title}{t.subtitle ? ` · ${t.subtitle}` : ''}</Text> : null };
    },
  };
});
jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return { useFocusEffect: (cb: () => void) => R.useEffect(cb, [cb]) };
});
// A plain text box stands in for the Word-style editor (Jodit runs only in a browser).
jest.mock('../../editor/WorksheetEditor', () => {
  const R = require('react');
  const { TextInput } = require('react-native');
  return {
    __esModule: true,
    default: R.forwardRef(({ initialHtml, onChange }: any, ref: any) => {
      const [v, setV] = R.useState(initialHtml);
      R.useImperativeHandle(ref, () => ({ getHtml: () => v }), [v]);
      return <TextInput testID="mock-editor" value={v} onChangeText={(t: string) => { setV(t); onChange(); }} />;
    }),
  };
});
jest.mock('../../services/worksheetsApi', () => ({
  listWorksheets: jest.fn(),
  openWorksheet: jest.fn(),
  createWorksheet: jest.fn(),
  updateWorksheet: jest.fn(),
  listSchoolTeachers: jest.fn(),
  shareWorksheet: jest.fn(),
}));
jest.mock('../../utils/worksheetFiles', () => ({
  ...jest.requireActual('../../utils/worksheetFiles'),
  downloadWorksheetDocx: jest.fn(async () => 'Fractions practice.docx'),
}));

const m = api as jest.Mocked<typeof api>;
const DOCS = [
  { id: 'w1', title: 'Fractions practice', updated_at: '2026-11-12T09:35:00.000Z' },
  { id: 'w2', title: 'Shapes quiz', updated_at: '2026-11-10T04:00:00.000Z' },
];
const nav = () => ({ navigate: jest.fn(), setParams: jest.fn(), openDrawer: jest.fn() });

beforeEach(() => {
  jest.clearAllMocks();
  m.listWorksheets.mockResolvedValue(DOCS);
});

test('History lists each document with its last modified date and Download, Share, Assign', async () => {
  await render(<PrepareWorksheetScreen navigation={nav()} route={{ params: {} }} />);
  const row = await screen.findByTestId('worksheet-row-w1');
  expect(within(row).getByText('Fractions practice')).toBeTruthy();
  expect(within(row).getByText(/12 Nov 2026/)).toBeTruthy();
  for (const label of ['Download', 'Share', 'Assign']) expect(within(row).getByText(label)).toBeTruthy();
  expect(screen.getByText('New Document')).toBeTruthy();
});

test('empty History says how to start', async () => {
  m.listWorksheets.mockResolvedValue([]);
  await render(<PrepareWorksheetScreen navigation={nav()} route={{ params: {} }} />);
  expect(await screen.findByTestId('worksheet-history-empty')).toBeTruthy();
});

test('New Document > type > Save asks for a file name and saves it; Back returns to History', async () => {
  m.createWorksheet.mockResolvedValue({ id: 'w3', title: 'Area worksheet', updated_at: '2026-11-15T00:00:00.000Z' });
  const user = userEvent.setup();
  await render(<PrepareWorksheetScreen navigation={nav()} route={{ params: {} }} />);
  await user.press(await screen.findByTestId('worksheet-new'));
  await user.type(screen.getByTestId('mock-editor'), '<p>Q1</p>');
  await user.press(screen.getByTestId('editor-save'));
  await user.type(await screen.findByTestId('save-name-input'), 'Area worksheet');
  await user.press(screen.getByTestId('save-name-confirm'));

  await waitFor(() => expect(m.createWorksheet).toHaveBeenCalledWith('Area worksheet', '<p>Q1</p>'));
  expect(await screen.findByTestId('toast')).toHaveTextContent('Document saved · Area worksheet');
  expect(screen.getByTestId('editor-title')).toHaveTextContent('Area worksheet');

  // saving again updates the same document
  m.updateWorksheet.mockResolvedValue({ id: 'w3', title: 'Area worksheet', updated_at: '2026-11-15T00:01:00.000Z' });
  await user.press(screen.getByTestId('editor-save'));
  await user.press(await screen.findByTestId('save-name-confirm'));
  await waitFor(() => expect(m.updateWorksheet).toHaveBeenCalledWith('w3', 'Area worksheet', '<p>Q1</p>'));

  await user.press(screen.getByTestId('editor-back'));
  expect(await screen.findByTestId('worksheet-new')).toBeTruthy();
});

test('a saved document opens from History in the same editor', async () => {
  m.openWorksheet.mockResolvedValue({ id: 'w1', title: 'Fractions practice', html: '<p>1/2</p>', updated_at: '', isOwner: true, sharedBy: null, sharedAt: null });
  const user = userEvent.setup();
  await render(<PrepareWorksheetScreen navigation={nav()} route={{ params: {} }} />);
  await user.press(await screen.findByTestId('worksheet-open-w1'));
  expect(await screen.findByTestId('mock-editor')).toHaveProp('value', '<p>1/2</p>');
  expect(screen.getByTestId('editor-title')).toHaveTextContent('Fractions practice');
});

test('a document shared by another teacher opens from Library; Save keeps a copy of your own', async () => {
  m.openWorksheet.mockResolvedValue({ id: 'w9', title: 'Poems', html: '<p>Rain</p>', updated_at: '', isOwner: false, sharedBy: { name: 'Asha Rao', email: 'a@s.test' }, sharedAt: '' });
  m.createWorksheet.mockResolvedValue({ id: 'w10', title: 'Copy of Poems', updated_at: '' });
  const navigation = nav();
  const user = userEvent.setup();
  await render(<PrepareWorksheetScreen navigation={navigation} route={{ params: { openId: 'w9', nonce: 1 } }} />);
  expect(await screen.findByText(/Shared by Asha Rao/)).toBeTruthy();
  expect(navigation.setParams).toHaveBeenCalledWith({ openId: undefined, nonce: undefined });
  await user.press(screen.getByTestId('editor-save'));
  await user.press(await screen.findByTestId('save-name-confirm'));
  await waitFor(() => expect(m.createWorksheet).toHaveBeenCalledWith('Copy of Poems', '<p>Rain</p>'));
  expect(m.updateWorksheet).not.toHaveBeenCalled();
});

test('Assign opens the Upload Worksheet flow on Assignments with this document', async () => {
  const navigation = nav();
  const user = userEvent.setup();
  await render(<PrepareWorksheetScreen navigation={navigation} route={{ params: {} }} />);
  await user.press(await screen.findByTestId('worksheet-assign-w1'));
  expect(navigation.navigate).toHaveBeenCalledWith('TeacherAssignments', { assignWorksheet: { id: 'w1', title: 'Fractions practice', nonce: expect.any(Number) } });
});

test('Download saves the Word file', async () => {
  const user = userEvent.setup();
  await render(<PrepareWorksheetScreen navigation={nav()} route={{ params: {} }} />);
  await user.press(await screen.findByTestId('worksheet-download-w1'));
  expect(downloadWorksheetDocx).toHaveBeenCalledWith('w1');
  expect(await screen.findByTestId('toast')).toHaveTextContent('Downloaded · Fractions practice.docx');
});

test('Share: search the school\'s teachers, pick one, then Share', async () => {
  m.listSchoolTeachers.mockResolvedValue([
    { id: 't2', name: 'Bala K', email: 'bala@s.test' },
    { id: 't3', name: 'Chitra M', email: 'chitra@s.test' },
  ]);
  m.shareWorksheet.mockResolvedValue({ id: 't3', name: 'Chitra M', email: 'chitra@s.test' });
  const user = userEvent.setup();
  await render(<PrepareWorksheetScreen navigation={nav()} route={{ params: {} }} />);
  await user.press(await screen.findByTestId('worksheet-share-w1'));

  expect(await screen.findByText('bala@s.test')).toBeTruthy();
  expect(screen.getByText('chitra@s.test')).toBeTruthy();
  expect(screen.queryByTestId('share-confirm')).toBeNull(); // no Share button until a teacher is picked

  await user.type(screen.getByTestId('share-search'), 'chit');
  expect(screen.queryByText('Bala K')).toBeNull();
  await user.press(screen.getByTestId('share-teacher-t3'));
  await user.press(screen.getByTestId('share-confirm'));

  await waitFor(() => expect(m.shareWorksheet).toHaveBeenCalledWith('w1', 't3'));
  expect(await screen.findByTestId('toast')).toHaveTextContent('Document shared · Sent to Chitra M');
  expect(screen.queryByTestId('share-worksheet-modal')).toBeNull();
});

test('Back on History returns to Assignments', async () => {
  const navigation = nav();
  const user = userEvent.setup();
  await render(<PrepareWorksheetScreen navigation={navigation} route={{ params: {} }} />);
  await user.press(await screen.findByTestId('worksheet-back'));
  expect(navigation.navigate).toHaveBeenCalledWith('TeacherAssignments');
});
