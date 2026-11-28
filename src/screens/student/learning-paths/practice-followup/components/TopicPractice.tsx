/**
 * Ask Aivorah → the coach for one wrong question of one test.
 * Opened from a Test Report's "Explain This Question" / "Practise This Skill"
 * (attemptId + questionIndex + mode given), or found automatically for this
 * topic from the student's newest test on it (practice first). Shows a short
 * note when there is nothing to practise yet.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ActivityIndicator from '../../../../../components/common/AivorahLoader';
import type { AppColors } from '../../../../../theme';
import { followupApi } from '../services/practiceFollowupApi';
import QuestionCoach from './QuestionCoach';
import type { CoachMode } from '../hooks/useQuestionCoach';

// The lesson text the student sees in Learn (curated strings or teacher blocks).
export function lessonTextOf(topic: any): string {
  const rt = topic?.readText;
  if (!rt) return '';
  const part = (b: any) => (typeof b === 'string' ? b : [b?.heading, b?.text, b?.keyIdea].filter(Boolean).join(': '));
  return [rt.intro, ...(Array.isArray(rt.body) ? rt.body.map(part) : []), ...(Array.isArray(rt.keyLearnings) ? rt.keyLearnings : [])]
    .filter(Boolean).join('\n').slice(0, 6000);
}

export interface CoachRequest { attemptId: string; questionIndex: number; mode: CoachMode; nonce?: unknown }

export default function TopicPractice({ request, topicName, subject, topicId, lessonText, colors, onBackToReport, onGoToPractice }: {
  request?: CoachRequest | null;
  topicName: string;
  subject?: string;
  topicId?: string;
  lessonText?: string;
  colors: AppColors;
  onBackToReport: (attemptId: string) => void;
  onGoToPractice?: () => void;
}) {
  const [found, setFound] = useState<{ req: CoachRequest | null; hasTest: boolean; loading: boolean; error: string }>({ req: null, hasTest: false, loading: !request, error: '' });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (request || !topicName) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- look up this topic's practice
    setFound((f) => ({ ...f, loading: true, error: '' }));
    followupApi.forTopic(topicName, subject, topicId)
      .then((d: any) => {
        if (!alive) return;
        const req = d.attemptId && d.questionIndex != null ? { attemptId: d.attemptId, questionIndex: d.questionIndex, mode: 'practice' as const } : null;
        setFound({ req, hasTest: !!d.hasTest || !!d.attemptId, loading: false, error: '' });
      })
      .catch((e) => { if (alive) setFound({ req: null, hasTest: false, loading: false, error: e?.message || 'Could not load your practice.' }); });
    return () => { alive = false; };
  }, [request, topicName, subject, topicId, retry]);

  const req = request || found.req;
  if (req) {
    return (
      <QuestionCoach
        key={`${req.attemptId}:${req.questionIndex}:${req.mode}:${String(req.nonce ?? '')}`}
        attemptId={req.attemptId} questionIndex={req.questionIndex} mode={req.mode}
        lessonText={lessonText} colors={colors} onBackToReport={onBackToReport}
      />
    );
  }
  if (found.loading) {
    return <View style={styles.row} testID="topic-practice-loading"><ActivityIndicator size="small" color={colors.accentYellow} /><Text style={[styles.muted, { color: colors.textMuted }]}>Checking your practice…</Text></View>;
  }
  return (
    <View style={styles.summary} testID="topic-practice-none">
      <Text style={[styles.muted, { color: colors.textMuted }]}>
        {found.error
          ? found.error
          : found.hasTest
            ? 'You got everything right in your last test on this topic — nothing to practise right now.'
            : 'Take the Practice test first. Aivorah will then explain anything you missed and give you fresh questions on it.'}
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
  summary: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  muted: { fontSize: 13.5, lineHeight: 20 },
  link: { fontSize: 13.5, fontWeight: '700' },
});
