// Signed-out pages that live at their own URL (they used to be overlays on
// the homepage). App.tsx keeps these paths while signed out, and clears them
// back to "/" once a session exists.
export type AuthPage = 'home' | 'signin' | 'signup' | 'forgot' | 'book-demo';

export const AUTH_PAGE_PATHS: Record<Exclude<AuthPage, 'home'>, string> = {
  signin: '/signin',
  signup: '/signup',
  forgot: '/forgot-password',
  'book-demo': '/book-demo',
};

export function authPageFromPath(pathname: string): AuthPage {
  const p = (pathname || '/').replace(/\/+$/, '') || '/';
  const hit = (Object.keys(AUTH_PAGE_PATHS) as (keyof typeof AUTH_PAGE_PATHS)[])
    .find((k) => AUTH_PAGE_PATHS[k] === p);
  return hit || 'home';
}

export function isAuthPagePath(pathname: string): boolean {
  return authPageFromPath(pathname) !== 'home';
}
