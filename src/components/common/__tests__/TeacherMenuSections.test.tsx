// Teacher menu order (web sidebar and phone drawer):
// MENU: Dashboard, Students · CLASS: My Classes, Attendance, Schedule, Timetable ·
// RESOURCES: School Policies, Student Report, Portfolio · MANAGE: unchanged.
import React from 'react';
import { Platform } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Sidebar from '../Sidebar';
import DrawerContent from '../DrawerContent';

let mockUser: any;
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: jest.fn(), updateUser: jest.fn(), switchRole: jest.fn(), beginAddParentProfile: jest.fn() }),
}));
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: require('../../../theme').darkColors, themeMode: 'dark', setThemeMode: jest.fn(), isDark: true }),
}));
jest.mock('../../../context/NotificationContext', () => ({
  useNotification: () => ({ unreadCount: 0, unreadAssignments: 0, unreadChallenges: 0 }),
}));
jest.mock('../../../screens/shared/announcements/context/AnnouncementProvider', () => ({
  useAnnouncements: () => ({ bannerAnnouncements: [] }),
}));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../../../constants/adminEmails', () => ({ isAdminEmail: () => false }));
jest.mock('../SwitchProfile', () => ({ SwitchProfile: () => null }));

const TEACHER = { email: 't@x.com', role: 'teacher', roles: ['teacher'], schoolId: 'sc1' };
const SECTIONS: [string, string[]][] = [
  ['MENU', ['Dashboard', 'Students']],
  ['CLASS', ['My Classes', 'Attendance', 'Schedule', 'Timetable']],
  ['RESOURCES', ['School Policies', 'Student Report', 'Portfolio']],
  ['MANAGE', ['Assignments', 'Challenges', 'Curriculum Upload', 'Learning Paths', 'Messages', 'Professional Development']],
];
const ALL_LABELS = [...SECTIONS.flatMap(([h, items]) => [h, ...items]), 'SYSTEM', 'TEACHING DEVELOPMENT', 'Resources',
  'Announcements', 'Send Announcement', 'Student Progress', 'Settings', 'Achievements', 'Project Details', 'Help Center'];

// Every known heading/label, in the order it is rendered.
function renderedOrder(): string[] {
  const out: string[] = [];
  const walk = (node: any) => {
    if (node == null) return;
    if (typeof node === 'string') { if (ALL_LABELS.includes(node)) out.push(node); return; }
    if (Array.isArray(node)) { node.forEach(walk); return; }
    (node.children || []).forEach(walk);
  };
  walk(screen.toJSON());
  return out;
}
function expectSections(order: string[]) {
  let at = -1;
  for (const [heading, items] of SECTIONS) {
    const h = order.indexOf(heading);
    expect(h).toBeGreaterThan(at);
    expect(order.slice(h + 1, h + 1 + items.length)).toEqual(items);
    at = h + items.length;
  }
  expect(order).not.toContain('Resources'); // renamed to School Policies
}

const ORIGINAL_OS = Platform.OS;
afterEach(() => Object.defineProperty(Platform, 'OS', { get: () => ORIGINAL_OS, configurable: true }));

beforeEach(() => {
  mockUser = TEACHER;
  global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: async () => ({}) })) as any;
});

describe('web sidebar', () => {
  test('sections and order', async () => {
    await render(<Sidebar currentScreen="TeacherDashboard" onNavigate={jest.fn()} />);
    const order = renderedOrder();
    expectSections(order);
    expect(order.indexOf('Announcements')).toBeGreaterThan(order.indexOf('Professional Development'));
    expect(order.indexOf('SYSTEM')).toBeGreaterThan(order.indexOf('MANAGE'));
  });

  test.each([
    ['School Policies', 'Resources'],
    ['Student Report', 'TeacherStudentReport'],
    ['Portfolio', 'TeacherPortfolio'],
    ['My Classes', 'MyClasses'],
    ['Timetable', 'Timetable'],
  ])('%s opens %s', async (label, route) => {
    const onNavigate = jest.fn();
    await render(<Sidebar currentScreen="TeacherDashboard" onNavigate={onNavigate} />);
    fireEvent.press(screen.getByText(label));
    expect(onNavigate).toHaveBeenCalledWith(route, undefined);
  });

  test('a teacher with no school has no RESOURCES section', async () => {
    mockUser = { ...TEACHER, schoolId: null };
    await render(<Sidebar currentScreen="TeacherDashboard" onNavigate={jest.fn()} />);
    expect(screen.queryByText('RESOURCES')).toBeNull();
    expect(screen.queryByText('Student Report')).toBeNull();
    expect(screen.getByText('CLASS')).toBeTruthy(); // Schedule is not school-only
  });
});

describe('phone drawer', () => {
  const nav = () => ({ navigate: jest.fn(), closeDrawer: jest.fn() });

  test('same sections and order on the web build of the drawer', async () => {
    const os = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'web', configurable: true });
    try {
      await render(<DrawerContent state={{ routes: [{ name: 'TeacherDashboard' }], index: 0 }} navigation={nav()} />);
      expectSections(renderedOrder());
    } finally {
      Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
    }
  });

  test('Student Report opens its screen', async () => {
    const os = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'web', configurable: true });
    try {
      const navigation = nav();
      await render(<DrawerContent state={{ routes: [{ name: 'TeacherDashboard' }], index: 0 }} navigation={navigation} />);
      fireEvent.press(screen.getByText('Student Report'));
      expect(navigation.navigate).toHaveBeenCalledWith('TeacherStudentReport', undefined);
    } finally {
      Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
    }
  });

  test('on the phone app, sections with no allowed screens get no heading', async () => {
    Object.defineProperty(Platform, 'OS', { get: () => 'ios', configurable: true });
    await render(<DrawerContent state={{ routes: [{ name: 'TeacherDashboard' }], index: 0 }} navigation={nav()} />);
    expect(screen.queryByText('RESOURCES')).toBeNull();
    expect(screen.queryByText('TEACHING DEVELOPMENT')).toBeNull();
    expect(screen.getByText('CLASS')).toBeTruthy();
  });
});
