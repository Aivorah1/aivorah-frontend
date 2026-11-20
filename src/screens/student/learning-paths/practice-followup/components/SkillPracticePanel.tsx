/**
 * Ask Aivorah → Practise This Skill. Teaches one curriculum skill (with an
 * Explain Another Way button), then checks understanding with fresh
 * questions, one at a time: an MCQ or a fill in the blank, each with a
 * "Why did you…?" box (the shared ReasoningBox). Two correct answers in a row,
 * on your own and with sound reasoning, complete it. All rules run on the server.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import ReasoningBox from '../../../../../components/common/ReasoningBox';
import { useSkillPractice } from '../hooks/useSkillPractice';
import type { ResultView, Teaching } from '../types';

const RESULT_TONE: Record<ResultView['code'], 'good' | 'info' | 'warn'> = {
  independent: 'good', assisted: 'good', clarify: 'info', solution: 'info', incorrect: 'warn', misconception: 'warn', unclear: 'warn',
};

export default function SkillPracticePanel({ followupId, colors, onBackToReport, onGoToLearn }: {
  followupId: string;
  colors: AppColors;
  onBackToReport: (attemptId: string) => void;
  onGoToLearn?: () => void;
}) {
  const p = useSkillPractice(followupId);
  const [choice, setChoice] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [clarification, setClarification] = useState('');
  const [message, setMessage] = useState('');
  const gold = colors.accentYellow;
  const green = colors.accentGreen;
  const s = p.session;
  const qid = s?.question?.id;

  // New question → clear the inputs (they stay after a failed submit).
  // Adjusted during render (React's "reset state when a prop changes" pattern).
  const [shownQid, setShownQid] = useState(qid);
  if (shownQid !== qid) { setShownQid(qid); setChoice(null); setTyped(''); setReasoning(''); }
  const clarQid = s?.clarification?.questionId;
  const [shownClarQid, setShownClarQid] = useState(clarQid);
  if (shownClarQid !== clarQid) { setShownClarQid(clarQid); setClarification(''); }

  if (p.loading && !s) {
    return <View style={styles.center}><ActivityIndicator color={gold} /><Text style={[styles.muted, { color: colors.textMuted }]}>Loading your practice…</Text></View>;
  }
  if (!s) {
    return (
      <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="skill-practice-load-error">
        <Text style={[styles.body, { color: colors.textMain }]}>{p.loadError || 'Could not open this practice.'}</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: gold }]} onPress={p.reload} accessibilityRole="button"><Text style={styles.btnText}>Try again</Text></TouchableOpacity>
      </View>
    );
  }

  const q = s.question;
  const canSubmit = !!q && (q.type === 'mcq' ? choice !== null : typed.trim().length > 0) && !p.busy;
  const checkNumber = Math.min(s.progress.confirmed + 1, s.progress.needed);

  return (
    <View style={styles.wrap} testID="skill-practice">
      {/* Skill */}
      <View style={[styles.skillHead, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>Skill</Text>
        <Text style={[styles.skillName, { color: colors.textMain }]} testID="skill-practice-skill">{s.skill.shortName}</Text>
      </View>

      {/* Step 1 — teach */}
      {!s.complete && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="skill-teaching">
          <TeachingBlock t={s.teaching} colors={colors} />
          <TouchableOpacity style={[styles.outlineBtn, { borderColor: gold }]} onPress={() => p.explainAnotherWay()} disabled={!!p.busy}
            accessibilityRole="button" testID="explain-another-way">
            {p.busy === 'explain' ? <ActivityIndicator size="small" color={gold} /> : <Text style={[styles.outlineText, { color: gold }]}>Explain Another Way</Text>}
          </TouchableOpacity>
          <View style={[styles.msgRow, { borderColor: colors.borderColor }]}>
            <TextInput value={message} onChangeText={setMessage} placeholder="Still stuck? Tell Aivorah (e.g. “I don’t understand”)"
              placeholderTextColor={colors.textMuted} style={[styles.msgInput, { color: colors.textMain }]} maxLength={300}
              accessibilityLabel="Tell Aivorah what you think of this explanation" testID="teaching-message" />
            <TouchableOpacity onPress={async () => { if (message.trim() && (await p.explainAnotherWay(message.trim()))) setMessage(''); }}
              accessibilityRole="button" accessibilityLabel="Send" disabled={!message.trim() || !!p.busy} testID="teaching-message-send">
              <Feather name="send" size={18} color={message.trim() ? gold : colors.textMuted} />
            </TouchableOpacity>
          </View>
          {!!p.reply && <Text style={[styles.muted, { color: colors.textMuted }]} testID="teaching-reply">{p.reply}</Text>}
        </View>
      )}

      {/* Result of the last answer — shown only after it was saved */}
      {!!p.result && !s.complete && (
        <View testID="skill-result" accessibilityLiveRegion="polite"
          style={[styles.banner, RESULT_TONE[p.result.code] === 'good' ? { backgroundColor: green + '18', borderColor: green + '50' } : { backgroundColor: gold + '14', borderColor: gold + '50' }]}>
          <View style={styles.row}>
            <Feather name={RESULT_TONE[p.result.code] === 'good' ? 'check-circle' : 'info'} size={18} color={RESULT_TONE[p.result.code] === 'good' ? green : gold} />
            <Text style={[styles.bannerTitle, { color: colors.textMain }]}>{p.result.message}</Text>
          </View>
          {p.result.code !== 'clarify' && !!p.result.correctAnswer && p.result.code === 'incorrect' && (
            <Text style={[styles.muted, { color: colors.textMuted }]}>Correct answer: {p.result.correctAnswer}</Text>
          )}
          <Text style={[styles.muted, { color: colors.textMuted }]} testID="skill-progress">{s.progress.confirmed} of {s.progress.needed} confirmed</Text>
        </View>
      )}

      {!!p.actionError && (
        <View style={[styles.banner, { backgroundColor: '#C98A8A18', borderColor: '#C98A8A60' }]} testID="skill-action-error" accessibilityLiveRegion="polite">
          <Text style={[styles.body, { color: colors.textMain }]}>{p.actionError}</Text>
        </View>
      )}

      {/* Solution the student asked for */}
      {!!p.solution && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="skill-solution">
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Solution</Text>
          <Text style={[styles.body, { color: colors.textMain }]}>{p.solution.text}</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>This one doesn&apos;t count towards your check. You&apos;ll get a different question next.</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: gold }]} onPress={p.dismissSolution} accessibilityRole="button" testID="skill-next-question">
            <Text style={styles.btnText}>Next question</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clarification for a correct answer with an unclear reason */}
      {!!s.clarification && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="skill-clarification">
          <Text style={[styles.question, { color: colors.textMain }]}>{s.clarification.question.question}</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>Your answer: {s.clarification.yourAnswer}</Text>
          <Text style={[styles.body, { color: colors.textMain }]}>{s.clarification.prompt}</Text>
          <ReasoningBox value={clarification} onChangeText={setClarification} label="Why is that the answer?" placeholder="Explain in your own words…" testID="clarification-box" />
          <TouchableOpacity style={[styles.btn, { backgroundColor: clarification.trim() && !p.busy ? gold : gold + '60' }]}
            onPress={() => p.submitClarification(clarification.trim())} disabled={!clarification.trim() || !!p.busy} accessibilityRole="button" testID="clarification-submit">
            {p.busy === 'clarify' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Explanation</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2 — a fresh question */}
      {!!q && !p.solution && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="skill-question">
          <Text style={[styles.kicker, { color: colors.textMuted }]}>Question {checkNumber} of {s.progress.needed}</Text>
          <Text style={[styles.question, { color: colors.textMain }]} accessibilityRole="header">{q.question}</Text>
          {q.type === 'mcq' ? (
            <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
              {(q.options || []).map((opt, i) => {
                const on = choice === i;
                return (
                  <TouchableOpacity key={i} onPress={() => setChoice(i)} style={[styles.option, { borderColor: on ? gold : colors.borderColor, backgroundColor: on ? gold + '14' : 'transparent' }]}
                    accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={opt} testID={`skill-option-${i}`}>
                    <Feather name={on ? 'check-circle' : 'circle'} size={18} color={on ? gold : colors.textMuted} />
                    <Text style={[styles.optionText, { color: colors.textMain }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TextInput value={typed} onChangeText={setTyped} placeholder="Type your answer" placeholderTextColor={colors.textMuted} maxLength={120}
              style={[styles.input, { color: colors.textMain, borderColor: colors.borderColor }]} accessibilityLabel="Your answer" testID="skill-fill-input" />
          )}
          {!!p.hint && (
            <View style={[styles.banner, { backgroundColor: gold + '12', borderColor: gold + '50' }]} testID="skill-hint">
              <Text style={[styles.body, { color: colors.textMain }]}>Hint: {p.hint}</Text>
            </View>
          )}
          <ReasoningBox value={reasoning} onChangeText={setReasoning} label={q.reasoningPrompt} placeholder="Explain your thinking in your own words…" testID="skill-reasoning" />
          <TouchableOpacity style={[styles.btn, { backgroundColor: canSubmit ? gold : gold + '60' }]} disabled={!canSubmit}
            onPress={() => p.submitAnswer(q.type === 'mcq' ? (choice as number) : typed.trim(), reasoning.trim())} accessibilityRole="button" testID="skill-submit">
            {p.busy === 'answer' ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Answer</Text>}
          </TouchableOpacity>
          <View style={styles.helpRow}>
            {!p.hint && (
              <TouchableOpacity onPress={p.showHint} disabled={!!p.busy} accessibilityRole="button" testID="skill-hint-btn">
                <Text style={[styles.link, { color: gold }]}>Need a hint?</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={p.showSolution} disabled={!!p.busy} accessibilityRole="button" testID="skill-solution-btn">
              <Text style={[styles.link, { color: colors.textMuted }]}>Show me the solution</Text>
            </TouchableOpacity>
          </View>
          {!!p.hint && <Text style={[styles.muted, { color: colors.textMuted }]}>Using a hint is fine — this question will count as practice with help.</Text>}
        </View>
      )}

      {!!s.unavailable && !p.solution && (
        <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="skill-unavailable">
          <Text style={[styles.body, { color: colors.textMain }]}>{s.unavailable}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: gold }]} onPress={() => onBackToReport(s.attemptId)} accessibilityRole="button"><Text style={styles.btnText}>Back to Test Report</Text></TouchableOpacity>
          {!!onGoToLearn && <TouchableOpacity onPress={onGoToLearn} accessibilityRole="button"><Text style={[styles.link, { color: gold, textAlign: 'center' }]}>Go to Learn</Text></TouchableOpacity>}
        </View>
      )}

      {/* Step 4 — confirmed */}
      {!!s.complete && (
        <View style={[styles.card, { borderColor: green + '50', backgroundColor: green + '14' }]} testID="skill-complete" accessibilityLiveRegion="polite">
          <View style={styles.row}>
            <Feather name="check-circle" size={22} color={green} />
            <Text style={[styles.skillName, { color: colors.textMain }]}>{s.complete.title}</Text>
          </View>
          <Text style={[styles.body, { color: colors.textMain }]}>{s.complete.body}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: gold }]} onPress={() => onBackToReport(s.attemptId)} accessibilityRole="button" testID="skill-back-to-report">
            <Text style={styles.btnText}>Back to Test Report</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TeachingBlock({ t, colors }: { t: Teaching; colors: AppColors }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.kicker, { color: colors.textMuted }]}>{t.methodName}</Text>
      <Text style={[styles.teachTitle, { color: colors.textMain }]}>{t.title}</Text>
      {!!t.confusion && (
        <View style={[styles.confusion, { borderColor: colors.accentYellow + '50', backgroundColor: colors.accentYellow + '10' }]} testID="skill-confusion">
          <Text style={[styles.kicker, { color: colors.textMuted }]}>From your test</Text>
          <Text style={[styles.body, { color: colors.textMain }]}>{t.confusion}</Text>
        </View>
      )}
      <Text style={[styles.body, { color: colors.textMain }]}>{t.body}</Text>
      {!!t.table && (
        <View style={[styles.table, { borderColor: colors.borderColor }]}>
          {t.table.map((row, r) => (
            <View key={r} style={[styles.tableRow, r > 0 && { borderTopWidth: 1, borderColor: colors.borderColor }]}>
              {row.map((cell, c) => (
                <Text key={c} style={[styles.tableCell, { color: colors.textMain, fontWeight: r === 0 || c === 0 ? '800' : '400' }]}>{cell}</Text>
              ))}
            </View>
          ))}
        </View>
      )}
      {!!t.steps && t.steps.map((step, i) => (
        <Text key={i} style={[styles.body, { color: colors.textMain }]}>{i + 1}. {step}</Text>
      ))}
      {t.examples.map((ex, i) => (
        <Text key={i} style={[styles.body, { color: colors.textMain }]}>• <Text style={{ fontWeight: '800' }}>{ex.label}:</Text> {ex.text}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, width: '100%', maxWidth: 760 },
  center: { alignItems: 'center', gap: 8, padding: 24 },
  skillHead: { borderWidth: 1, borderRadius: 12, padding: 12 },
  kicker: { fontSize: 12.5, fontWeight: '700' },
  skillName: { fontSize: 18, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  teachTitle: { fontSize: 16, fontWeight: '800' },
  confusion: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 4 },
  body: { fontSize: 15, lineHeight: 22 },
  muted: { fontSize: 13, lineHeight: 19 },
  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row' },
  tableCell: { flex: 1, padding: 8, fontSize: 13.5, lineHeight: 19 },
  outlineBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  outlineText: { fontSize: 15, fontWeight: '800' },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10 },
  msgInput: { flex: 1, paddingVertical: 9, fontSize: 14 },
  banner: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  bannerTitle: { flex: 1, fontSize: 15.5, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  question: { fontSize: 17, fontWeight: '800', lineHeight: 24 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  optionText: { flex: 1, fontSize: 15, lineHeight: 21 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  btn: { borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  helpRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  link: { fontSize: 13.5, fontWeight: '700', paddingVertical: 4 },
});
