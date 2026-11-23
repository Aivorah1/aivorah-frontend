// Native (Android / iOS) Google sign-in: shows Google's account picker and returns the Google ID
// token that Firebase Auth exchanges for a Firebase user. The website keeps using Firebase's popup.
//
// The package is loaded only when it is needed: its native part exists only in real app builds
// (not in Expo Go or Jest), and a top-level import would crash the whole app there.
import { Platform } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID } from '../config/googleSignIn';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

const UNAVAILABLE = 'google/unavailable';
const NO_ID_TOKEN = 'google/no-id-token';

let loaded: GoogleSignInModule | null = null;
let configured = false;

function googleSignIn(): GoogleSignInModule {
  if (!loaded) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      loaded = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
    } catch (e: any) {
      throw Object.assign(new Error(`Google sign-in is not available in this build: ${e?.message ?? e}`), { code: UNAVAILABLE });
    }
  }
  if (!configured) {
    loaded.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    configured = true;
  }
  return loaded;
}

/**
 * Opens the Google account picker and returns the chosen account's ID token,
 * or null when the user closes the picker.
 */
export async function getNativeGoogleIdToken(): Promise<string | null> {
  const { GoogleSignin, isSuccessResponse } = googleSignIn();
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  // Forget the last account so the picker always shows: a family phone may have several Google
  // accounts, and sign-up must never silently reuse whoever signed in last.
  await GoogleSignin.signOut().catch(() => {});
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  const idToken = response.data.idToken;
  if (!idToken) {
    throw Object.assign(new Error('Google did not return a sign-in token.'), { code: NO_ID_TOKEN });
  }
  return idToken;
}

/** Signs out of Google on the device so the next sign-in shows the account picker. */
export async function signOutNativeGoogle(): Promise<void> {
  if (Platform.OS === 'web' || !loaded) return; // nothing to forget if Google sign-in never ran
  await loaded.GoogleSignin.signOut().catch(() => {});
}

/** A friendly message for a native Google sign-in error, or null if it isn't one. */
export function nativeGoogleErrorMessage(error: unknown): string | null {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as any).code) : null;
  if (!code) return null;
  if (code === UNAVAILABLE) {
    return 'Google sign-in works in the installed Aivorah app. Please sign up with email here.';
  }
  if (code === NO_ID_TOKEN) return 'Google sign-in could not be completed. Please try again.';
  if (code === '10' || code === 'DEVELOPER_ERROR') {
    // The app's package name + SHA-1 isn't registered as an Android OAuth client.
    return 'Google sign-in is not set up for this version of the app yet. Please sign up with email for now.';
  }
  const statusCodes = loaded?.statusCodes;
  if (!statusCodes) return null;
  if (code === statusCodes.SIGN_IN_CANCELLED) return 'Google sign-in was cancelled.';
  if (code === statusCodes.IN_PROGRESS) return 'Google sign-in is already open.';
  if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'Google Play services are missing or out of date on this phone. Please update them and try again.';
  }
  return null;
}
