// The assignment review screen shows a generated quiz one card at a time.
// This turns the quiz JSON into that list of cards and checks a typed answer
// against the answer key — pure functions, no React, so they are unit-tested
// on their own (see __tests__/reviewItems.test.ts).
import { answerToEditText } from '../../utils/validation';

export type ReviewItem =
  | { kind: 'question'; taskIndex: number; questionIndex: number; task: any; question: any }
  | { kind: 'table'; taskIndex: number; tableKey: 'table' | number; task: any; table: any }
  | { kind: 'missing'; taskIndex: number; task: any; reason?: string };

const hasRows = (t: any) => !!(t && Array.isArray(t.rows) && t.rows.length);

// Every question becomes a card; a task's answer tables become a card each; a
// task the AI could not fill (no questions, no table) becomes a "missing" card
// saying so, so a gap is never silently skipped.
export function buildReviewItems(quiz: any): ReviewItem[] {
  const items: ReviewItem[] = [];
  const report = quiz?.conversionReport?.items || [];
  (quiz?.tasks || []).forEach((task: any, taskIndex: number) => {
    const before = items.length;
    if (hasRows(task.table)) items.push({ kind: 'table', taskIndex, tableKey: 'table', task, table: task.table });
    (task.tables || []).forEach((tbl: any, k: number) => {
      if (hasRows(tbl)) items.push({ kind: 'table', taskIndex, tableKey: k, task, table: tbl });
    });
    (task.questions || []).forEach((question: any, questionIndex: number) => {
      items.push({ kind: 'question', taskIndex, questionIndex, task, question });
    });
    const hasVisual = (task.chart && Array.isArray(task.chart.bars) && task.chart.bars.length)
      || (Array.isArray(task.pyramids) && task.pyramids.length)
      || (Array.isArray(task.diagramFillBlanks) && task.diagramFillBlanks.length);
    if (items.length === before && !hasVisual) {
      const fromReport = report.find((r: any) => r && r.title && r.title === task.title);
      items.push({ kind: 'missing', taskIndex, task, reason: fromReport?.reason });
    }
  });
  return items;
}

export function cleanTitle(title: any): string {
  return String(title ?? '').replace(/\*\*/g, '').trim();
}

// "Task 1: Find the area…" → { label: 'Task 1', text: 'Find the area…' }
export function splitTaskTitle(title: any): { label: string; text: string } {
  const t = cleanTitle(title);
  const m = t.match(/^((?:task|activity|exercise|section|part)\s*[\w.]+|enrichment(?:\s+task)?)\s*[:.\-–]\s*(.*)$/i);
  return m ? { label: m[1], text: m[2] } : { label: '', text: t };
}

export function optionLabel(o: any): string {
  return typeof o === 'string' ? o : String(o?.label ?? o?.text ?? '');
}

export function correctOptionIndex(question: any): number {
  const opts: any[] = Array.isArray(question?.options) ? question.options : [];
  const flagged = opts.findIndex(o => o && typeof o === 'object' && o.correct);
  if (flagged >= 0) return flagged;
  const key = norm(answerToEditText(question?.answer));
  if (!key) return -1;
  const exact = opts.findIndex(o => norm(optionLabel(o)) === key);
  if (exact >= 0) return exact;
  // "B" or "b)" as the answer to lettered options
  if (/^[a-h]$/.test(key)) {
    const i = key.charCodeAt(0) - 97;
    return i < opts.length ? i : -1;
  }
  return -1;
}

export function norm(v: any): string {
  return String(v ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[×✕]/g, 'x')
    .replace(/(\d)\.(\d)/g, '$1$2') // keep decimal points
    .replace(/[\s.,;:!?'"`()[\]{}]+/g, ' ')
    .replace(//g, '.')
    .trim();
}

const numbersIn = (s: string) => (s.match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) || []).map(n => n);

export function hasAnswerKey(question: any): boolean {
  if (!question) return false;
  if (question.type === 'mcq' && Array.isArray(question.options) && question.options.length) return correctOptionIndex(question) >= 0;
  return answerToEditText(question.answer).trim().length > 0;
}

// Long free-text model answers (explain, describe, draw…) can't be marked by
// matching text — the reviewer compares with the model answer instead.
export function isOpenEnded(question: any): boolean {
  if (!question || question.type === 'mcq' || question.type === 'numeric') return false;
  const key = answerToEditText(question.answer);
  const words = key.trim().split(/\s+/).filter(Boolean).length;
  return words > 6 && numbersIn(key).length === 0;
}

export type CheckResult = 'correct' | 'incorrect' | 'no-key' | 'open' | 'empty';

export function checkAnswer(question: any, given: string, selectedOption?: number | null): CheckResult {
  if (question?.type === 'mcq' && Array.isArray(question.options) && question.options.length) {
    if (selectedOption == null || selectedOption < 0) return 'empty';
    const correct = correctOptionIndex(question);
    if (correct < 0) return 'no-key';
    return selectedOption === correct ? 'correct' : 'incorrect';
  }
  if (!String(given ?? '').trim()) return 'empty';
  if (!hasAnswerKey(question)) return 'no-key';
  if (isOpenEnded(question)) return 'open';
  const keys = [answerToEditText(question.answer), ...(Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers.map(String) : [])];
  const g = norm(given);
  for (const k of keys) {
    const nk = norm(k);
    if (!nk) continue;
    if (nk === g) return 'correct';
    // "24", "24 cm" and "Perimeter = 24 cm" all match a key of 24 / "24 cm";
    // "16, 12" matches "Perimeter = 16 units, Area = 12 sq units".
    const kn = numbersIn(nk);
    const gn = numbersIn(g);
    if (kn.length && gn.length === kn.length && kn.every((n, i) => Number(eval1(n)) === Number(eval1(gn[i])))) return 'correct';
  }
  return 'incorrect';
}

function eval1(n: string): number {
  if (n.includes('/')) {
    const [a, b] = n.split('/').map(Number);
    return b ? a / b : NaN;
  }
  return Number(n);
}

// A table card: every input cell checked against its key.
export function checkTable(table: any, given: Record<string, string>): CheckResult {
  const cells: { key: string; answer: any }[] = [];
  (table?.rows || []).forEach((row: any[], r: number) => (row || []).forEach((cell: any, c: number) => {
    if (cell && cell.input) cells.push({ key: `${r}:${c}`, answer: cell.answer });
  }));
  if (!cells.length) return 'no-key';
  if (cells.every(c => !String(given[c.key] ?? '').trim())) return 'empty';
  if (cells.some(c => !String(c.answer ?? '').trim())) return 'no-key';
  return cells.every(c => checkAnswer({ type: 'text', answer: c.answer }, given[c.key] ?? '') === 'correct') ? 'correct' : 'incorrect';
}

export function tableHasKey(table: any): boolean {
  const inputs = (table?.rows || []).flat().filter((c: any) => c && c.input);
  return inputs.length > 0 && inputs.every((c: any) => String(c.answer ?? '').trim());
}

export function itemNeedsKey(item: ReviewItem): boolean {
  if (item.kind === 'missing') return true;
  if (item.kind === 'table') return !tableHasKey(item.table);
  return !hasAnswerKey(item.question);
}

// "4" → "Grade 4"; "PYP 4" / "Grade 8" stay as they are.
export function gradeLabel(grade: any): string {
  const g = String(grade ?? '').trim();
  if (!g) return '';
  return /^\d{1,2}$/.test(g) ? `Grade ${g}` : g;
}
