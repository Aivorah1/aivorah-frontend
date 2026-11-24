import { buildReviewItems, checkAnswer, checkTable, correctOptionIndex, splitTaskTitle, gradeLabel, itemNeedsKey } from '../reviewItems';

// MHLE-31 shape: picture tasks, an mcq, a table, and a task the AI left empty.
const quiz = {
  title: 'MHLE - 31',
  conversionReport: { items: [{ title: 'Task 5: Empty', status: 'FAILED', reason: 'No content could be extracted or generated for this task from the source document.' }] },
  tasks: [
    { title: 'Task 1: Find the area and perimeter of the given shapes in each grid.', tier: 'MUST DO', questions: [
      { id: 'a', question: 'Shape 1', answer: 'Perimeter = 16 units, Area = 12 sq units', imageUrl: 'https://img.test/1.png' },
      { id: 'b', question: 'Shape 2', answer: '' },
    ] },
    { title: 'Task 2: Name the angle', questions: [{ type: 'mcq', question: 'Type?', options: ['acute', 'right', 'obtuse'], answer: 'obtuse' }] },
    { title: 'Task 3: Match', table: { headers: ['L', 'W', 'Area'], rows: [[{ text: '3' }, { text: '2' }, { input: true, answer: '6' }]] } },
    { title: 'Task 4: Chart', chart: { bars: [{ label: 'a', value: 1 }] } },
    { title: 'Task 5: Empty', questions: [] },
  ],
};

test('every question, table and empty task becomes a card, in worksheet order', () => {
  const items = buildReviewItems(quiz);
  expect(items.map(i => `${i.kind}:${i.taskIndex}`)).toEqual(['question:0', 'question:0', 'question:1', 'table:2', 'missing:4']);
  const missing = items[4];
  expect(missing.kind === 'missing' && missing.reason).toMatch(/No content could be extracted/);
});

test('cards that need an answer key are flagged', () => {
  const items = buildReviewItems(quiz);
  expect(items.map(itemNeedsKey)).toEqual([false, true, false, false, true]);
});

test('typed answers are matched by their numbers, words or exact text', () => {
  const q = quiz.tasks[0].questions[0];
  expect(checkAnswer(q, '16, 12')).toBe('correct');
  expect(checkAnswer(q, 'perimeter = 16 units, area = 12 sq units')).toBe('correct');
  expect(checkAnswer(q, '12, 16')).toBe('incorrect');
  expect(checkAnswer({ answer: 24, type: 'numeric' }, '24 cm')).toBe('correct');
  expect(checkAnswer({ answer: '1/2' }, '0.5')).toBe('correct');
  expect(checkAnswer({ answer: 'Acute' }, ' acute ')).toBe('correct');
  expect(checkAnswer(quiz.tasks[0].questions[1], 'anything')).toBe('no-key');
  expect(checkAnswer(q, '   ')).toBe('empty');
  expect(checkAnswer({ type: 'text', answer: 'She has long golden hair and kind blue eyes' }, 'blond hair')).toBe('open');
});

test('multiple choice: picked option against the flagged or named correct one', () => {
  const q = quiz.tasks[1].questions[0];
  expect(correctOptionIndex(q)).toBe(2);
  expect(checkAnswer(q, '', 2)).toBe('correct');
  expect(checkAnswer(q, '', 0)).toBe('incorrect');
  expect(checkAnswer(q, '', null)).toBe('empty');
  expect(correctOptionIndex({ options: [{ label: 'x' }, { label: 'y', correct: true }] })).toBe(1);
  expect(correctOptionIndex({ options: ['p', 'q'], answer: 'B' })).toBe(1);
  expect(checkAnswer({ type: 'mcq', options: ['p', 'q'], answer: '' }, '', 0)).toBe('no-key');
});

test('table cards check every input cell', () => {
  const tbl = quiz.tasks[2].table;
  expect(checkTable(tbl, { '0:2': '6' })).toBe('correct');
  expect(checkTable(tbl, { '0:2': '5' })).toBe('incorrect');
  expect(checkTable(tbl, {})).toBe('empty');
});

test('task titles and grades read naturally', () => {
  expect(splitTaskTitle('**Task 2: Measure the angles**')).toEqual({ label: 'Task 2', text: 'Measure the angles' });
  expect(splitTaskTitle('Enrichment Task: Relationship')).toEqual({ label: 'Enrichment Task', text: 'Relationship' });
  expect(splitTaskTitle('Describe her appearance')).toEqual({ label: '', text: 'Describe her appearance' });
  expect(gradeLabel('8')).toBe('Grade 8');
  expect(gradeLabel('PYP 4')).toBe('PYP 4');
});
