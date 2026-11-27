// Static checks for the marketing homepage (public/landing.html), which the
// web build embeds full-screen in LandingScreen. Website Redesign, Phase 1:
// new palette, fonts, header order and motion, with every piece of copy,
// link and action kept as it was.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../..');
const html = fs.readFileSync(path.join(ROOT, 'public/landing.html'), 'utf8');
const style = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
const body = html.slice(html.indexOf('<body>'));

/** Visible text of the page, without scripts, styles and inline SVG. */
function visibleText(src: string): string {
  return src
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<\/?(em|span|b|strong|small)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}
const text = visibleText(body);

describe('homepage copy is unchanged', () => {
  it.each([
    'Private Beta · India 2026',
    'AI-Powered Learning, for everyone.',
    'A patient, personalised AI tutor for every student, with real-time classroom insight for teachers and weekly progress for parents.',
    'Get Early Access for Free',
    'Book a Demo',
    'Aligned with the boards Indian families trust',
    'Content grounded in NCERT and official board textbooks, taught the way each board expects.',
    'Aivorah Tutor · Grade 5 Maths',
    '↻ Replay',
    'Every child gets a patient AI coach.',
    'Teach smarter, not harder.',
    'Never wonder how your child is doing.',
    'Personalised learning, at every desk.',
    'A teaching loop that never gives up.',
    'Everything a modern learner needs.',
    'Built so that no child learns alone.',
    'Give every child their own tutor.',
    'Patient. Personalised. Powerful. Built for Indian classrooms, kitchens and quiet weekend mornings alike.',
    '© 2026 Aivorah · Made with care in India',
  ])('shows "%s"', (copy) => {
    expect(text).toContain(copy);
  });

  it('keeps all eight curriculum boards', () => {
    for (const board of ['International Baccalaureate', 'CBSE', 'ICSE / ISC', 'Cambridge', 'NCERT', 'Oxford', 'Pearson', 'Hodder']) {
      expect(text).toContain(board);
    }
    expect(body.match(/class="crest"/g)).toHaveLength(8);
  });

  it('keeps every navigation and footer destination', () => {
    for (const href of ['#features', '#how', '#platform', '#teachers', '#parents', '#schools', '#about', 'mailto:aivorah24@gmail.com']) {
      expect(body).toContain(`href="${href}"`);
    }
    for (const label of ['Pricing', 'Changelog', 'Careers', 'Press', 'Contact', 'Privacy', 'Terms', 'Safeguarding', 'DPDP']) {
      expect(text).toContain(label);
    }
  });
});

describe('header', () => {
  const nav = body.slice(body.indexOf('<nav'), body.indexOf('</nav>'));

  it('uses a text-only Aivorah wordmark (no Æ monogram anywhere)', () => {
    expect(nav).toMatch(/<a href="#" class="logo">Aivorah<\/a>/);
    expect(html).not.toContain('Æ');
    expect(html).not.toContain('logo-mark');
  });

  it('puts the theme switch before the menu, and hides account buttons in the compact header', () => {
    const toggle = nav.indexOf('id="themeToggle"');
    const menu = nav.indexOf('id="menuBtn"');
    expect(toggle).toBeGreaterThan(-1);
    expect(menu).toBeGreaterThan(toggle);
    // Between them only the Login / Join buttons, which the compact header hides.
    const between = nav.slice(toggle, menu);
    expect(between.match(/class="btn /g)).toHaveLength(2);
    expect(style).toMatch(/@media \(max-width:999px\)\{[^}]*\}\s*\.nav-links,\.nav-cta \.btn\{display:none\}/);
  });

  it('exposes the switch state and menu state to assistive tech', () => {
    expect(nav).toMatch(/id="themeToggle" type="button" role="switch" aria-checked="false" aria-label="Dark mode"/);
    expect(nav).toMatch(/id="menuBtn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu"/);
    expect(html).toContain("mb.setAttribute('aria-expanded', open ? 'true' : 'false')");
  });

  it('shows named, icon-only theme controls at every width', () => {
    expect(nav).toContain('class="tt-sun"');
    expect(nav).toContain('class="tt-moon"');
    expect(nav).not.toContain('tt-word');
  });

  it('puts Join Early Access before the shared Login pill in the mobile menu', () => {
    const menu = body.slice(body.indexOf('id="mobileMenu"'), body.indexOf('<header class="hero">'));
    expect(menu).toMatch(/>Join Early Access<\/a>\s*<a href="#" class="btn login-pill">Login</);
    expect(nav).toContain('class="btn login-pill"');
  });
});

describe('Phase 1 design tokens', () => {
  const light = style.slice(style.indexOf(':root{'), style.indexOf(':root[data-theme="dark"]'));
  const dark = style.slice(style.indexOf(':root[data-theme="dark"]'));

  it.each([
    ['--bg', '#F7F3E9', '#101827'],
    ['--surface-2', '#F0E8DA', '#162238'],
    ['--surface', '#FFFCF6', '#1C2A40'],
    ['--heading', '#302117', '#FFF3DC'],
    ['--text', '#4F4035', '#DCE6F4'],
    ['--line', '#D5C6B3', '#425775'],
    ['--primary', '#B84312', '#A9D5FF'],
    ['--focus', '#1D5DB5', '#8DD1FF'],
    ['--shape-green', '#77B742', '#6A9F3E'],
    ['--shape-yellow', '#F6C931', '#DCA928'],
    ['--shape-orange', '#F58B3A', '#C85F24'],
    ['--shape-blue', '#61ABD7', '#477EAB'],
  ])('%s is %s in Light and %s in Dark', (token, l, d) => {
    expect(light).toContain(`${token}:${l};`);
    expect(dark).toContain(`${token}:${d};`);
  });

  it('loads Fraunces for headings and DM Sans for body copy', () => {
    expect(html).toContain('family=Fraunces');
    expect(html).toContain('family=DM+Sans');
    expect(style).toContain('--sans:"DM Sans"');
  });

  it('animates the theme switch in about 200 ms', () => {
    expect(style).toContain('--t:200ms');
  });
});

describe('board layout details', () => {
  it('shows the curriculum boards as text, without crest drawings', () => {
    const boards = body.slice(body.indexOf('id="curriculumTrack"'), body.indexOf('class="trust-note"'));
    expect(boards).not.toContain('<svg');
  });

  it('labels tutor and learner messages above their bubbles, without avatars', () => {
    const sim = body.slice(body.indexOf('id="sim"'), body.indexOf('id="replay"'));
    expect(sim).not.toContain('class="avatar');
    expect(sim.match(/<div class="tag">[^<]+<\/div>\s*<div class="bubble/g)).toHaveLength(4);
  });

  it('lets the hero headline wrap naturally', () => {
    expect(body).toContain('<h1>AI-Powered Learning, <span class="grad">for everyone.</span></h1>');
  });
});

describe('hero artwork', () => {
  it('shows both student portraits as decorative images', () => {
    for (const file of ['student-girl.webp', 'student-boy.webp']) {
      expect(body).toContain(`src="/home/${file}" alt=""`);
      expect(fs.existsSync(path.join(ROOT, 'public/home', file))).toBe(true);
    }
    expect(body).toMatch(/<div class="portraits" aria-hidden="true">/);
  });
});

describe('motion', () => {
  it('only hides content for entry effects when motion is allowed', () => {
    // The head script adds html.motion unless the visitor prefers reduced motion…
    expect(html).toMatch(/prefers-reduced-motion: reduce\)'\)\.matches\)\) document\.documentElement\.classList\.add\('motion'\)/);
    // …and every hidden starting state is scoped to html.motion.
    const hidden = style.match(/[^{}]+\{[^{}]*opacity:0[^{}]*\}/g) ?? [];
    for (const rule of hidden) {
      if (rule.includes('@keyframes') || /^\s*(from|to|\d+%)\s*\{/.test(rule)) continue;
      expect(rule.trim()).toMatch(/^html\.motion /);
    }
  });

  it('shows everything at once with reduced motion', () => {
    expect(style).toContain('@media (prefers-reduced-motion:reduce)');
    expect(html).toContain('if(reduce) showAll();');
  });

  it('loops the board row only when allowed and provides a pause control', () => {
    expect(style).toMatch(/@media \(prefers-reduced-motion:no-preference\)[\s\S]*?animation:board-scroll 60s linear infinite/);
    expect(style).toContain('animation-play-state:paused');
    expect(body).toContain('Pause board motion');
    expect(html).toContain("copy.setAttribute('aria-hidden', 'true')");
  });
});

describe('host-app wiring', () => {
  it('still routes Login, Early Access and Book a Demo to the app', () => {
    expect(html).toContain("if(t === 'login'){ el.addEventListener('click', function(e){ e.preventDefault(); send('login'); }); }");
    expect(html).toContain("else if(t.indexOf('book a demo') >= 0){ el.addEventListener('click', function(e){ e.preventDefault(); nav('book-demo'); }); }");
    expect(html).toContain("else if(t.indexOf('early access') >= 0){ el.addEventListener('click', function(e){ e.preventDefault(); send('signup'); }); }");
  });

  it('keeps the homepage-only theme key', () => {
    expect(html.match(/aivorah-home-theme/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
