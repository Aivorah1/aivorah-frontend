// Create Assignment popup: the options in the client's priority order, Prepare Worksheet first.
import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { CreationModeSelector } from '../../components/CreationModeSelector';

const colors: any = { textDim: '#999', textMain: '#111' };

test('options are Prepare Worksheet, Upload Worksheet, Generate AI Assignment, Bulk Upload; Prepare Worksheet opens its page', async () => {
  const onPrepareWorksheet = jest.fn();
  const setCreateMode = jest.fn();
  const user = userEvent.setup();
  await render(
    <CreationModeSelector
      isIBPYP={false} gold="#c90" colors={colors}
      setCreateMode={setCreateMode} setType={jest.fn()} setUploadStep={jest.fn()}
      uploadScrollRef={{ current: null }} setBulkPhase={jest.fn()} setBulkItems={jest.fn()}
      onPrepareWorksheet={onPrepareWorksheet}
    />,
  );
  const titles = screen.getAllByText(/^(Generate AI Assignment|Upload Worksheet \(PDF \/ Image\)|Bulk Upload \(Multiple Worksheets\)|Prepare Worksheet)$/)
    .map((t) => t.props.children);
  expect(titles).toEqual(['Prepare Worksheet', 'Upload Worksheet (PDF / Image)', 'Generate AI Assignment', 'Bulk Upload (Multiple Worksheets)']);
  expect(screen.getByText('Create and edit a worksheet in a Word-style editor, then assign it to students.')).toBeTruthy();

  await user.press(screen.getByTestId('create-mode-prepare-worksheet'));
  expect(onPrepareWorksheet).toHaveBeenCalledTimes(1);
  expect(setCreateMode).not.toHaveBeenCalled();
});
