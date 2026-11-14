// Sidebar > Resources > Portfolio opens the existing class Portfolio of the teacher's home class.
import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import TeacherPortfolioScreen from '../TeacherPortfolioScreen';
import { fetchMyClasses } from '../../api/classesApi';

jest.mock('../../api/classesApi', () => ({ fetchMyClasses: jest.fn() }));
jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return { useFocusEffect: (cb: any) => R.useEffect(cb, [cb]) };
});
jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { accentYellow: '#c90', textDim: '#999', textMuted: '#666', borderColor: '#ddd', bgDark: '#fafafa' } }),
}));
jest.mock('../../../../components/common/Header', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ title }: any) => <Text>{title}</Text> };
});
jest.mock('../../../../components/common/ScreenLayout', () => ({ __esModule: true, default: ({ children }: any) => children }));

const CLASS = { grade: 'Grade 8', section: 'A', label: 'Grade 8 A', code: 'Grade 8A', classTeacherEmail: 't1@s.org', classTeacherName: 'T1', studentCount: 30 };

beforeEach(() => jest.clearAllMocks());

test('one home class: opens its Portfolio (ClassDetail)', async () => {
  (fetchMyClasses as jest.Mock).mockResolvedValue([CLASS]);
  const navigation = { navigate: jest.fn() };
  await render(<TeacherPortfolioScreen navigation={navigation} />);
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('ClassDetail', {
    grade: 'Grade 8', section: 'A', label: 'Grade 8 A', code: 'Grade 8A', classTeacherEmail: 't1@s.org',
  }));
});

test.each([[[]], [[CLASS, { ...CLASS, section: 'B' }]]])('no home class or several: opens My Classes', async (classes) => {
  (fetchMyClasses as jest.Mock).mockResolvedValue(classes);
  const navigation = { navigate: jest.fn() };
  await render(<TeacherPortfolioScreen navigation={navigation} />);
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('MyClasses'));
});

test('an error can be retried', async () => {
  (fetchMyClasses as jest.Mock).mockRejectedValueOnce(new Error('Failed to load classes')).mockResolvedValueOnce([CLASS]);
  const navigation = { navigate: jest.fn() };
  await render(<TeacherPortfolioScreen navigation={navigation} />);
  expect(await screen.findByText('Failed to load classes')).toBeTruthy();
  await userEvent.setup().press(screen.getByText('Retry'));
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('ClassDetail', expect.objectContaining({ grade: 'Grade 8' })));
});
