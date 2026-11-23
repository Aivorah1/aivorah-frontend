// Google sign-in / sign-up in the Android app. It used to call demoLogin(), so every
// "Sign up with Google" on a phone became a demo account (alex@demo.com) instead of the
// student's own Google account. It must now use Google's native account picker and sign
// the real account in to Firebase.
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: { OS: 'android', select: (obj: any) => obj.android ?? obj.native ?? obj.default },
  OS: 'android',
  select: (obj: any) => obj.android ?? obj.native ?? obj.default,
}));

const mockStore: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k: string) => mockStore[k] ?? null),
  setItem: jest.fn(async (k: string, v: string) => { mockStore[k] = v; }),
  removeItem: jest.fn(async (k: string) => { delete mockStore[k]; }),
}));

jest.mock('firebase/app', () => ({ initializeApp: jest.fn(), deleteApp: jest.fn() }));
const mockSignInWithCredential = jest.fn();
const mockSignInWithPopup = jest.fn();
const mockCredential = jest.fn((idToken: string) => ({ providerId: 'google.com', idToken }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
  updateProfile: jest.fn(),
  GoogleAuthProvider: Object.assign(jest.fn().mockImplementation(() => ({})), {
    credential: (t: string) => mockCredential(t),
  }),
  signInWithPopup: (...a: any[]) => mockSignInWithPopup(...a),
  signInWithCredential: (...a: any[]) => mockSignInWithCredential(...a),
}));
jest.mock('../../config/firebase', () => ({ auth: {} }));
jest.mock('../ThemeContext', () => ({ useTheme: () => ({ setThemeMode: jest.fn() }) }));
jest.mock('../../utils/curriculumPrefetch', () => ({ prefetchStudentDashboard: jest.fn() }));

const mockGoogle = {
  configure: jest.fn(),
  hasPlayServices: jest.fn().mockResolvedValue(true),
  signIn: jest.fn(),
  signOut: jest.fn().mockResolvedValue(null),
};
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: (...a: any[]) => mockGoogle.configure(...a),
    hasPlayServices: (...a: any[]) => mockGoogle.hasPlayServices(...a),
    signIn: (...a: any[]) => mockGoogle.signIn(...a),
    signOut: (...a: any[]) => mockGoogle.signOut(...a),
  },
  isSuccessResponse: (r: any) => r?.type === 'success',
  isErrorWithCode: (e: any) => !!e && typeof e === 'object' && 'code' in e,
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE' },
}));

function Consumer({ role }: { role?: 'student' | 'teacher' }) {
  const { user, signInWithGoogle, logout } = useAuth();
  const [error, setError] = React.useState('');
  return (
    <>
      <Text testID="user">{user ? `${user.name}|${user.email}|${user.role}|${user.authProvider}` : 'none'}</Text>
      <Text testID="error">{error}</Text>
      <TouchableOpacity testID="google" onPress={() => signInWithGoogle(role).catch((e: any) => setError(e.message))}>
        <Text>google</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="logout" onPress={() => logout()}><Text>logout</Text></TouchableOpacity>
    </>
  );
}

function mockFetchByUrl(handlers: Record<string, any>) {
  (global.fetch as jest.Mock) = jest.fn((url: string) => {
    const key = Object.keys(handlers).find(k => url.includes(k));
    const body = key ? handlers[key] : {};
    return Promise.resolve({ ok: true, json: async () => body, text: async () => JSON.stringify(body) });
  });
}

async function setup(role?: 'student' | 'teacher') {
  const u = userEvent.setup();
  await render(<AuthProvider><Consumer role={role} /></AuthProvider>);
  return u;
}

const googleAccount = (email: string, name: string) => ({
  type: 'success',
  data: { idToken: `token-for-${email}`, user: { email, name } },
});

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
  // Like React Native: `window` exists, `window.location` does not.
  (global as any).window = {};
  mockSignInWithCredential.mockImplementation(async (_auth: any, cred: any) => ({
    user: {
      email: cred.idToken.replace('token-for-', ''),
      displayName: 'Riya Sharma',
      emailVerified: true,
    },
  }));
});

describe('Google sign-up in the Android app', () => {
  test('a new student signs up with their own Google account, not a demo account', async () => {
    mockGoogle.signIn.mockResolvedValue(googleAccount('riya.sharma@gmail.com', 'Riya Sharma'));
    mockFetchByUrl({ '/user/sync': { onboardingComplete: false }, '/user/preferences': {} });
    const u = await setup('student');

    await u.press(screen.getByTestId('google'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Riya Sharma|riya.sharma@gmail.com|student|google'));
    expect(screen.getByTestId('user')).not.toHaveTextContent(/demo.com/);
    expect(mockGoogle.configure).toHaveBeenCalledWith({ webClientId: expect.stringMatching(/\.apps\.googleusercontent\.com$/) });
    expect(mockCredential).toHaveBeenCalledWith('token-for-riya.sharma@gmail.com');
    expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
    expect(mockSignInWithPopup).not.toHaveBeenCalled();
    // The account is created with the chosen role, under the Google email.
    const syncBodies = (global.fetch as jest.Mock).mock.calls
      .filter(([url]) => String(url).includes('/user/sync'))
      .map(([, init]) => JSON.parse(init?.body || '{}'));
    expect(syncBodies.some(b => b.email === 'riya.sharma@gmail.com' && b.role === 'student' && b.authProvider === 'google')).toBe(true);
  });

  test('the account picker always opens, so a different Google account can be chosen', async () => {
    mockGoogle.signIn.mockResolvedValue(googleAccount('second@gmail.com', 'Second'));
    mockFetchByUrl({ '/user/sync': { onboardingComplete: false }, '/user/preferences': {} });
    const u = await setup('teacher');
    await u.press(screen.getByTestId('google'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Riya Sharma|second@gmail.com|teacher|google'));
    const signOutOrder = mockGoogle.signOut.mock.invocationCallOrder[0];
    const signInOrder = mockGoogle.signIn.mock.invocationCallOrder[0];
    expect(signOutOrder).toBeLessThan(signInOrder);
    expect(mockGoogle.hasPlayServices).toHaveBeenCalled();
  });

  test('a returning user keeps their saved name and role', async () => {
    mockGoogle.signIn.mockResolvedValue(googleAccount('anaya@gmail.com', 'Anaya G'));
    mockFetchByUrl({
      '/user/sync': { id: 'u1', role: 'student', name: 'Anaya Kapoor', onboardingComplete: true },
      '/user/preferences': { accountStatus: 'active' },
    });
    const u = await setup();
    await u.press(screen.getByTestId('google'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Anaya Kapoor|anaya@gmail.com|student|google'));
  });

  test('closing the Google picker signs nobody in', async () => {
    mockGoogle.signIn.mockResolvedValue({ type: 'cancelled', data: null });
    mockFetchByUrl({});
    const u = await setup('student');
    await u.press(screen.getByTestId('google'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Google sign-in was cancelled.'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(mockSignInWithCredential).not.toHaveBeenCalled();
  });

  test('a build that is not registered with Google shows a clear message instead of a demo login', async () => {
    mockGoogle.signIn.mockRejectedValue(Object.assign(new Error('DEVELOPER_ERROR'), { code: '10' }));
    mockFetchByUrl({});
    const u = await setup('student');
    await u.press(screen.getByTestId('google'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(/Google sign-in is not set up for this version of the app yet/));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  test('missing Google Play services gives a helpful message', async () => {
    mockGoogle.hasPlayServices.mockRejectedValueOnce(Object.assign(new Error('no play'), { code: 'PLAY_SERVICES_NOT_AVAILABLE' }));
    mockFetchByUrl({});
    const u = await setup('student');
    await u.press(screen.getByTestId('google'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(/Google Play services are missing or out of date/));
  });

  test('logging out also forgets the Google account on the phone', async () => {
    mockGoogle.signIn.mockResolvedValue(googleAccount('riya.sharma@gmail.com', 'Riya Sharma'));
    mockFetchByUrl({ '/user/sync': { onboardingComplete: false }, '/user/preferences': {} });
    const u = await setup('student');
    await u.press(screen.getByTestId('google'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent(/riya.sharma@gmail.com/));
    mockGoogle.signOut.mockClear();
    await u.press(screen.getByTestId('logout'));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(mockGoogle.signOut).toHaveBeenCalled();
  });
});
