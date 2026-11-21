/**
 * Prepare Worksheet editor setup: a Word-style toolbar with only the tools a
 * worksheet needs, pasting that keeps formatting (Word, Google Docs, web
 * pages, copied images), and the text area drawn as a white A4 page.
 */

// Order follows Word's Home ribbon. 'brush' is Text colour + Highlight colour (two tabs).
export const WORKSHEET_BUTTONS = [
  'undo', 'redo', '|',
  'paragraph', 'font', 'fontsize', '|',
  'bold', 'italic', 'underline', 'brush', '|',
  'left', 'center', 'right', 'justify', '|',
  'ul', 'ol', 'outdent', 'indent', 'lineHeight', '|',
  'table', 'image',
];

// Plugins with no use for a worksheet (and their toolbar buttons) are switched off.
export const DISABLED_PLUGINS = [
  'about', 'ai-assistant', 'speech-recognize', 'print', 'preview', 'source', 'fullsize', 'video', 'file',
  'iframe', 'spellcheck', 'search', 'symbols', 'xpath', 'stat', 'powered-by-jodit', 'copyformat', 'class-span',
];

export const FONTS: Record<string, string> = {
  'Calibri,Carlito,Arial,sans-serif': 'Calibri',
  'Arial,Helvetica,sans-serif': 'Arial',
  "'Times New Roman',Times,serif": 'Times New Roman',
  'Georgia,serif': 'Georgia',
  'Verdana,Geneva,sans-serif': 'Verdana',
  'Tahoma,Geneva,sans-serif': 'Tahoma',
  "'Trebuchet MS',Helvetica,sans-serif": 'Trebuchet MS',
  "'Comic Sans MS',cursive": 'Comic Sans MS',
  "'Courier New',Courier,monospace": 'Courier New',
};

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

export const HEADINGS: Record<string, string> = {
  p: 'Normal', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', h4: 'Heading 4',
};

export const LINE_SPACING = [1, 1.15, 1.5, 2, 2.5, 3];

export const PAGE_CLASS = 'aivorah-worksheet-page';

export function worksheetEditorConfig(placeholder = 'Start typing your worksheet…') {
  return {
    language: 'en',
    toolbarAdaptive: false, // always the full toolbar, like Word on a laptop
    toolbarSticky: true,
    toolbarButtonSize: 'middle',
    buttons: WORKSHEET_BUTTONS,
    disablePlugins: DISABLED_PLUGINS,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    statusbar: false,
    height: 'auto',
    minHeight: 1123 + 48, // one A4 page plus the margin around it
    placeholder,
    editorClassName: PAGE_CLASS,
    // Paste exactly what was copied (formatting, tables, images) without asking.
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html',
    defaultActionOnPasteFromWord: 'insert_as_html',
    // Images inserted from the computer or pasted as pictures go inline; the
    // server moves them to image hosting when the document is saved.
    uploader: { insertImageAsBase64URI: true, imagesExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
    imageDefaultWidth: 320,
    colorPickerDefaultTab: 'color',
    defaultFontSizePoints: 'pt',
    controls: {
      font: { list: FONTS },
      fontsize: { list: FONT_SIZES },
      paragraph: { list: HEADINGS },
      lineHeight: { list: LINE_SPACING },
    },
  };
}

/** The editor area as a white A4 page on the app background (Word's Print Layout). */
export function worksheetPageCss(appBackground: string): string {
  // Selectors are more specific than Jodit's own (e.g. `.jodit-container:not(.jodit_inline) .jodit-wysiwyg`).
  const W = '.jodit-container.jodit:not(.jodit_inline) .jodit-workplace';
  const PAGE = `${W} .jodit-wysiwyg.${PAGE_CLASS}`;
  return `
.jodit-container.jodit.jodit_theme_default:not(.jodit_inline) { border: 0; background: ${appBackground}; }
${W} { background: ${appBackground}; }
.jodit-container.jodit .jodit-toolbar__box:not(:empty) { background: #fff; border-bottom: 1px solid #DDE3EC; }
${PAGE} {
  box-sizing: border-box; width: 794px; max-width: calc(100% - 32px); min-height: 1123px;
  margin: 24px auto; padding: 72px 76px; background: #fff; color: #000;
  box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.06);
  font-family: Calibri, Carlito, Arial, sans-serif; font-size: 11pt; line-height: 1.15;
}
${PAGE} table { border-collapse: collapse; }
${PAGE} td, ${PAGE} th { border: 1px solid #000; padding: 4px 8px; min-width: 24px; }
${PAGE} img { max-width: 100%; height: auto; }
/* Placeholder sits exactly where the caret starts: page top margin + page padding,
   page left edge (centred, max-width calc(100% - 32px)) + page padding. */
${W} .jodit-placeholder {
  padding: 0 !important; margin: 0 !important;
  top: calc(24px + 72px) !important; left: calc(max(16px, 50% - 397px) + 76px) !important;
  font-family: Calibri, Carlito, Arial, sans-serif; font-size: 11pt; line-height: 1.15; color: #6B7280;
}
@media (max-width: 700px) {
  ${PAGE} { padding: 32px 24px; }
  ${W} .jodit-placeholder { top: calc(24px + 32px) !important; left: calc(16px + 24px) !important; }
}
`;
}
