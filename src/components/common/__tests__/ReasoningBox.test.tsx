import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ReasoningBox, { ReasoningDisplay, reasoningLabel } from '../ReasoningBox';

jest.mock('../../../context/ThemeContext', () => ({ useTheme: () => ({ isDark: false, colors: {} }) }));

const flat = (node: any) => StyleSheet.flatten(node.props.style);

test('matches the design: light-blue section, navy 16px semi-bold heading, white input, mic inside on the right', async () => {
  await render(<ReasoningBox value="" onChangeText={jest.fn()} onToggleMic={jest.fn()} requirement="optional" />);
  const section = flat(screen.getByTestId('reasoning-box'));
  expect(section).toMatchObject({ backgroundColor: '#EEF3FF', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 8 });

  const heading = flat(screen.getByText('Why did you choose this?'));
  expect(heading).toMatchObject({ fontSize: 16, fontWeight: '600', color: '#25324B' });

  const input = screen.getByTestId('reasoning-box-input');
  expect(flat(input)).toMatchObject({ fontSize: 14, color: '#64748B' });
  expect(input.props.maxLength).toBeUndefined();
  expect(input.props.multiline).toBe(true);
  expect(screen.getByPlaceholderText('Optional: explain your thinking or tap the mic to speak…')).toBeTruthy();

  const mic = flat(screen.getByTestId('reasoning-box-mic'));
  expect(mic).toMatchObject({ position: 'absolute', right: 6 });
  expect(screen.getByText('Optional')).toBeTruthy();
});

test('typing, the mic and the listening state', async () => {
  const onChangeText = jest.fn();
  const onToggleMic = jest.fn();
  await render(<ReasoningBox value="" onChangeText={onChangeText} onToggleMic={onToggleMic} requirement="required" />);
  await fireEvent.changeText(screen.getByTestId('reasoning-box-input'), 'Because 2 + 2 = 4');
  expect(onChangeText).toHaveBeenCalledWith('Because 2 + 2 = 4');
  await fireEvent.press(screen.getByTestId('reasoning-box-mic'));
  expect(onToggleMic).toHaveBeenCalled();
  expect(screen.getByText('Required')).toBeTruthy();

});

test('while listening the box says so and the mic stops voice typing', async () => {
  await render(<ReasoningBox value="" onChangeText={jest.fn()} onToggleMic={jest.fn()} listening />);
  expect(screen.getByPlaceholderText('Listening… speak now')).toBeTruthy();
  expect(screen.getByLabelText('Stop voice typing')).toBeTruthy();
});

test('without onToggleMic there is no mic (teacher comment box)', async () => {
  await render(<ReasoningBox value="" onChangeText={jest.fn()} label="Your comment for this question" />);
  expect(screen.queryByTestId('reasoning-box-mic')).toBeNull();
  expect(screen.getByText('Your comment for this question')).toBeTruthy();
});

test('ReasoningDisplay shows text read-only and nothing when empty; labels per question type', async () => {
  await render(<ReasoningDisplay label="Student's reasoning" text="  I counted the sides.  " testID="d" />);
  expect(screen.getByText('I counted the sides.')).toBeTruthy();
});

test('ReasoningDisplay shows nothing for an empty text', async () => {
  await render(<ReasoningDisplay label="Student's reasoning" text="   " testID="d" />);
  expect(screen.queryByTestId('d')).toBeNull();
  expect(reasoningLabel('mcq')).toBe('Why did you choose this?');
  expect(reasoningLabel('fill_blank')).toBe('Why did you write this answer?');
});
