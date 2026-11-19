import { USE_LOCAL_SERVICES } from './localServices';

// Current Affairs backend base URL (daily digest, weekly quiz, points/streaks,
// admin content tool). The API lives in aivorah-world-and-you-service under
// /current-affairs, so the live URL and local port (3010) are that service's
// (same as worldAndYouServerUrl.ts). The attendance service only forwards old
// app versions' calls there.
const LIVE_SERVICE = 'https://aivorah-world-and-you-service-1.onrender.com';

// EXPO_PUBLIC_CURRENT_AFFAIRS_URL points only this feature elsewhere (e.g. a preview deploy).
const CURRENT_AFFAIRS_SERVER_URL =
  process.env.EXPO_PUBLIC_CURRENT_AFFAIRS_URL || (USE_LOCAL_SERVICES ? 'http://localhost:3010' : LIVE_SERVICE);

export default CURRENT_AFFAIRS_SERVER_URL;
