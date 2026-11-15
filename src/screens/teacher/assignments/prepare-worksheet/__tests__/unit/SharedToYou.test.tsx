// Library > Shared to you: file name, who shared it, date shared; Open, Download, Assign.
import React from 'react';
import { render, screen, userEvent, waitFor, within } from '@testing-library/react-native';
import { SharedToYou } from '../../components/SharedToYou';
import { listSharedWorksheets } from '../../services/worksheetsApi';
import { downloadWorksheetDocx } from '../../utils/worksheetFiles';

jest.mock('../../services/worksheetsApi', () => ({ listSharedWorksheets: jest.fn() }));
jest.mock('../../utils/worksheetFiles', () => ({
  ...jest.requireActual('../../utils/worksheetFiles'),
  downloadWorksheetDocx: jest.fn(async () => 'Poems.docx'),
}));

const colors: any = { accentYellow: '#c90', accentRed: '#e33', textDim: '#999', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff', bgDark: '#fafafa' };
const SHARED = [{ id: 'w9', title: 'Poems', updated_at: '', shared_at: '2026-11-14T06:30:00.000Z', shared_by_name: 'Asha Rao', shared_by_email: 'a@s.test' }];

beforeEach(() => jest.clearAllMocks());

test('lists shared documents with the sharer and date, and their actions', async () => {
  (listSharedWorksheets as jest.Mock).mockResolvedValue(SHARED);
  const onOpen = jest.fn(); const onAssign = jest.fn(); const onNotify = jest.fn();
  const user = userEvent.setup();
  await render(<SharedToYou active colors={colors} onOpen={onOpen} onAssign={onAssign} onNotify={onNotify} />);

  const row = await screen.findByTestId('worksheet-row-w9');
  expect(within(row).getByText('Poems')).toBeTruthy();
  expect(within(row).getByText('Asha Rao')).toBeTruthy();
  expect(within(row).getByText(/14 Nov 2026/)).toBeTruthy();
  expect(within(row).queryByText('Share')).toBeNull(); // only the owner shares

  await user.press(screen.getByTestId('worksheet-open-w9'));
  expect(onOpen).toHaveBeenCalledWith(SHARED[0]);
  await user.press(screen.getByTestId('worksheet-assign-w9'));
  expect(onAssign).toHaveBeenCalledWith(SHARED[0]);
  await user.press(screen.getByTestId('worksheet-download-w9'));
  await waitFor(() => expect(onNotify).toHaveBeenCalledWith('Downloaded', 'Poems.docx', 'success'));
  expect(downloadWorksheetDocx).toHaveBeenCalledWith('w9');
});

test('empty state', async () => {
  (listSharedWorksheets as jest.Mock).mockResolvedValue([]);
  await render(<SharedToYou active colors={colors} onOpen={jest.fn()} onAssign={jest.fn()} onNotify={jest.fn()} />);
  expect(await screen.findByTestId('shared-to-you-empty')).toBeTruthy();
});
