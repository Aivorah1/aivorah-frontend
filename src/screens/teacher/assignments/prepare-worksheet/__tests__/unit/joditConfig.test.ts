// The Word-style toolbar has the worksheet tools asked for, and nothing else.
import { DISABLED_PLUGINS, WORKSHEET_BUTTONS, worksheetEditorConfig, worksheetPageCss, PAGE_CLASS } from '../../editor/joditConfig';

test('toolbar: font family/size, B/I/U, colour + highlight, alignment, lists, indent, line spacing, headings, table, image, undo/redo', () => {
  const tools = WORKSHEET_BUTTONS.filter((b) => b !== '|');
  expect(tools).toEqual([
    'undo', 'redo', 'paragraph', 'font', 'fontsize', 'bold', 'italic', 'underline', 'brush',
    'left', 'center', 'right', 'justify', 'ul', 'ol', 'outdent', 'indent', 'lineHeight', 'table', 'image',
  ]);
});

test('tools that do not belong on a worksheet are switched off', () => {
  for (const p of ['source', 'video', 'file', 'print', 'about', 'fullsize', 'speech-recognize', 'ai-assistant']) {
    expect(DISABLED_PLUGINS).toContain(p);
  }
});

test('paste keeps formatting without asking; images can be pasted or inserted', () => {
  const c = worksheetEditorConfig();
  expect(c).toMatchObject({
    askBeforePasteHTML: false, askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html', defaultActionOnPasteFromWord: 'insert_as_html',
    toolbarAdaptive: false,
    uploader: { insertImageAsBase64URI: true },
  });
  expect(c.controls.paragraph.list).toMatchObject({ p: 'Normal', h1: 'Heading 1', h2: 'Heading 2' });
});

test('the editor is drawn as a white A4 page', () => {
  const css = worksheetPageCss('#f4f1ea');
  expect(css).toContain(`.${PAGE_CLASS}`);
  expect(css).toContain('width: 794px');
  expect(css).toContain('background: #fff');
});
