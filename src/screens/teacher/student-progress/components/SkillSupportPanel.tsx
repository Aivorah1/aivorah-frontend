/**
 * Teacher → Student Progress, opened from Need Support → "Needs topic help":
 * the skill, the student's recent relevant attempts (what they found hard),
 * the follow-up outcome, and what to practise next. Server-checked: only the
 * student's own teachers can load it.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import { followupApi, type TeacherSkillView } from '../../../student/learning-paths/practice-followup/services/practiceFollowupApi';

const KIND: Record<string, string> = { incorrect: 'Answered incorrectly', second_try: 'Right on a second try', reasoning_misconception: 'Right, with a mistaken reason' };

export default function SkillSupportPanel({ studentId, skillId, studentName, colors, onClose }: {
  studentId: string; skillId: string; studentName?: string; colors: AppColors; onClose?: () => void;
}) {
  const [data, setData] = useState<TeacherSkillView | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset for another student/skill
    setData(null); setError('');
    followupApi.teacherSkill(studentId, skillId)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load this skill.'); });
    return () => { alive = false; };
  }, [studentId, skillId]);

  return (
    <View style={[styles.card, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]} testID="skill-support-panel">
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>{studentName ? `${studentName} · ` : ''}Skill focus</Text>
          <Text style={[styles.title, { color: colors.textMain }]}>{data?.skill.label || 'Loading…'}</Text>
        </View>
        {!!onClose && (
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close skill focus"><Feather name="x" size={20} color={colors.textMuted} /></TouchableOpacity>
        )}
      </View>
      {!data && !error && <ActivityIndicator color={colors.accentYellow} />}
      {!!error && <Text style={[styles.body, { color: colors.textMuted }]}>{error}</Text>}
      {!!data && (
        <>
          <Text style={[styles.status, { color: data.needsTopicHelp ? '#0E6E86' : colors.accentGreen }]} testID="skill-support-status">
            {data.needsTopicHelp ? `Needs topic help · difficulty on ${data.flag?.evidenceCount ?? 2} questions` : 'No open topic-help flag for this skill'}
          </Text>
          <Text style={[styles.section, { color: colors.textMain }]}>What to practise next</Text>
          <Text style={[styles.body, { color: colors.textMain }]}>{data.practiseNext}</Text>
          <Text style={[styles.section, { color: colors.textMain }]}>Recent relevant attempts</Text>
          {data.recentAttempts.length === 0 && <Text style={[styles.body, { color: colors.textMuted }]}>No attempts for this skill yet.</Text>}
          {data.recentAttempts.map((a) => (
            <View key={a.attemptId} style={[styles.attempt, { borderColor: colors.borderColor }]}>
              <Text style={[styles.body, { color: colors.textMain, fontWeight: '700' }]}>
                {a.topic}{a.score != null ? ` · Topic test ${Math.round(a.score)}%` : ''} · {new Date(a.takenAt).toLocaleDateString()}
              </Text>
              {a.questions.map((q, i) => (
                <Text key={i} style={[styles.small, { color: colors.textMuted }]}>• {q.question} — {KIND[q.kind] || q.kind}</Text>
              ))}
              <Text style={[styles.small, { color: colors.textMain }]}>Follow-up: {a.followupOutcome}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8, marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  kicker: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800' },
  status: { fontSize: 13.5, fontWeight: '800' },
  section: { fontSize: 14, fontWeight: '800', marginTop: 6 },
  body: { fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12.5, lineHeight: 18 },
  attempt: { borderTopWidth: 1, paddingTop: 8, gap: 2 },
});
