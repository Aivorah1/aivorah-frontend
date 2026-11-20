import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ClassDetailScreen from '../ClassDetailScreen';

let mockRole = 'teacher';
jest.mock('../../../../context/AuthContext', () => ({ useAuth: () => ({ user: { role: mockRole } }) }));
jest.mock('../../../../context/ThemeContext', () => ({ useTheme: () => ({ colors: { bgDark: '#fff', accentYellow: '#B8860B' } }) }));
jest.mock('../../../../components/common/Header', () => function MockHeader() { return null; });
jest.mock('../../../../components/common/ScreenLayout', () => ({ __esModule: true, default: ({ children }: any) => children }));
jest.mock('../../../class-portfolio/components/PortfolioFeed', () => function MockFeed() { return null; });

const route = { params: { grade: 'Grade 6', section: 'B', label: 'Grade 6 B' } };

test('teacher: My Classes → class → Student Reports opens that class’s student reports', async () => {
  mockRole = 'teacher';
  const navigation = { navigate: jest.fn() };
  await render(<ClassDetailScreen navigation={navigation} route={route} />);
  await fireEvent.press(screen.getByTestId('class-student-reports'));
  expect(navigation.navigate).toHaveBeenCalledWith('TeacherStudentReport', expect.objectContaining({ grade: 'Grade 6', section: 'B' }));
});

test('students and parents do not see it', async () => {
  mockRole = 'parent';
  await render(<ClassDetailScreen navigation={{ navigate: jest.fn() }} route={route} />);
  expect(screen.queryByTestId('class-student-reports')).toBeNull();
});
