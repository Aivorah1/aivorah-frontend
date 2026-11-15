// Jodit (MIT) Word-style editor, loaded only when a teacher opens the
// worksheet editor: the script through import() (its own chunk; the ESM
// build, since Metro cannot bundle the prebuilt minified file) and the
// stylesheet as a <link> to public/vendor. The stylesheet is not imported
// from node_modules: Expo's lazy loader turns "jodit.min.css" into
// "jodit.min" and serves jodit.min.js instead, and a static import would add
// it to every page. __tests__/unit/joditStylesheet.test.ts checks the copy
// matches the installed Jodit version.
export const JODIT_CSS_HREF = '/vendor/jodit-4.18.12.min.css';

function loadStylesheet(href: string): Promise<void> {
  const existing = document.querySelector(`link[data-jodit-css="${href}"]`);
  if (existing) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-jodit-css', href);
    // An unstyled toolbar is better than no editor: carry on either way.
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

async function loadScript(): Promise<any> {
  const { Jodit } = await import('./joditBundle.web');
  return Jodit;
}

export async function loadJodit(): Promise<any> {
  const [, Jodit] = await Promise.all([loadStylesheet(JODIT_CSS_HREF), loadScript()]);
  return Jodit;
}
