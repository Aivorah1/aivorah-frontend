// Static checks for the Book a Demo page (public/book-demo.html), restyled
// in Website Redesign, Phase 2. Copy, fields and the request flow are unchanged.
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../..');
const html = fs.readFileSync(path.join(ROOT, 'public/book-demo.html'), 'utf8');
const style = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
const body = html.slice(html.indexOf('<body>'));

it('keeps every field, label and action', () => {
  for (const [id, label] of [
    ['csName', 'Your name'], ['csEmailIn', 'Email'], ['csSchool', 'School / organisation'],
    ['csRole', 'Your role'], ['csSize', 'No. of students'], ['csMsg', 'Anything else? (optional)'],
  ]) {
    expect(body).toContain(`<label for="${id}"`);
    expect(body).toContain(`>${label}</label>`);
  }
  expect(body).toContain('id="csDateLbl">Preferred date</span>');
  expect(body).toContain('<button type="submit" class="submit" id="csSubmit">Request demo</button>');
  expect(body).toContain('<a href="mailto:aivorah24@gmail.com" id="csMailto">aivorah24@gmail.com</a>');
  expect(body).toContain("fetch(endpoint, {");
  expect(body).toContain("var endpoint = '/api/demo-request';");
});

it('keeps the introduction and puts it beside the form on wide screens', () => {
  expect(body).toContain('<span class="badge">For Schools</span>');
  expect(body).toContain('<h1 id="demoTitle">Book a Demo</h1>');
  expect(body).toContain("Tell us about your school and we'll set up a personalised walkthrough.");
  expect(style).toMatch(/@media \(min-width:1024px\)\{\.split\{grid-template-columns:/);
});

it('uses the text-only wordmark and the homepage palette', () => {
  expect(html).not.toContain('Æ');
  expect(body).toContain('<a href="/" class="logo" id="homeLogo" aria-label="Aivorah home">Aivorah</a>');
  for (const token of ['--bg:#F7F3E9', '--surface:#FFFCF6', '--heading:#302117', '--primary:#B84312', '--focus:#1D5DB5',
    '--bg:#101827', '--surface:#1C2A40', '--heading:#FFF3DC', '--primary:#A9D5FF', '--focus:#8DD1FF']) {
    expect(style).toContain(token);
  }
  expect(html).toContain('family=DM+Sans');
});

it('keeps one sun/moon switch with the shared theme key', () => {
  expect(body).toContain('id="themeToggle" type="button" role="switch" aria-checked="false" aria-label="Dark mode"');
  expect(html.match(/aivorah-home-theme/g)?.length).toBeGreaterThanOrEqual(2);
});

it('draws the pencil underline once, and not at all with reduced motion', () => {
  expect(style).toMatch(/html\.motion \.rule path\{[^}]*animation:draw/);
  expect(html).toContain("prefers-reduced-motion: reduce)').matches)) document.documentElement.classList.add('motion')");
  expect(style).toContain('@media (prefers-reduced-motion:reduce)');
});
