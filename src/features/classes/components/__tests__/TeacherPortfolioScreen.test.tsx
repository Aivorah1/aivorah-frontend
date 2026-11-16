// Sidebar > Resources > Portfolio is its own (blank, for now) page: it must not
// forward to My Classes or a class Portfolio.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TeacherPortfolioScreen from '../TeacherPortfolioScreen';

jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { bgDark: '#fafafa' } }),
}));
jest.mock('../../../../components/common/Header', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ title }: any) => <Text>{title}</Text> };
});
jest.mock('../../../../components/common/ScreenLayout', () => ({ __esModule: true, default: ({ children }: any) => children }));

test('shows a Portfolio page and stays on it', async () => {
  const navigation = { navigate: jest.fn(), openDrawer: jest.fn() };
  await render(<TeacherPortfolioScreen navigation={navigation} />);
  expect(screen.getByText('Portfolio')).toBeTruthy();
  expect(navigation.navigate).not.toHaveBeenCalled();
});
