// The editor's stylesheet is served from public/vendor (see editor/loadJodit.web.ts).
// It must be the one shipped with the installed Jodit: after upgrading Jodit, copy
// node_modules/jodit/es2021.en/jodit.min.css to public/vendor/jodit-<version>.min.css
// and update JODIT_CSS_HREF.
import fs from 'fs';
import path from 'path';
import { JODIT_CSS_HREF } from '../../editor/loadJodit.web';

const root = path.resolve(__dirname, '../../../../../../..');

test('public/vendor stylesheet matches the installed Jodit version', () => {
  const version = require(path.join(root, 'node_modules/jodit/package.json')).version;
  expect(JODIT_CSS_HREF).toBe(`/vendor/jodit-${version}.min.css`);
  const served = fs.readFileSync(path.join(root, 'public', JODIT_CSS_HREF));
  const installed = fs.readFileSync(path.join(root, 'node_modules/jodit/es2021.en/jodit.min.css'));
  expect(served.equals(installed)).toBe(true);
});
