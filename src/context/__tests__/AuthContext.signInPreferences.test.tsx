// Regression: sign-in built the user from an explicit field list that dropped
// avatarStyle/learningStyle, so a student resuming onboarding after
// "Save & go to home page" saw Default avatar and no learning style.

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
  OS: 'web',
  select: (obj: any) => obj.web ?? obj.default,
}));

jest.mock('firebase/app', () => ({ initializeApp: jest.fn(), deleteApp: jest.fn() }));

const mockSignInWithPopup = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
let mockAuthStateChanged: (firebaseUser: unknown) => Promise<void>;
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((_auth, callback) => {
    mockAuthStateChanged = callback;
    return jest.fn();
  }),
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
  updateProfile: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
  signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
}));

jest.mock('../../config/firebase', () => ({ auth: {} }));
jest.mock('../ThemeContext', () => ({ useTheme: () => ({ setThemeMode: jest.fn() }) }));
jest.mock('../../utils/curriculumPrefetch', () => ({ prefetchStudentDashboard: jest.fn() }));

function TestConsumer() {
  const { user, authError, signInWithGoogle, signInWithEmail } = useAuth();
  const [error, setError] = React.useState('');
  return (
    <>
      <Text testID="role">{user?.role ?? '(none)'}</Text>
      <Text testID="error">{error || authError}</Text>
      <Text testID="avatar">{(user as any)?.avatarStyle ?? '(none)'}</Text>
      <Text testID="learning">{(user as any)?.learningStyle ?? '(none)'}</Text>
      <Text testID="photo">{(user as any)?.photoUrl ?? '(none)'}</Text>
      <Text testID="school">{user?.school ?? '(none)'}</Text>
      <TouchableOpacity testID="signin-google" onPress={() => signInWithGoogle('student').catch((err) => setError(err.message))}>
        <Text>Google</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="signin-email" onPress={() => signInWithEmail('student@example.com', 'password123').catch((err) => setError(err.message))}>
        <Text>Email</Text>
      </TouchableOpacity>
    </>
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  (global as any).window = { location: { hostname: 'aivorah-frontend.vercel.app', search: '', origin: 'https://aivorah-frontend.vercel.app' } };
  mockSignInWithPopup.mockResolvedValue({
    user: { displayName: 'Brintha', email: 'student@example.com', emailVerified: true },
  });
  mockSignInWithEmailAndPassword.mockResolvedValue({
    user: { displayName: 'Brintha', email: 'student@example.com', emailVerified: true, uid: 'u1' },
  });
  // Mid-onboarding student: progress saved, onboarding not complete yet.
  (global.fetch as jest.Mock) = jest.fn((url: string) => {
    if (url.includes('/user/sync')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          id: 'u1', role: 'student', name: 'Brintha', onboardingComplete: false,
          grade: 'Grade 8', curriculum: 'IB MYP', photoUrl: 'https://img.example/p.jpg',
        }),
      });
    }
    if (url.includes('/user/preferences')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ accountStatus: 'active', avatarStyle: 'casual', learningStyle: 'visual' }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
});

test.each(['signin-email', 'signin-google'])('%s reports a profile lookup outage without starting onboarding', async (button) => {
  (global.fetch as jest.Mock).mockImplementation((url: string) => url.includes('/user/sync')
    ? Promise.resolve({ ok: false, status: 503 })
    : Promise.reject(new TypeError('Failed to fetch')));

  const user = userEvent.setup();
  await render(<AuthProvider><TestConsumer /></AuthProvider>);
  await user.press(screen.getByTestId(button));

  expect(await screen.findByText(/could not load your account/)).toBeTruthy();
  expect(screen.getByTestId('role').props.children).toBe('(none)');
  expect(await AsyncStorage.getItem('ai_mentor_user_profile')).toBeNull();
});

test('restoring an incomplete cached session waits for a successful profile lookup', async () => {
  await AsyncStorage.setItem('ai_mentor_user_profile', JSON.stringify({
    email: 'student@example.com', role: 'student', onboardingComplete: false,
  }));
  (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));
  await render(<AuthProvider><TestConsumer /></AuthProvider>);

  expect(screen.getByTestId('role').props.children).toBe('(none)');
  await act(async () => {
    await mockAuthStateChanged({ email: 'student@example.com', providerData: [{ providerId: 'password' }] });
  });

  expect(screen.getByText(/could not load your account/)).toBeTruthy();
  expect(screen.getByTestId('role').props.children).toBe('(none)');
});

test.each([['signin-email'], ['signin-google']])(
  '%s carries saved avatar, learning style and photo onto the user',
  async (testID) => {
    const user = userEvent.setup();
    await render(<AuthProvider><TestConsumer /></AuthProvider>);
    await user.press(screen.getByTestId(testID));

    await waitFor(() => {
      expect(screen.getByTestId('avatar').props.children).toBe('casual');
    });
    expect(screen.getByTestId('learning').props.children).toBe('visual');
    expect(screen.getByTestId('photo').props.children).toBe('https://img.example/p.jpg');
  },
);

// Regression: email sign-in defaulted a blank school to "Hyderabad International
// School", so teacher-created students showed the wrong school.
test('email sign-in never invents a school for a student without one', async () => {
  const user = userEvent.setup();
  await render(<AuthProvider><TestConsumer /></AuthProvider>);
  await user.press(screen.getByTestId('signin-email'));
  await waitFor(() => expect(screen.getByTestId('avatar').props.children).toBe('casual'));
  expect(screen.getByTestId('school').props.children).toBe('(none)');
});
