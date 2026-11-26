import { themeWorksheetHtml, setWorksheetTheme } from '../worksheetTheme';

// A trimmed sample of what POST /quiz/render-preview returns: a <style> sheet,
// inline style attributes, cssText written by the worksheet script, and a
// source picture that must not change.
const SAMPLE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
  body { background: #0F0F0F; color: #F0EEEC; }
  .q-card { background: #1C1C1C; border: 1px solid rgba(195,220,216,0.12); }
  .btn-check { background: #93B0AC; color: #0F0F0F; }
  .match-img { background:#fff; }
  .match-slot.m-ok { border-color:#4a9d6e; background:rgba(74,157,110,0.18); }
</style></head><body>
<div class="q-card" style="border-left:4px solid #C5BD96;background:rgba(197,189,150,0.08)"><span style="color:#C5BD96">COULD DO</span></div>
<img class="wk-img" src="data:image/svg+xml;utf8,<svg fill='#0F0F0F'></svg>">
<script>el.style.cssText = 'position:fixed;background:#1C1C1C;color:#93B0AC;'; ok.style.color = '#4a9d6e';</script>
</body></html>`;

describe('worksheetTheme (Website Redesign, Phase 4)', () => {
  test('rewrites the fixed dark palette to theme variables and injects both palettes', () => {
    const out = themeWorksheetHtml(SAMPLE, 'light');
    expect(out).toContain('<html lang="en" data-av-ws-themed data-av-theme="light">');
    expect(out).toContain('body { background: var(--ws-page); color: var(--ws-text); }');
    expect(out).toContain('.q-card { background: var(--ws-card); border: 1px solid rgba(var(--ws-line-rgb), 0.12); }');
    expect(out).toContain('.btn-check { background: var(--ws-primary); color: var(--ws-on-primary); }');
    expect(out).toContain('border-left:4px solid var(--ws-hint-line);background:rgba(var(--ws-hint-rgb), 0.08)');
    expect(out).toContain('<span style="color:var(--ws-hint)">COULD DO</span>');
    expect(out).toContain("background:var(--ws-card);color:var(--ws-accent);");
    expect(out).toContain("ok.style.color = 'var(--ws-success)'");
    expect(out).toContain(':root{--ws-page:#F7F3E9');
    expect(out).toContain(':root[data-av-theme="dark"]{--ws-page:#101827');
  });

  test('keeps source pictures and their white mats unchanged', () => {
    const out = themeWorksheetHtml(SAMPLE, 'dark');
    expect(out).toContain(`src="data:image/svg+xml;utf8,<svg fill='#0F0F0F'></svg>"`);
    expect(out).toContain('.match-img { background:#fff; }');
    // Success / error tints keep their meaning in both themes.
    expect(out).toContain('background:rgba(74,157,110,0.18)');
  });

  test('theming twice only changes the theme attribute', () => {
    const light = themeWorksheetHtml(SAMPLE, 'light');
    const dark = themeWorksheetHtml(light, 'dark');
    expect(dark).toBe(light.replace('data-av-theme="light"', 'data-av-theme="dark"'));
    expect(dark.match(/id="av-ws-theme"/g)).toHaveLength(1);
  });

  test('the standalone (Open in Tab) view gets its own theme switch', () => {
    const out = themeWorksheetHtml(SAMPLE, 'dark', { standalone: true });
    expect(out).toContain('id="av-ws-theme-switch"');
    expect(out).toContain('role="switch"');
    expect(themeWorksheetHtml(SAMPLE, 'dark')).not.toContain('av-ws-theme-switch');
  });

  test('setWorksheetTheme flips an open document in place', () => {
    const attrs: Record<string, string> = { 'data-av-theme': 'light' };
    const doc = { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } } } as unknown as Document;
    setWorksheetTheme(doc, 'dark');
    expect(attrs['data-av-theme']).toBe('dark');
    expect(() => setWorksheetTheme(null, 'light')).not.toThrow();
  });
});
