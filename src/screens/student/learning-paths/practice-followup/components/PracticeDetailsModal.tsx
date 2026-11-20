/**
 * View Practice Details: each finalized follow-up question with the student's
 * answer and reasoning, whether help was used, and Aivorah's feedback.
 */
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import { followupApi } from '../services/practiceFollowupApi';
import type { DetailQuestion, PracticeDetails } from '../types';

const HELP_LABEL: Record<DetailQuestion['helpUsed'], string> = { none: 'No help used', hint: 'Hint used', solution: 'Solution shown' };

function creditLabel(q: DetailQuestion): string {
  if (q.credit === 'independent') return 'Correct on your own';
  if (q.credit === 'assisted') return 'Correct with a hint';
  if (q.helpUsed === 'solution') return 'Reviewed the solution';
  if (q.gradingOutcome === 'incorrect') return 'Not quite';
  return 'Correct — reasoning to work on';
}

export default function PracticeDetailsModal({ followupId, onClose, colors }: { followupId: string | null; onClose: () => void; colors: AppColors }) {
  const [data, setData] = useState<PracticeDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!followupId) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before loading another follow-up
    setData(null); setError('');
    followupApi.details(followupId)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load practice details.'); });
    return () => { alive = false; };
  }, [followupId]);

  return (
    <Modal visible={!!followupId} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]} testID="practice-details">
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: colors.textMuted }]}>Practice details</Text>
              <Text style={[styles.title, { color: colors.textMain }]}>{data?.skill.label || 'Follow-up practice'}</Text>
              {!!data && <Text style={[styles.sub, { color: colors.textMuted }]}>{data.outcome.label}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" testID="practice-details-close">
              <Feather name="x" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {!data && !error && <ActivityIndicator color={colors.accentYellow} style={{ marginVertical: 24 }} />}
          {!!error && <Text style={[styles.sub, { color: colors.textMuted, marginVertical: 16 }]}>{error}</Text>}
          {!!data && (
            <ScrollView style={{ maxHeight: 520 }}>
              {data.questions.length === 0 && <Text style={[styles.sub, { color: colors.textMuted }]}>No answers saved yet.</Text>}
              {data.questions.map((q) => (
                <View key={q.questionId} style={[styles.item, { borderColor: colors.borderColor }]} testID="practice-details-item">
                  <Text style={[styles.qNum, { color: colors.textMuted }]}>Question {q.seq} · {q.type === 'mcq' ? 'Multiple choice' : 'Fill in the blank'}</Text>
                  <Text style={[styles.q, { color: colors.textMain }]}>{q.question}</Text>
                  <Row label="Your answer" value={q.yourAnswer || '—'} colors={colors} />
                  <Row label="Your reasoning" value={[q.yourReasoning, q.clarification].filter(Boolean).join(' — ') || '—'} colors={colors} />
                  {!!q.correctAnswer && !q.correct && <Row label="Correct answer" value={q.correctAnswer} colors={colors} />}
                  <View style={styles.tags}>
                    <Text style={[styles.tag, { color: colors.textMain, borderColor: colors.borderColor }]}>{creditLabel(q)}</Text>
                    <Text style={[styles.tag, { color: colors.textMain, borderColor: colors.borderColor }]}>{HELP_LABEL[q.helpUsed]}</Text>
                  </View>
                  {!!q.feedback && <Text style={[styles.feedback, { color: colors.textMuted }]}>Aivorah: {q.feedback}</Text>}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: AppColors }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.textMain }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet: { width: '100%', maxWidth: 620, borderRadius: 16, borderWidth: 1, padding: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  kicker: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 13.5, marginTop: 2 },
  item: { borderTopWidth: 1, paddingVertical: 12, gap: 6 },
  qNum: { fontSize: 12, fontWeight: '700' },
  q: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  row: { flexDirection: 'row', gap: 8 },
  rowLabel: { width: 110, fontSize: 12.5, fontWeight: '700' },
  rowValue: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  feedback: { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
});
