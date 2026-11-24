import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import SERVER_URL from '../../../../../config/serverUrl';
import { answerToEditText } from '../../utils/validation';
import { taskPicture, questionPicture } from '../../utils/quizEditing';
import {
  buildReviewItems, checkAnswer, checkTable, splitTaskTitle, cleanTitle, optionLabel, correctOptionIndex,
  itemNeedsKey, type ReviewItem, type CheckResult,
} from './reviewItems';
import type { useReviewLayout } from './useReviewLayout';

type Layout = ReturnType<typeof useReviewLayout>;
type Colors = Record<string, string>;
type Response = { text?: string; option?: number | null; cells?: Record<string, string>; result?: CheckResult; hint?: boolean };

const imgUri = (u: string) => (u.startsWith('http') || u.startsWith('data:') ? u : `${SERVER_URL}${u}`);

function itemPicture(item: ReviewItem): string | null {
  const task = item.task;
  if (item.kind === 'question') {
    const own = questionPicture(task, item.questionIndex);
    if (own) return own;
    const shared = taskPicture(task);
    if (shared) return shared;
    if (item.question?.hasImage && task.pageImageUrl) return task.pageImageUrl;
    return null;
  }
  if (item.kind === 'table') return taskPicture(task);
  return task.pageImageUrl || null;
}

const TIER_LABEL: Record<string, string> = { 'MUST DO': 'Must do', 'COULD DO': 'Could do', ENRICHMENT: 'Enrichment' };

// Preview of a generated quiz, one card at a time (mockup: "Assignment Review
// (Before Publishing)"): numbered stepper + score pill, the question with its
// picture, an answer box or options, Check / Hint, then Previous / Next.
// Check reveals the answer key, so a reviewer can try each question and see
// at once where the AI left an answer missing or wrong.
export function QuizReviewStepper({ quiz, t, layout, onEdit, onRegenerate }: {
  quiz: any;
  t: Colors;
  layout: Layout;
  onEdit: () => void;
  onRegenerate?: () => void;
  onOpenInTab?: () => void;
}) {
  const items = React.useMemo(() => buildReviewItems(quiz), [quiz]);
  const [index, setIndex] = React.useState(0);
  const [responses, setResponses] = React.useState<Record<number, Response>>({});
  const [nextFocused, setNextFocused] = React.useState(false);
  const stepperRef = React.useRef<ScrollView>(null);
  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const item = items[safeIndex];
  const resp = responses[safeIndex] || {};
  const setResp = (patch: Partial<Response>) => setResponses(r => ({ ...r, [safeIndex]: { ...r[safeIndex], ...patch } }));

  const scored = items.filter(i => i.kind !== 'missing').length;
  const correct = Object.entries(responses).filter(([k, v]) => v.result === 'correct' && items[Number(k)]?.kind !== 'missing').length;
  const go = React.useCallback((to: number) => setIndex(Math.max(0, Math.min(items.length - 1, to))), [items.length]);

  // Keyboard / TV remote: ← → move between questions (not while typing).
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.addEventListener !== 'function') return undefined;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'ArrowRight') go(safeIndex + 1);
      else if (e.key === 'ArrowLeft') go(safeIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, safeIndex]);

  // Keep the current step visible in the stepper row.
  React.useEffect(() => {
    const step = layout.isMobile ? 34 : layout.isTV ? 64 : 48;
    stepperRef.current?.scrollTo?.({ x: Math.max(0, safeIndex * step - step * 2), animated: true });
  }, [safeIndex, layout.isMobile, layout.isTV]);

  const title = cleanTitle(quiz?.title || quiz?.chapter || 'Interactive Quiz');

  if (!items.length) {
    return (
      <View testID="review-empty" style={{ alignItems: 'center', padding: 32, gap: 12 }}>
        <Feather name="file-minus" size={32} color={t.textMuted} />
        <Text style={{ fontSize: layout.fs(17), fontWeight: '700', color: t.textMain, textAlign: 'center' }}>No questions were generated for “{title}”.</Text>
        <Text style={{ fontSize: layout.fs(14), color: t.textMuted, textAlign: 'center', maxWidth: 520 }}>
          Generate it again from the worksheet, or add questions yourself in Edit.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {onRegenerate && <PillButton t={t} layout={layout} icon="refresh-cw" label="Retry generation" onPress={onRegenerate} primary testID="review-empty-retry" />}
          <PillButton t={t} layout={layout} icon="edit-2" label="Open Edit" onPress={onEdit} testID="review-empty-edit" />
        </View>
      </View>
    );
  }

  const circle = layout.isMobile ? 28 : layout.isTV ? 48 : 36;
  const gap = layout.isMobile ? 6 : layout.isTV ? 16 : 12;

  return (
    <View style={{ gap: layout.isMobile ? 14 : 18 }}>
      {/* Stepper + score */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <ScrollView ref={stepperRef} horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 4 }}>
          {items.map((it, i) => {
            const r = responses[i]?.result;
            const current = i === safeIndex;
            const needsKey = itemNeedsKey(it);
            const bg = current ? t.primary : r === 'correct' ? (t.tintMint || t.surfaceSubtle) : r === 'incorrect' ? (t.tintPeach || t.surfaceSubtle) : t.cardDark;
            const fg = current ? t.onPrimary : r === 'correct' ? t.accentGreen : r === 'incorrect' ? t.accentRed : t.textMain;
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {i > 0 && <View style={{ width: gap, height: 2, backgroundColor: t.borderColor }} />}
                <TouchableOpacity
                  testID={`review-step-${i + 1}`}
                  onPress={() => go(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Question ${i + 1}${needsKey ? ', needs an answer' : ''}${r === 'correct' ? ', correct' : ''}`}
                  accessibilityState={{ selected: current }}
                  style={{
                    width: circle, height: circle, borderRadius: circle / 2, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: bg, borderWidth: current ? 0 : 1.5, borderColor: needsKey ? t.accentOrange : t.borderColor,
                    ...(current && Platform.OS === 'web' ? { boxShadow: `0 0 0 4px ${t.primaryGlow || 'rgba(7,93,117,0.15)'}` } as any : null),
                  }}
                >
                  <Text style={{ fontSize: layout.fs(layout.isMobile ? 12 : 14), fontWeight: '700', color: fg }}>{i + 1}</Text>
                  {needsKey && !current && (
                    <View style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: 5, backgroundColor: t.accentOrange, borderWidth: 1.5, borderColor: t.cardDark }} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
        <View
          testID="review-score"
          accessibilityLabel={`Score ${correct} of ${scored}`}
          style={{ paddingHorizontal: layout.isMobile ? 10 : 14, minHeight: circle, borderRadius: 999, justifyContent: 'center', backgroundColor: t.tintMint || t.surfaceSubtle, borderWidth: 1, borderColor: t.borderColor }}
        >
          <Text style={{ fontSize: layout.fs(14), fontWeight: '800', color: t.accentGreen }}>{correct}/{scored}</Text>
        </View>
      </View>

      {/* The card */}
      <View
        testID="review-card"
        style={{
          backgroundColor: t.cardDark, borderRadius: 16, borderWidth: 1, borderColor: t.borderColor,
          padding: layout.isMobile ? 16 : layout.isTV ? 32 : 24, gap: layout.isMobile ? 14 : 18,
          ...(Platform.OS === 'web' ? { boxShadow: '0 1px 2px rgba(16,24,40,0.06), 0 4px 16px rgba(16,24,40,0.06)' } as any : null),
        }}
      >
        <TaskHeader item={item} t={t} layout={layout} position={`${safeIndex + 1} of ${items.length}`} />
        {item.kind === 'question' && <QuestionBody item={item} resp={resp} setResp={setResp} t={t} layout={layout} onEdit={onEdit} />}
        {item.kind === 'table' && <TableBody item={item} resp={resp} setResp={setResp} t={t} layout={layout} onEdit={onEdit} />}
        {item.kind === 'missing' && <MissingBody item={item} t={t} layout={layout} onEdit={onEdit} onRegenerate={onRegenerate} />}

        {/* Previous / Next */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: t.borderColor, paddingTop: layout.isMobile ? 14 : 18 }}>
          <TouchableOpacity
            testID="review-prev"
            onPress={() => go(safeIndex - 1)}
            disabled={safeIndex === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous question"
            style={{ minHeight: layout.isTV ? 54 : 44, paddingHorizontal: 16, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.surfaceSubtle, borderWidth: 1, borderColor: t.borderColor, opacity: safeIndex === 0 ? 0.45 : 1 }}
          >
            <Feather name="chevron-left" size={layout.fs(18)} color={t.textMain} />
            <Text style={{ fontSize: layout.fs(15), fontWeight: '600', color: t.textMain }}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="review-next"
            onPress={() => go(safeIndex + 1)}
            disabled={safeIndex >= items.length - 1}
            onFocus={() => setNextFocused(true)}
            onBlur={() => setNextFocused(false)}
            accessibilityRole="button"
            accessibilityLabel="Next question"
            style={{
              minHeight: layout.isTV ? 54 : 44, paddingHorizontal: layout.isTV ? 26 : 18, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: t.primary, opacity: safeIndex >= items.length - 1 ? 0.45 : 1,
              borderWidth: 2, borderColor: (layout.isTV || nextFocused) && safeIndex < items.length - 1 ? t.cardDark : t.primary,
              ...((layout.isTV || nextFocused) && safeIndex < items.length - 1 && Platform.OS === 'web'
                ? { boxShadow: `0 0 0 3px ${t.primary}, 0 0 18px ${t.primaryGlow || 'rgba(7,93,117,0.35)'}` } as any : null),
            }}
          >
            <Text style={{ fontSize: layout.fs(15), fontWeight: '700', color: t.onPrimary }}>Next</Text>
            <Feather name="chevron-right" size={layout.fs(18)} color={t.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function TaskHeader({ item, t, layout, position }: { item: ReviewItem; t: Colors; layout: Layout; position: string }) {
  const { label, text } = splitTaskTitle(item.task?.title);
  const tier = TIER_LABEL[String(item.task?.tier || '').toUpperCase()] || '';
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!!tier && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: t.surfaceSubtle }}>
            <Text style={{ fontSize: layout.fs(11), fontWeight: '800', letterSpacing: 0.8, color: t.textMuted, textTransform: 'uppercase' }}>{tier}</Text>
          </View>
        )}
        <Text style={{ fontSize: layout.fs(12), color: t.textMuted, fontWeight: '600' }}>{label ? `${label} · ` : ''}Question {position}</Text>
      </View>
      {!!text && item.kind === 'question' && (
        <Text style={{ fontSize: layout.fs(14), color: t.textMuted, lineHeight: layout.fs(20) }}>{text}</Text>
      )}
    </View>
  );
}

function Picture({ url, t, layout }: { url: string | null; t: Colors; layout: Layout }) {
  if (!url) return null;
  const h = layout.isMobile ? 190 : layout.isTV ? 300 : 220;
  return (
    <View testID="review-picture" style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: t.borderColor, backgroundColor: '#fff', padding: 8 }}>
      <Image source={{ uri: imgUri(url) }} style={{ width: '100%', height: h }} resizeMode="contain" accessibilityLabel="Worksheet picture for this question" />
    </View>
  );
}

function QuestionBody({ item, resp, setResp, t, layout, onEdit }: {
  item: Extract<ReviewItem, { kind: 'question' }>; resp: Response; setResp: (p: Partial<Response>) => void; t: Colors; layout: Layout; onEdit: () => void;
}) {
  const q = item.question || {};
  const options: any[] = q.type === 'mcq' && Array.isArray(q.options) ? q.options : [];
  const keyIdx = options.length ? correctOptionIndex(q) : -1;
  const label = q.id ? `${q.id})` : '';
  const questionText = String(q.question ?? '').trim();
  const showPassage = item.questionIndex === 0 && item.task?.passage;
  const onCheck = () => setResp({ result: checkAnswer(q, resp.text || '', resp.option) });
  const answerKey = options.length ? (keyIdx >= 0 ? optionLabel(options[keyIdx]) : '') : answerToEditText(q.answer);
  return (
    <>
      {showPassage && (
        <View style={{ padding: 14, borderRadius: 10, backgroundColor: t.surfaceSubtle, borderWidth: 1, borderColor: t.borderColor }}>
          <Text style={{ fontSize: layout.fs(14), color: t.textMain, lineHeight: layout.fs(22) }}>{item.task.passage}</Text>
        </View>
      )}
      <Text testID="review-question" style={{ fontSize: layout.fs(layout.isMobile ? 18 : 21), fontWeight: '700', color: t.textHeading, lineHeight: layout.fs(layout.isMobile ? 25 : 29) }}>
        {label ? `${label} ` : ''}{questionText || 'This question has no text yet.'}
      </Text>
      <Picture url={itemPicture(item)} t={t} layout={layout} />
      {q.type === 'venn' || (Array.isArray(item.task?.pyramids) && item.task.pyramids.length) ? (
        <InfoNote t={t} layout={layout} icon="layers" text="This question is answered on a diagram — use Open in Tab to try it as students will see it." />
      ) : options.length ? (
        <View style={{ gap: 10 }} accessibilityRole="radiogroup">
          {options.map((o, oi) => {
            const selected = resp.option === oi;
            const checked = resp.result && resp.result !== 'empty';
            const isKey = checked && oi === keyIdx;
            const isWrongPick = checked && selected && oi !== keyIdx;
            return (
              <TouchableOpacity
                key={oi}
                testID={`review-option-${oi}`}
                onPress={() => setResp({ option: oi, result: undefined })}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: layout.isTV ? 56 : 48, paddingHorizontal: 14, borderRadius: 10,
                  borderWidth: selected || isKey ? 2 : 1,
                  borderColor: isKey ? t.accentGreen : isWrongPick ? t.accentRed : selected ? t.primary : t.borderColor,
                  backgroundColor: selected ? (t.tintBlue || t.surfaceSubtle) : t.cardDark,
                }}
              >
                <Feather name={selected ? 'check-circle' : 'circle'} size={layout.fs(18)} color={selected ? t.primary : t.textMuted} />
                <Text style={{ flex: 1, fontSize: layout.fs(15), color: t.textMain }}>{optionLabel(o)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TextInput
            testID="review-answer-input"
            value={resp.text || ''}
            onChangeText={(v) => setResp({ text: v, result: undefined })}
            placeholder="Type your answer here..."
            placeholderTextColor={t.textDim}
            multiline={q.type === 'text'}
            accessibilityLabel="Your answer"
            style={{
              flex: 1, minHeight: q.type === 'text' ? (layout.isTV ? 110 : 88) : (layout.isTV ? 56 : 48),
              borderWidth: 1.5, borderColor: t.borderColor, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
              fontSize: layout.fs(15), color: t.textMain, backgroundColor: t.surfaceSubtle, textAlignVertical: 'top',
            }}
          />
          {!!q.unit && <Text style={{ fontSize: layout.fs(15), color: t.textMuted }}>{q.unit}</Text>}
        </View>
      )}
      <CheckHintRow t={t} layout={layout} onCheck={onCheck} hintShown={!!resp.hint} onHint={() => setResp({ hint: !resp.hint })} />
      {resp.hint && <HintBox t={t} layout={layout} hint={q.hint} />}
      <Feedback result={resp.result} answerKey={answerKey} solution={q.solution} t={t} layout={layout} onEdit={onEdit} />
    </>
  );
}

function TableBody({ item, resp, setResp, t, layout, onEdit }: {
  item: Extract<ReviewItem, { kind: 'table' }>; resp: Response; setResp: (p: Partial<Response>) => void; t: Colors; layout: Layout; onEdit: () => void;
}) {
  const tbl = item.table;
  const headers: string[] = tbl.headers || [];
  const ncols = Math.max(headers.length, ...tbl.rows.map((r: any[]) => (r || []).length));
  const cells = resp.cells || {};
  const checked = resp.result && resp.result !== 'empty';
  const keyText = tbl.rows.map((row: any[]) => (row || []).map((c: any) => String(c?.input ? (c?.answer ?? '?') : (c?.text ?? ''))).join(' · ')).join('\n');
  return (
    <>
      <Text testID="review-question" style={{ fontSize: layout.fs(layout.isMobile ? 18 : 21), fontWeight: '700', color: t.textHeading }}>
        {splitTaskTitle(item.task?.title).text || 'Fill in the table'}
      </Text>
      <Picture url={itemPicture(item)} t={t} layout={layout} />
      <ScrollView horizontal contentContainerStyle={{ minWidth: '100%' }}>
        <View style={{ borderWidth: 1, borderColor: t.borderColor, borderRadius: 10, overflow: 'hidden', minWidth: Math.max(ncols * 110, 280), flex: 1 }}>
          {headers.length > 0 && (
            <View style={{ flexDirection: 'row', backgroundColor: t.surfaceSubtle }}>
              {Array.from({ length: ncols }).map((_, hi) => (
                <Text key={hi} style={{ flex: 1, padding: 10, fontSize: layout.fs(13), fontWeight: '700', color: t.textMain, textAlign: 'center' }}>{String(headers[hi] ?? '')}</Text>
              ))}
            </View>
          )}
          {tbl.rows.map((row: any[], ri: number) => (
            <View key={ri} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.borderColor }}>
              {Array.from({ length: ncols }).map((_, ci) => {
                const cell = (row || [])[ci] || {};
                const k = `${ri}:${ci}`;
                if (!cell.input) {
                  return (
                    <View key={ci} style={{ flex: 1, padding: 10, justifyContent: 'center' }}>
                      <Text style={{ fontSize: layout.fs(14), color: t.textMain, textAlign: 'center' }}>{String(cell.text ?? cell.answer ?? '')}</Text>
                    </View>
                  );
                }
                const right = checked && checkAnswer({ type: 'text', answer: cell.answer }, cells[k] || '') === 'correct';
                return (
                  <View key={ci} style={{ flex: 1, padding: 6 }}>
                    <TextInput
                      testID={`review-cell-${ri}-${ci}`}
                      value={cells[k] || ''}
                      onChangeText={(v) => setResp({ cells: { ...cells, [k]: v }, result: undefined })}
                      placeholder="?"
                      placeholderTextColor={t.textDim}
                      style={{ minHeight: 40, borderWidth: 1.5, borderRadius: 8, borderColor: checked ? (right ? t.accentGreen : t.accentRed) : t.borderColor, textAlign: 'center', fontSize: layout.fs(14), color: t.textMain, backgroundColor: t.surfaceSubtle }}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <CheckHintRow t={t} layout={layout} onCheck={() => setResp({ result: checkTable(tbl, cells) })} hintShown={!!resp.hint} onHint={() => setResp({ hint: !resp.hint })} />
      {resp.hint && <HintBox t={t} layout={layout} hint={item.task?.hint || item.task?.instructions} />}
      <Feedback result={resp.result} answerKey={keyText} t={t} layout={layout} onEdit={onEdit} />
    </>
  );
}

function MissingBody({ item, t, layout, onEdit, onRegenerate }: {
  item: Extract<ReviewItem, { kind: 'missing' }>; t: Colors; layout: Layout; onEdit: () => void; onRegenerate?: () => void;
}) {
  const title = cleanTitle(item.task?.title) || `Task ${item.taskIndex + 1}`;
  return (
    <View testID="review-missing" style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Feather name="alert-triangle" size={layout.fs(20)} color={t.accentOrange} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontSize: layout.fs(18), fontWeight: '700', color: t.textHeading }}>{title}</Text>
          <Text style={{ fontSize: layout.fs(14), color: t.textMuted, lineHeight: layout.fs(21) }}>
            No questions were generated for this task{item.reason ? ` — ${item.reason.replace(/^No content could be extracted or generated for this task from the source document\.?/, 'the AI could not read it from the worksheet.')}` : '.'}
            {' '}Students would see an empty task, so add its questions in Edit or generate the quiz again.
          </Text>
        </View>
      </View>
      <Picture url={itemPicture(item)} t={t} layout={layout} />
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <PillButton t={t} layout={layout} icon="edit-2" label="Add questions in Edit" onPress={onEdit} primary testID="review-missing-edit" />
        {onRegenerate && <PillButton t={t} layout={layout} icon="refresh-cw" label="Retry generation" onPress={onRegenerate} testID="review-missing-retry" />}
      </View>
    </View>
  );
}

function CheckHintRow({ t, layout, onCheck, onHint, hintShown }: { t: Colors; layout: Layout; onCheck: () => void; onHint: () => void; hintShown: boolean }) {
  const h = layout.isTV ? 54 : 44;
  return (
    <View style={{ flexDirection: 'row', gap: 12, justifyContent: layout.isMobile ? 'flex-start' : 'center', flexWrap: 'wrap' }}>
      <TouchableOpacity testID="review-check" onPress={onCheck} accessibilityRole="button" style={{ minHeight: h, minWidth: 120, paddingHorizontal: 22, borderRadius: 10, backgroundColor: t.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Feather name="check" size={layout.fs(17)} color={t.onPrimary} />
        <Text style={{ fontSize: layout.fs(15), fontWeight: '700', color: t.onPrimary }}>Check</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="review-hint" onPress={onHint} accessibilityRole="button" accessibilityState={{ expanded: hintShown }} style={{ minHeight: h, minWidth: 110, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1.5, borderColor: t.accentOrange, backgroundColor: hintShown ? (t.tintPeach || t.surfaceSubtle) : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Feather name="help-circle" size={layout.fs(17)} color={t.accentOrange} />
        <Text style={{ fontSize: layout.fs(15), fontWeight: '700', color: t.accentOrange }}>Hint</Text>
      </TouchableOpacity>
    </View>
  );
}

function HintBox({ t, layout, hint }: { t: Colors; layout: Layout; hint?: string }) {
  return (
    <View testID="review-hint-text" style={{ padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: t.accentOrange, backgroundColor: t.tintPeach || t.surfaceSubtle }}>
      <Text style={{ fontSize: layout.fs(14), color: hint ? t.textMain : t.textMuted, lineHeight: layout.fs(21) }}>
        {hint ? String(hint) : 'No hint for this question — add one in Edit.'}
      </Text>
    </View>
  );
}

function Feedback({ result, answerKey, solution, t, layout, onEdit }: { result?: CheckResult; answerKey: string; solution?: string; t: Colors; layout: Layout; onEdit: () => void }) {
  if (!result) return null;
  const tone = result === 'correct' ? { c: t.accentGreen, bg: t.tintMint, icon: 'check-circle' as const, msg: 'Correct!' }
    : result === 'incorrect' ? { c: t.accentRed, bg: t.tintPeach, icon: 'x-circle' as const, msg: 'Not quite.' }
    : result === 'open' ? { c: t.primary, bg: t.tintBlue, icon: 'book-open' as const, msg: 'Compare with the model answer.' }
    : result === 'no-key' ? { c: t.accentOrange, bg: t.tintPeach, icon: 'alert-triangle' as const, msg: 'This question has no answer key yet, so students can’t be marked on it.' }
    : { c: t.textMuted, bg: t.surfaceSubtle, icon: 'edit-3' as const, msg: 'Type or choose an answer first.' };
  return (
    <View testID={`review-feedback-${result}`} accessibilityLiveRegion="polite" style={{ padding: 14, borderRadius: 10, backgroundColor: tone.bg || t.surfaceSubtle, borderWidth: 1, borderColor: tone.c, gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Feather name={tone.icon} size={layout.fs(17)} color={tone.c} />
        <Text style={{ fontSize: layout.fs(15), fontWeight: '700', color: tone.c, flexShrink: 1 }}>{tone.msg}</Text>
      </View>
      {result !== 'empty' && result !== 'no-key' && !!answerKey && (
        <Text style={{ fontSize: layout.fs(14), color: t.textMain, lineHeight: layout.fs(21) }}>
          <Text style={{ fontWeight: '700' }}>Answer: </Text>{answerKey}
        </Text>
      )}
      {result !== 'empty' && !!solution && result !== 'no-key' && (
        <Text style={{ fontSize: layout.fs(13), color: t.textMuted, lineHeight: layout.fs(20) }}>{String(solution)}</Text>
      )}
      {result === 'no-key' && (
        <TouchableOpacity testID="review-add-answer" onPress={onEdit} accessibilityRole="button" style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 36 }}>
          <Feather name="edit-2" size={14} color={t.primary} />
          <Text style={{ fontSize: layout.fs(14), fontWeight: '700', color: t.primary }}>Add the answer in Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoNote({ t, layout, icon, text }: { t: Colors; layout: Layout; icon: React.ComponentProps<typeof Feather>['name']; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, backgroundColor: t.surfaceSubtle }}>
      <Feather name={icon} size={16} color={t.textMuted} />
      <Text style={{ flex: 1, fontSize: layout.fs(14), color: t.textMuted }}>{text}</Text>
    </View>
  );
}

export function PillButton({ t, layout, icon, label, onPress, primary, testID }: {
  t: Colors; layout: Layout; icon: React.ComponentProps<typeof Feather>['name']; label: string; onPress: () => void; primary?: boolean; testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      style={{ minHeight: layout.isTV ? 52 : 42, paddingHorizontal: 16, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: primary ? t.primary : t.cardDark, borderWidth: 1, borderColor: primary ? t.primary : t.borderColor }}
    >
      <Feather name={icon} size={layout.fs(15)} color={primary ? t.onPrimary : t.textMain} />
      <Text style={{ fontSize: layout.fs(14), fontWeight: '700', color: primary ? t.onPrimary : t.textMain }}>{label}</Text>
    </TouchableOpacity>
  );
}
