/**
 * Ask Aivorah for one wrong question of one test report.
 *   Explain This Question — explanation first: Explain Again, Explain Another
 *     Way, Give Me a Practice Question, Next Wrong Question.
 *   Practise This Skill — a fresh question first (a memory check when the
 *     student comes back a week or more later), as many as they ask for.
 * Typed messages like "explain it another way" or "give me another question"
 * do the same. Everything shown comes from the server's saved state.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import ActivityIndicator from '../../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import ReasoningBox from '../../../../../components/common/ReasoningBox';
import { useQuestionCoach, type CoachMode } from '../hooks/useQuestionCoach';

const GOOD = new Set(['independent', 'assisted']);

export default function QuestionCoach({ attemptId, questionIndex, mode, lessonText, colors, onBackToReport }: {
  attemptId: string;
  questionIndex: number;
  mode: CoachMode;
  lessonText?: string;
  colors: AppColors;
  onBackToReport?: (attemptId: string) => void;
}) {
  const c = useQuestionCoach({ attemptId, questionIndex, mode, lessonText });
  const gold = colors.accentYellow;
  const green = colors.accentGreen;
  const [choice, setChoice] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [clarification, setClarification] = useState('');
  const [working, setWorking] = useState('');
  const [message, setMessage] = useState('');

  const q = c.practice?.question || null;
  // A new question clears the inputs (they stay after a failed submit).
  const [shownQ, setShownQ] = useState<string | undefined>(q?.id);
  if (shownQ !== q?.id) { setShownQ(q?.id); setChoice(null); setTyped(''); setReasoning(''); setWorking(''); }

  const position = c.wrong.findIndex((w) => w.index === c.index);
  const canSubmit = !!q && (q.type === 'mcq' ? choice !== null : typed.trim().length > 0) && !c.busy;
  const btn = (label: string, onPress: () => unknown, testID: string, primary = false, disabled = false) => (
    <TouchableOpacity key={testID} onPress={onPress} disabled={disabled || !!c.busy} accessibilityRole="button" testID={testID}
      style={[styles.btn, primary ? { backgroundColor: gold } : { borderWidth: 1.5, borderColor: gold }, (disabled || c.busy) && { opacity: 0.6 }]}>
      <Text style={[styles.btnText, { color: primary ? '#FFFFFF' : gold }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap} testID="question-coach">
      {/* Header: which action, which wrong question */}
      <View style={[styles.head, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>
          {c.mode === 'explain' ? 'Explain This Question' : 'Practise This Skill'}
          {c.wrong.length > 1 && position >= 0 ? ` · Wrong question ${position + 1} of ${c.wrong.length}` : ''}
        </Text>
        <Text style={[styles.title, { color: colors.textMain }]} testID="coach-skill">
          {c.explain?.skillLabel || c.practice?.skillLabel || (c.wrong[position]?.question ?? 'Your question')}
        </Text>
      </View>

      {!!c.busy && !c.explain && !c.practice && (
        <View style={styles.center}><ActivityIndicator color={gold} /><Text style={[styles.muted, { color: colors.textMuted }]}>Aivorah is getting this ready…</Text></View>
      )}

      {!!c.error && (
        <View style={[styles.banner, { backgroundColor: '#C98A8A18', borderColor: '#C98A8A60' }]} testID="coach-error" accessibilityLiveRegion="polite">
          <Text style={[styles.body, { color: colors.textMain }]}>{c.error}</Text>
          {btn('Try again', c.retry, 'coach-retry')}
        </View>
      )}

      {/* ── Explain mode ── */}
      {c.mode === 'explain' && !!c.explain && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="coach-explanation">
          <Text style={[styles.kicker, { color: colors.textMuted }]}>The question</Text>
          <Text style={[styles.question, { color: colors.textMain }]}>{c.explain.question.text}</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>Your answer: {c.explain.question.yourAnswer || '—'} · Correct answer: {c.explain.question.correctAnswer}</Text>
          <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />
          <Text style={[styles.kicker, { color: colors.textMuted }]}>{c.explain.explanation.methodName || 'Explanation'}</Text>
          <Text style={[styles.subTitle, { color: colors.textMain }]}>{c.explain.explanation.title}</Text>
          <Text style={[styles.body, { color: colors.textMain }]}>{c.explain.explanation.body}</Text>
          {(c.explain.explanation.steps || []).map((s, i) => (
            <Text key={i} style={[styles.body, { color: colors.textMain }]}>{i + 1}. {s}</Text>
          ))}
          {!!c.explain.explanation.table && (
            <View style={[styles.table, { borderColor: colors.borderColor }]}>
              {c.explain.explanation.table.map((row, r) => (
                <View key={r} style={[styles.tableRow, r > 0 && { borderTopWidth: 1, borderColor: colors.borderColor }]}>
                  {row.map((cell, k) => <Text key={k} style={[styles.tableCell, { color: colors.textMain, fontWeight: r === 0 ? '800' : '400' }]}>{cell}</Text>)}
                </View>
              ))}
            </View>
          )}
          {!!c.explain.explanation.example && <Text style={[styles.body, { color: colors.textMain }]}>• <Text style={{ fontWeight: '800' }}>Example:</Text> {c.explain.explanation.example}</Text>}
          <View style={styles.actions}>
            {btn('Explain Again', c.explainAgain, 'coach-explain-again')}
            {btn('Explain Another Way', c.explainAnotherWay, 'coach-explain-another-way')}
            {btn('Give Me a Practice Question', c.practiceQuestion, 'coach-practice', true)}
            {c.nextWrongIndex != null && btn('Next Wrong Question', c.nextWrong, 'coach-next-wrong')}
          </View>
        </View>
      )}

      {/* ── Practice mode ── */}
      {c.mode === 'practice' && !!c.practice?.memoryCheck && !!q && (
        <View style={[styles.banner, { backgroundColor: gold + '14', borderColor: gold + '50' }]} testID="coach-memory-check">
          <Text style={[styles.body, { color: colors.textMain }]}>
            Memory check{c.practice.memoryCheck.daysSince ? ` — it has been ${c.practice.memoryCheck.daysSince} days` : ''}. Try this one on your own first.
          </Text>
        </View>
      )}

      {!!c.result && (
        <View testID="coach-result" accessibilityLiveRegion="polite"
          style={[styles.banner, GOOD.has(c.result.code) ? { backgroundColor: green + '18', borderColor: green + '50' } : { backgroundColor: gold + '14', borderColor: gold + '50' }]}>
          <View style={styles.row}>
            <Feather name={GOOD.has(c.result.code) ? 'check-circle' : 'info'} size={18} color={GOOD.has(c.result.code) ? green : gold} />
            <Text style={[styles.resultText, { color: colors.textMain }]}>{c.result.message}</Text>
          </View>
          {c.result.code === 'incorrect' && !!c.result.correctAnswer && (
            <Text style={[styles.muted, { color: colors.textMuted }]}>Correct answer: {c.result.correctAnswer}</Text>
          )}
          {c.result.code === 'incorrect' && !c.workingFeedback && (
            <View style={{ gap: 6 }}>
              <ReasoningBox value={working} onChangeText={setWorking} label="Show one step of your working" placeholder="e.g. I found the LCM of 4 and 6…" testID="coach-working" />
              {btn('Check My Step', () => c.sendWorking(working.trim()), 'coach-working-submit', false, !working.trim())}
            </View>
          )}
          {!!c.workingFeedback && <Text style={[styles.body, { color: colors.textMain }]} testID="coach-working-feedback">{c.workingFeedback}</Text>}
        </View>
      )}

      {!!c.solution && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="coach-solution">
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Solution</Text>
          <Text style={[styles.body, { color: colors.textMain }]}>{c.solution}</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>This one counts as practice with the solution shown.</Text>
        </View>
      )}

      {c.mode === 'practice' && !!c.practice?.clarification && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="coach-clarification">
          <Text style={[styles.question, { color: colors.textMain }]}>{c.practice.clarification.question.question}</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>Your answer: {c.practice.clarification.yourAnswer}</Text>
          <Text style={[styles.body, { color: colors.textMain }]}>{c.practice.clarification.prompt}</Text>
          <ReasoningBox value={clarification} onChangeText={setClarification} label="Why is that the answer?" placeholder="Explain in your own words…" testID="coach-clarification-box" />
          {btn('Submit Explanation', () => c.submitClarification(clarification.trim()), 'coach-clarification-submit', true, !clarification.trim())}
        </View>
      )}

      {c.mode === 'practice' && !!q && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="coach-question">
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Fresh question · {q.levelName}</Text>
          <Text style={[styles.question, { color: colors.textMain }]} accessibilityRole="header">{q.question}</Text>
          {q.type === 'mcq' ? (
            <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
              {(q.options || []).map((opt, i) => {
                const on = choice === i;
                return (
                  <TouchableOpacity key={i} onPress={() => setChoice(i)} style={[styles.option, { borderColor: on ? gold : colors.borderColor, backgroundColor: on ? gold + '14' : 'transparent' }]}
                    accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={opt} testID={`coach-option-${i}`}>
                    <Feather name={on ? 'check-circle' : 'circle'} size={18} color={on ? gold : colors.textMuted} />
                    <Text style={[styles.optionText, { color: colors.textMain }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TextInput value={typed} onChangeText={setTyped} placeholder="Type your answer" placeholderTextColor={colors.textMuted} maxLength={120}
              style={[styles.input, { color: colors.textMain, borderColor: colors.borderColor }]} accessibilityLabel="Your answer" testID="coach-fill-input" />
          )}
          {!!c.hint && <View style={[styles.banner, { backgroundColor: gold + '12', borderColor: gold + '50' }]} testID="coach-hint"><Text style={[styles.body, { color: colors.textMain }]}>Hint: {c.hint}</Text></View>}
          <ReasoningBox value={reasoning} onChangeText={setReasoning} label={q.reasoningPrompt} placeholder="Your reason or one working step…" testID="coach-reasoning" />
          {btn('Submit Answer', () => c.submitAnswer(q.type === 'mcq' ? (choice as number) : typed.trim(), reasoning.trim()), 'coach-submit', true, !canSubmit)}
          <View style={styles.links}>
            {!c.hint && <TouchableOpacity onPress={c.showHint} disabled={!!c.busy} accessibilityRole="button" testID="coach-hint-btn"><Text style={[styles.link, { color: gold }]}>Need a hint?</Text></TouchableOpacity>}
            <TouchableOpacity onPress={c.showSolution} disabled={!!c.busy} accessibilityRole="button" testID="coach-solution-btn"><Text style={[styles.link, { color: colors.textMuted }]}>Show me the solution</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {c.mode === 'practice' && !!c.practice && !c.practice.clarification && (
        <View style={styles.actions}>
          {btn(q ? 'Skip — Give Me Another Question' : 'Give Me Another Question', c.nextQuestion, 'coach-next-question', !q)}
          {btn('Explain This Question', c.explainThis, 'coach-explain-this')}
          {c.nextWrongIndex != null && btn('Next Wrong Question', c.nextWrong, 'coach-next-wrong')}
        </View>
      )}

      {/* Natural messages: "explain it another way", "give me another question"… */}
      <View style={[styles.msgRow, { borderColor: colors.borderColor }]}>
        <TextInput value={message} onChangeText={setMessage} placeholder={c.mode === 'explain' ? 'Ask Aivorah (e.g. “explain it another way”)' : 'Ask Aivorah (e.g. “give me another question”)'}
          placeholderTextColor={colors.textMuted} style={[styles.msgInput, { color: colors.textMain }]} maxLength={300}
          accessibilityLabel="Message Aivorah" testID="coach-message" />
        <TouchableOpacity onPress={async () => { const t = message.trim(); if (!t) return; setMessage(''); await c.sendMessage(t); }}
          accessibilityRole="button" accessibilityLabel="Send" disabled={!message.trim() || !!c.busy} testID="coach-message-send">
          <Feather name="send" size={18} color={message.trim() ? gold : colors.textMuted} />
        </TouchableOpacity>
      </View>
      {!!c.reply && <Text style={[styles.muted, { color: colors.textMuted }]} testID="coach-reply">{c.reply}</Text>}
      {!!c.busy && (!!c.explain || !!c.practice) && <ActivityIndicator color={gold} />}

      {!!onBackToReport && (
        <TouchableOpacity onPress={() => onBackToReport(attemptId)} accessibilityRole="button" testID="coach-back-to-report">
          <Text style={[styles.link, { color: gold, textAlign: 'center' }]}>Back to Test Report</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, width: '100%', maxWidth: 760 },
  center: { alignItems: 'center', gap: 8, padding: 20 },
  head: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 2 },
  kicker: { fontSize: 12.5, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800' },
  subTitle: { fontSize: 16, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  divider: { height: 1, marginVertical: 2 },
  question: { fontSize: 17, fontWeight: '800', lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  muted: { fontSize: 13, lineHeight: 19 },
  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row' },
  tableCell: { flex: 1, padding: 8, fontSize: 13.5, lineHeight: 19 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center', flexGrow: 1 },
  btnText: { fontSize: 14.5, fontWeight: '800' },
  banner: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultText: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  optionText: { flex: 1, fontSize: 15, lineHeight: 21 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  links: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  link: { fontSize: 13.5, fontWeight: '700', paddingVertical: 4 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10 },
  msgInput: { flex: 1, paddingVertical: 9, fontSize: 14 },
});
