import { LEGACY_ACCOUNT_BACKEND, USE_LOCAL_SERVICES } from './localServices';

// Profile microservice base URL (aivorah-profile-service) — student + parent
// profile. Deployed live on Render; web dev uses the local service port.
//
// 2026-09-18: migrated to a new Render account (old account suspended for
// billing). Temporary URL — Render appended a random suffix since the
// original name is still claimed by the suspended account.
const LIVE_SERVICE = 'https://aivorah-profile-service-h51m.onrender.com';

const PROFILE_SERVER_URL =
  USE_LOCAL_SERVICES ? 'http://localhost:4002' : (LEGACY_ACCOUNT_BACKEND ?? LIVE_SERVICE);

export default PROFILE_SERVER_URL;
