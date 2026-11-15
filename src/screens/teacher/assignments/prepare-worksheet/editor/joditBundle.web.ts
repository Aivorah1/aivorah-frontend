// Jodit with all its plugins, as ONE module so loadJodit.web.ts can load it
// with a single import(): the whole editor then lands in one lazy chunk.
// (Two separate import()s made the bundler move their shared code into the
// __common chunk that every page loads at start-up.)
// The ESM build only registers a basic plugin set; paste/paste-from-Word,
// indent, alignment, line spacing, table cell editing, image resizing etc.
// come from plugins/all. The ones a worksheet does not need are switched off
// by joditConfig's disablePlugins.
import { Jodit } from 'jodit';
import 'jodit/esm/plugins/all.js';

export { Jodit };
