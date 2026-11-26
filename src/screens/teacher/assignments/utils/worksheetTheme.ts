/**
 * Themes the server-rendered interactive worksheet (POST /quiz/render-preview)
 * for the Teacher Portal's Light / Dark modes — Website Redesign, Phase 4.
 *
 * The worksheet HTML is built by aivorah-assignments-service with one fixed
 * dark palette. To stay frontend-only, every colour declaration in that HTML
 * (its <style> sheet, inline style="" attributes and the cssText its script
 * writes) is rewritten to CSS variables, and both palettes are injected:
 *
 *   <html data-av-theme="light|dark"> … :root[data-av-theme="dark"]{ … }
 *
 * Switching theme later only flips that attribute (setWorksheetTheme), so the
 * preview keeps its scroll position and anything the teacher typed or placed.
 * Source pictures (img src, data URIs) are never touched, and the white
 * picture mats the worksheet puts behind uploaded images stay white so the
 * original material looks the same in both modes.
 */

export type WorksheetTheme = 'light' | 'dark';

// Palette — matches the Phase 4 table (page / card / text / border / primary / focus).
const VARS: Record<WorksheetTheme, Record<string, string>> = {
  light: {
    page: '#F7F3E9', card: '#FFFCF6', input: '#F9F5ED', chip: '#FFFCF6',
    text: '#302117', heading: '#302117', body: '#4F4035', dim: '#6A584A', accent: '#8F350D',
    primary: '#B84312', 'primary-hover': '#9E3A0F', 'primary-soft': '#E9A27F', 'on-primary': '#FFFFFF',
    'hint-bg': '#FCEBD2', hint: '#7A4A06', 'hint-line': '#D99A3A', 'on-hint': '#5C3704',
    success: '#23803A', 'success-solid': '#23803A', error: '#B3261E', 'accent-line': '#B84312',
    focus: '#1D5DB5',
    'line-rgb': '120, 96, 72', 'accent-rgb': '184, 67, 18', 'hint-rgb': '217, 154, 58', 'veil-rgb': '48, 33, 23',
  },
  dark: {
    page: '#101827', card: '#1C2A40', input: '#162238', chip: '#22324B',
    text: '#FFF3DC', heading: '#FFF3DC', body: '#DCE6F4', dim: '#B4C3D8', accent: '#C3E4FF',
    primary: '#A9D5FF', 'primary-hover': '#8DC4F5', 'primary-soft': '#5E86B0', 'on-primary': '#101827',
    'hint-bg': '#3A3320', hint: '#FFD58A', 'hint-line': '#DCA928', 'on-hint': '#FFE7B8',
    success: '#7BD389', 'success-solid': '#7BD389', error: '#FF9C8A', 'accent-line': '#A9D5FF',
    focus: '#8DD1FF',
    'line-rgb': '150, 176, 212', 'accent-rgb': '169, 213, 255', 'hint-rgb': '220, 169, 40', 'veil-rgb': '255, 255, 255',
  },
};

// The service's fixed palette → variable, by what the declaration paints.
const BG: Record<string, string> = {
  '#0F0F0F': 'page', '#1C1C1C': 'card', '#252525': 'input', '#2A2F2E': 'chip',
  '#93B0AC': 'primary', '#7AADA8': 'primary-hover', '#C3DCD8': 'primary-soft',
  '#C5BD96': 'hint-bg', '#4A9D6E': 'success-solid',
};
const FG: Record<string, string> = {
  '#F0EEEC': 'text', '#D8E8E6': 'heading', '#C3DCD8': 'heading', '#A8B5B3': 'body',
  '#5A6B69': 'dim', '#7C8A88': 'dim', '#6B7280': 'dim', '#666': 'dim', '#666666': 'dim',
  '#93B0AC': 'accent', '#7AADA8': 'accent',
  '#C5BD96': 'hint', '#D8C79A': 'hint', '#C5A56A': 'hint',
  '#4A9D6E': 'success', '#C9605F': 'error', '#0F0F0F': 'on-primary',
};
const LINE: Record<string, string> = {
  '#93B0AC': 'accent-line', '#7AADA8': 'accent-line', '#C3DCD8': 'accent-line',
  '#C5BD96': 'hint-line', '#4A9D6E': 'success', '#C9605F': 'error',
  '#0F0F0F': 'page', '#1C1C1C': 'card', '#252525': 'input',
};
const RGBA: Record<string, string> = {
  '195,220,216': 'line-rgb', '147,176,172': 'accent-rgb', '197,189,150': 'hint-rgb',
};

const HEX = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;
const RGBA_RE = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g;
// A colour declaration: property at a boundary, value up to ; } " ' ` < or newline.
const DECL = /(^|[;{\s"'`])(background(?:-color)?|color|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?|box-shadow)(\s*:\s*)([^;{}"'`<>\n]*)/gi;

function mapValue(prop: string, value: string): string {
  const p = prop.toLowerCase();
  const table = p.startsWith('background') ? BG : p === 'color' ? FG : LINE;
  let v = value.replace(HEX, (h) => {
    const key = table[h.toUpperCase()];
    return key ? `var(--ws-${key})` : h;
  });
  v = v.replace(RGBA_RE, (m, r, g, b, a) => {
    const key = RGBA[`${r},${g},${b}`];
    if (key) return `rgba(var(--ws-${key}), ${a})`;
    // Faint white veils (card fills) follow the theme; real white stays white.
    if (r === '255' && g === '255' && b === '255' && parseFloat(a) <= 0.1) return `rgba(var(--ws-veil-rgb), ${a})`;
    return m;
  });
  return v;
}

function themeVars(theme: WorksheetTheme) {
  return Object.entries(VARS[theme]).map(([k, v]) => `--ws-${k}:${v}`).join(';');
}

const THEME_CSS = [
  `:root{${themeVars('light')}}`,
  `:root[data-av-theme="dark"]{${themeVars('dark')}}`,
  // Aivorah type: Fraunces for the worksheet title, DM Sans for everything else.
  'body{font-family:"DM Sans",-apple-system,"Segoe UI",Roboto,"Noto Sans Telugu","Noto Sans Devanagari",Helvetica,Arial,sans-serif;transition:background-color .2s ease,color .2s ease}',
  '.header h1{font-family:"Fraunces",Georgia,serif;font-weight:600;letter-spacing:-0.3px}',
  // Calm, readable surfaces with thin borders and restrained shadows.
  '.q-card{border-radius:18px;box-shadow:0 6px 18px rgba(48,33,23,.06)}',
  ':root[data-av-theme="dark"] .q-card{box-shadow:0 6px 18px rgba(0,0,0,.28)}',
  '.btn-hint{color:var(--ws-on-hint)}',
  '.progress-bar{background:rgba(var(--ws-line-rgb),.22)}',
  '.btn-check,.btn-hint,.btn-show{border-radius:999px;min-height:40px}',
  '.btn-check:hover,.btn-show:hover{background:var(--ws-primary-hover)}',
  // Matching chips: a restrained outline change when selected or placed.
  '.match-chip{transition:transform .12s,box-shadow .12s,border-color .12s,outline-color .15s}',
  '.match-chip.sel{outline:2px solid var(--ws-focus);outline-offset:2px;background:rgba(var(--ws-accent-rgb),.12)}',
  '.match-slot.filled{border-style:solid;border-color:rgba(var(--ws-accent-rgb),.55)}',
  // Strong, visible keyboard focus (TV / remote navigation).
  ':focus-visible{outline:3px solid var(--ws-focus)!important;outline-offset:2px}',
  '@media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important}}',
].join('\n');

const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600&display=swap">';

// A small sun / moon switch for the standalone Open in Tab view.
const STANDALONE_SWITCH = `<button id="av-ws-theme-switch" type="button" role="switch" aria-label="Dark mode"
 style="position:fixed;bottom:16px;right:16px;z-index:2000;box-shadow:0 4px 14px rgba(0,0,0,.18);min-height:40px;padding:6px 14px;border-radius:999px;border:1.5px solid var(--ws-text);background:var(--ws-card);color:var(--ws-text);font:600 14px 'DM Sans',sans-serif;cursor:pointer"></button>
<script>(function(){var r=document.documentElement,b=document.getElementById('av-ws-theme-switch');
function paint(){var d=r.getAttribute('data-av-theme')==='dark';b.setAttribute('aria-checked',d?'true':'false');b.textContent=d?'\\u2600\\uFE0E  Light':'\\u263E  Dark';}
b.addEventListener('click',function(){r.setAttribute('data-av-theme',r.getAttribute('data-av-theme')==='dark'?'light':'dark');paint();});paint();})();</script>`;

const MARK = 'data-av-ws-themed';

/** Rewrites the worksheet HTML so it follows `theme` (and can switch later). */
export function themeWorksheetHtml(html: string, theme: WorksheetTheme, opts: { standalone?: boolean } = {}): string {
  if (!html) return html;
  let out = html;
  if (!out.includes(MARK)) {
    out = out.replace(DECL, (_m, pre, prop, colon, value) => pre + prop + colon + mapValue(prop, value));
    // Success / error colours written by the worksheet script as bare strings.
    out = out.replace(/(['"])#4a9d6e\1/gi, '$1var(--ws-success)$1').replace(/(['"])#c9605f\1/gi, '$1var(--ws-error)$1');
    const head = `${FONTS}<style id="av-ws-theme">${THEME_CSS}</style>`;
    // At the end of <head>, so these rules come after the worksheet's own sheet.
    out = /<\/head>/i.test(out) ? out.replace(/<\/head>/i, `${head}</head>`)
      : /<head[^>]*>/i.test(out) ? out.replace(/<head[^>]*>/i, (h) => h + head) : head + out;
    out = /<html[^>]*>/i.test(out)
      ? out.replace(/<html([^>]*)>/i, (_h, attrs) => `<html${attrs.replace(/\sdata-av-theme="[^"]*"/i, '')} ${MARK} data-av-theme="${theme}">`)
      : `<html ${MARK} data-av-theme="${theme}">${out}</html>`;
  } else {
    out = out.replace(/data-av-theme="(light|dark)"/i, `data-av-theme="${theme}"`);
  }
  if (opts.standalone && !out.includes('av-ws-theme-switch')) {
    out = /<\/body>/i.test(out) ? out.replace(/<\/body>/i, `${STANDALONE_SWITCH}</body>`) : out + STANDALONE_SWITCH;
  }
  return out;
}

/** Flips an already-rendered worksheet document without reloading it. */
export function setWorksheetTheme(doc: Document | null | undefined, theme: WorksheetTheme) {
  try { doc?.documentElement?.setAttribute('data-av-theme', theme); } catch { /* cross-origin or gone */ }
}

/** Opens the themed worksheet in a new browser tab (web only). */
export function openWorksheetInTab(html: string, theme: WorksheetTheme) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([themeWorksheetHtml(html, theme, { standalone: true })], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
}
