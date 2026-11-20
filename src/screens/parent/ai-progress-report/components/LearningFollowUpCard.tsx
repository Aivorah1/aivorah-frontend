/**
 * Parent → AI Progress Report → Learning Follow-up: the selected linked
 * child's saved Practise This Skill outcomes, in plain English. Only saved
 * outcomes are shown (tutoring conversations stay private). The server checks
 * that this parent is linked to the child.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import { followupApi, type ParentFollowup } from '../../../student/learning-paths/practice-followup/services/practiceFollowupApi';

export function useChildFollowups(childId: string | undefined) {
  const [state, setState] = useState<{ loading: boolean; error: string; items: ParentFollowup[]; hasAssessments: boolean }>({ loading: !!childId, error: '', items: [], hasAssessments: false });
  useEffect(() => {
    if (!childId) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when another child is selected
    setState({ loading: true, error: '', items: [], hasAssessments: false });
    followupApi.parentChild(childId)
      .then((d) => { if (alive) setState({ loading: false, error: '', items: d.followups || [], hasAssessments: !!d.hasAssessments }); })
      .catch((e) => { if (alive) setState({ loading: false, error: e?.message || 'Could not load learning follow-up.', items: [], hasAssessments: false }); });
    return () => { alive = false; };
  }, [childId]);
  return state;
}

export function followUpSummary(f: ParentFollowup): string {
  const parts = [f.skill];
  if (f.originalScore != null) parts.push(`Topic test ${Math.round(f.originalScore)}%`);
  return `${parts.join(' · ')} · ${f.outcome}`;
}

export default function LearningFollowUpCard({ childId, childName, colors }: { childId?: string; childName?: string; colors: AppColors }) {
  const { loading, error, items, hasAssessments } = useChildFollowups(childId);
  if (!childId) return null;
  const first = (childName || 'Your child').split(' ')[0];
  const green = colors.accentGreen;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]} testID="learning-followup-card">
      <Text style={[styles.title, { color: colors.textMain }]}>Learning Follow-up</Text>
      {loading && <ActivityIndicator color={colors.accentYellow} style={{ marginVertical: 8 }} />}
      {!loading && !!error && <Text style={[styles.muted, { color: colors.textMuted }]}>{error}</Text>}
      {!loading && !error && items.length === 0 && (
        <Text style={[styles.muted, { color: colors.textMuted }]} testID="learning-followup-empty">
          {hasAssessments
            ? `No follow-up practice yet. When a test shows ${first} needs help with a skill, it will appear here.`
            : `${first} hasn't taken a practice test yet, so there's nothing to follow up on.`}
        </Text>
      )}
      {items.slice(0, 6).map((f) => (
        <View key={f.followupId} style={[styles.item, { borderColor: colors.borderColor }]} testID="learning-followup-item">
          <Text style={[styles.subject, { color: colors.textMuted }]}>{f.subject} · {f.topic}</Text>
          <Text style={[styles.skill, { color: colors.textMain }]}>{f.skill}</Text>
          {f.originalScore != null && (
            <Text style={[styles.line, { color: colors.textMain }]}><Text style={styles.bold}>Topic test:</Text> {Math.round(f.originalScore)}%</Text>
          )}
          <Text style={[styles.line, { color: colors.textMain }]}><Text style={styles.bold}>{f.status === 'completed' ? 'After practice:' : 'Follow-up:'}</Text> {f.outcome}</Text>
          {f.status === 'completed' ? (
            <View style={[styles.pill, { backgroundColor: green + '18', borderColor: green + '50' }]}>
              <Feather name="check" size={13} color={green} />
              <Text style={[styles.pillText, { color: green }]}>Practice complete</Text>
            </View>
          ) : (
            <View style={[styles.pill, { backgroundColor: colors.accentYellow + '14', borderColor: colors.accentYellow + '50' }]}>
              <Text style={[styles.pillText, { color: colors.textMain }]}>{f.status === 'available' ? 'Recommended' : 'In progress'}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8, marginTop: 16 },
  title: { fontSize: 18, fontWeight: '800' },
  muted: { fontSize: 13.5, lineHeight: 20 },
  item: { borderTopWidth: 1, paddingTop: 10, gap: 4 },
  subject: { fontSize: 12.5, fontWeight: '700' },
  skill: { fontSize: 15.5, fontWeight: '800' },
  line: { fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '800' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  pillText: { fontSize: 12.5, fontWeight: '700' },
});
