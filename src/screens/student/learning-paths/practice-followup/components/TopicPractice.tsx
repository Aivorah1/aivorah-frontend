/**
 * Ask Aivorah → the topic's follow-up practice. Opened from a Test Report's
 * Practise This Skill button (followupId given), or found automatically for
 * this topic from the student's newest test on it. Shows a short note when
 * there is nothing to practise yet.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import { followupApi } from '../services/practiceFollowupApi';
import SkillPracticePanel from './SkillPracticePanel';

// The lesson text the student sees in Learn (curated strings or teacher blocks).
export function lessonTextOf(topic: any): string {
  const rt = topic?.readText;
  if (!rt) return '';
  const part = (b: any) => (typeof b === 'string' ? b : [b?.heading, b?.text, b?.keyIdea].filter(Boolean).join(': '));
  return [rt.intro, ...(Array.isArray(rt.body) ? rt.body.map(part) : []), ...(Array.isArray(rt.keyLearnings) ? rt.keyLearnings : [])]
    .filter(Boolean).join('\n').slice(0, 6000);
}

export default function TopicPractice({ followupId, topicName, subject, topicId, lessonText, colors, onBackToReport, onGoToLearn, onGoToPractice }: {
  followupId?: string;
  topicName: string;
  subject?: string;
  topicId?: string;
  lessonText?: string;
  colors: AppColors;
  onBackToReport: (attemptId: string) => void;
  onGoToLearn?: () => void;
  onGoToPractice?: () => void;
}) {
  const [found, setFound] = useState<{ id: string | null; hasTest: boolean; loading: boolean; error: string }>({ id: null, hasTest: false, loading: !followupId, error: '' });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (followupId || !topicName) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- look up this topic's practice
    setFound((f) => ({ ...f, loading: true, error: '' }));
    followupApi.forTopic(topicName, subject, topicId)
      .then((d) => { if (alive) setFound({ id: d.followupId, hasTest: !!d.hasTest || !!d.attemptId, loading: false, error: '' }); })
      .catch((e) => { if (alive) setFound({ id: null, hasTest: false, loading: false, error: e?.message || 'Could not load your practice.' }); });
    return () => { alive = false; };
  }, [followupId, topicName, subject, topicId, retry]);

  const id = followupId || found.id;
  if (id) {
    return <SkillPracticePanel followupId={id} lessonText={lessonText} colors={colors} onBackToReport={onBackToReport} onGoToLearn={onGoToLearn} />;
  }
  if (found.loading) {
    return <View style={styles.row} testID="topic-practice-loading"><ActivityIndicator size="small" color={colors.accentYellow} /><Text style={[styles.muted, { color: colors.textMuted }]}>Checking your practice…</Text></View>;
  }
  return (
    <View style={[styles.card, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="topic-practice-none">
      <View style={styles.row}>
        <Feather name="target" size={16} color={colors.accentYellow} />
        <Text style={[styles.title, { color: colors.textMain }]}>Practise with Aivorah</Text>
      </View>
      <Text style={[styles.muted, { color: colors.textMuted }]}>
        {found.error
          ? found.error
          : found.hasTest
            ? 'You got everything right in your last test on this topic — nothing to practise right now.'
            : 'Take the Practice test first. Aivorah will then teach anything you missed and check it with two new questions.'}
      </Text>
      {!!found.error && (
        <TouchableOpacity onPress={() => setRetry((n) => n + 1)} accessibilityRole="button"><Text style={[styles.link, { color: colors.accentYellow }]}>Try again</Text></TouchableOpacity>
      )}
      {!found.error && !found.hasTest && !!onGoToPractice && (
        <TouchableOpacity onPress={onGoToPractice} accessibilityRole="button" testID="topic-practice-go"><Text style={[styles.link, { color: colors.accentYellow }]}>Go to Practice</Text></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800' },
  muted: { fontSize: 13.5, lineHeight: 20 },
  link: { fontSize: 13.5, fontWeight: '700' },
});
