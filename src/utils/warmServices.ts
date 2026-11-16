// Keep backend services warm while the web app is open.
//
// Render puts an idle service to sleep; the first request after that waits
// 20-50 s. This module pings each service's /health endpoint on an interval so
// the container stays warm and the first real request is fast. Returns a stop
// function to cancel the polling (called on navigator unmount).

const WARM_INTERVAL_MS = 5 * 60 * 1000; // every 5 min

export function warmServices(serviceUrls: string[]): () => void {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return () => {};
  }

  let cancelled = false;

  async function pingOne(url: string) {
    try {
      // Build the health URL: most services expose /health at the root.
      const base = url.replace(/\/+$/, '');
      const healthUrl = `${base}/health`;
      await fetch(healthUrl, {
        method: 'GET',
        mode: 'no-cors', // we only care that the request goes out; no-cors avoids CORS errors
        cache: 'no-store',
        keepalive: true, // survives navigation
      });
    } catch {
      // Network error / service asleep — ignore; next tick will retry.
    }
  }

  async function pingAll() {
    if (cancelled) return;
    await Promise.all(serviceUrls.map(pingOne));
  }

  // Ping immediately so the first request after sign-in is fast.
  pingAll();

  const timer = setInterval(() => {
    if (!cancelled) pingAll();
  }, WARM_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}

// Alias kept for callers that import keepServicesWarm (navigation/lazyScreens.tsx).
export const keepServicesWarm = warmServices;
