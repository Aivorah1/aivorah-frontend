// Create Assignment popup: the 4th option, Prepare Worksheet, below Bulk Upload.
import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { CreationModeSelector } from '../../components/CreationModeSelector';

const colors: any = { textDim: '#999', textMain: '#111' };

test('Prepare Worksheet is the 4th option and opens its page', async () => {
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
  expect(titles).toEqual(['Generate AI Assignment', 'Upload Worksheet (PDF / Image)', 'Bulk Upload (Multiple Worksheets)', 'Prepare Worksheet']);
  expect(screen.getByText('Create and edit a worksheet in a Word-style editor, then assign it to students.')).toBeTruthy();

  await user.press(screen.getByTestId('create-mode-prepare-worksheet'));
  expect(onPrepareWorksheet).toHaveBeenCalledTimes(1);
  expect(setCreateMode).not.toHaveBeenCalled();
});
