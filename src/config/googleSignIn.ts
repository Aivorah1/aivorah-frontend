// Google sign-in for the Android / iOS app.
//
// The native Google account picker returns an ID token for this OAuth "Web client" of the
// Firebase project (ai-learning-platform-c1308), which Firebase Auth then accepts with
// signInWithCredential. It is the same client Firebase's web popup uses, so it is public (it is
// already in the website's sign-in URL), not a secret. Override with EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.
//
// The Android app must also have an "Android" OAuth client in the same Google Cloud project, with
// package name com.aivorah.app and the SHA-1 of the keystore that signed the build (see
// `eas credentials -p android`). Without it Google answers with DEVELOPER_ERROR.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  || '201607982243-m1cg7oiprqthcnjoug20o3f78pb77t1l.apps.googleusercontent.com';
