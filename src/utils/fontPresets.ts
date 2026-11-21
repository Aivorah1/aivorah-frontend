import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Font presets for the signed-in portals (web).
 *
 * Every portal's typography already flows through CSS variables on
 * body[data-av-portal] (see ThemeContext): --av-nav (sidebar), --av-heading
 * (headings), --av-body / --av-card (cards, buttons, tables, forms), --av-sub
 * (subheadings) and --av-reading (passages). A preset only re-points those
 * variables via body[data-av-font], so colours, sizes, weights, layout and the
 * icon / equation / code fonts (set explicitly) are untouched, and switching
 * needs no reload. No stored choice = the portal's own default typography.
 */
export type FontPresetId = 'classic' | 'easy' | 'sleek' | 'bubbly' | 'cozy';

type Preset = { id: FontPresetId; label: string; nav: string; heading: string; ui: string; sub: string; reading: string; href: string };

const g = (families: string) => `https://fonts.googleapis.com/css2?${families}&display=swap`;

export const FONT_PRESETS: Preset[] = [
  { id: 'classic', label: 'Classic', nav: 'Outfit', heading: 'Fraunces', ui: 'Figtree', sub: 'Manrope', reading: 'Literata',
    href: g('family=Outfit:wght@400;500;600;700&family=Fraunces:wght@400;500;600;700;800&family=Figtree:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Literata:wght@400;500;600') },
  { id: 'easy', label: 'Easy Read', nav: 'Lexend', heading: 'Lexend', ui: 'Atkinson Hyperlegible', sub: 'Atkinson Hyperlegible', reading: 'Atkinson Hyperlegible',
    href: g('family=Lexend:wght@400;500;600;700;800&family=Atkinson+Hyperlegible:wght@400;700') },
  { id: 'sleek', label: 'Sleek', nav: 'Space Grotesk', heading: 'Plus Jakarta Sans', ui: 'Inter', sub: 'Inter', reading: 'Source Serif 4',
    href: g('family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:wght@400;500;600') },
  { id: 'bubbly', label: 'Bubbly', nav: 'Fredoka', heading: 'Fredoka', ui: 'Varela Round', sub: 'Mulish', reading: 'Bitter',
    href: g('family=Fredoka:wght@400;500;600;700&family=Varela+Round&family=Mulish:wght@400;500;600;700;800&family=Bitter:wght@400;500;600') },
  { id: 'cozy', label: 'Cozy', nav: 'Work Sans', heading: 'Rubik', ui: 'Mulish', sub: 'Work Sans', reading: 'Noto Serif',
    href: g('family=Work+Sans:wght@400;500;600;700&family=Rubik:wght@400;500;600;700;800&family=Mulish:wght@400;500;600;700;800&family=Noto+Serif:wght@400;500;600') },
];

const IS_WEB = Platform.OS === 'web' && typeof document !== 'undefined';
const CSS_ID = 'aivorah-font-presets';
const STORAGE_PREFIX = 'aivorah-font-preset:';

function presetCss(): string {
  return FONT_PRESETS.map((p) =>
    `body[data-av-portal][data-av-font="${p.id}"]{--av-nav:"${p.nav}";--av-heading:"${p.heading}";--av-body:"${p.ui}";--av-card:"${p.ui}";--av-sub:"${p.sub}";--av-reading:"${p.reading}"}`,
  ).join('\n');
}

function ensureCss() {
  if (!IS_WEB || document.getElementById(CSS_ID)) return;
  const el = document.createElement('style');
  el.id = CSS_ID;
  el.textContent = presetCss();
  document.head.appendChild(el);
}

/** Load a preset's web fonts once (all presets when previewing the menu). */
export function loadPresetFonts(ids: FontPresetId[] = FONT_PRESETS.map((p) => p.id)) {
  if (!IS_WEB) return;
  for (const p of FONT_PRESETS) {
    if (!ids.includes(p.id)) continue;
    const id = `aivorah-font-${p.id}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = p.href;
    document.head.appendChild(link);
  }
}

export function presetById(id: string | null | undefined): Preset | undefined {
  return FONT_PRESETS.find((p) => p.id === id);
}

// ── account-scoped storage + live store ───────────────────────────────────
function readStored(account: string): FontPresetId | null {
  try { const v = window.localStorage.getItem(STORAGE_PREFIX + account); return presetById(v) ? (v as FontPresetId) : null; } catch { return null; }
}
function writeStored(account: string, id: FontPresetId | null) {
  try {
    if (id) window.localStorage.setItem(STORAGE_PREFIX + account, id);
    else window.localStorage.removeItem(STORAGE_PREFIX + account);
  } catch { /* storage blocked: the choice still applies for this page */ }
}

let current: FontPresetId | null = null;
const listeners = new Set<(id: FontPresetId | null) => void>();

function apply(id: FontPresetId | null) {
  current = id;
  if (IS_WEB) {
    ensureCss();
    if (id) { loadPresetFonts([id]); document.body.setAttribute('data-av-font', id); }
    else document.body.removeAttribute('data-av-font');
  }
  listeners.forEach((l) => l(id));
}

/**
 * The signed-in account's preset. Restores the stored choice on mount (after a
 * refresh or sign-in) and applies changes instantly across the portal.
 */
export function useFontPreset(account: string | null | undefined): [FontPresetId | null, (id: FontPresetId) => void] {
  const [preset, setPreset] = useState<FontPresetId | null>(current);
  useEffect(() => {
    listeners.add(setPreset);
    return () => { listeners.delete(setPreset); };
  }, []);
  useEffect(() => {
    if (!IS_WEB || !account) return;
    // Always re-apply: the portal clears the body attribute on sign-out.
    apply(readStored(account));
  }, [account]);
  const choose = (id: FontPresetId) => {
    if (IS_WEB && account) writeStored(account, id);
    apply(id);
  };
  return [preset, choose];
}

/** Sign-out / portal unmount: drop the preset attribute (stored choice is kept). */
export function clearAppliedFontPreset() {
  current = null;
  if (IS_WEB) document.body.removeAttribute('data-av-font');
}
