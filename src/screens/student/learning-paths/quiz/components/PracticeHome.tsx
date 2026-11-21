/**
 * Practice start page and History list for one topic.
 * Start page: "Take a Test" or "History". History: every past test, newest
 * first, with its date & time and score; tapping one opens its report.
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import ActivityIndicator from '../../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import Header from '../../../../../components/common/Header';
import ScreenLayout from '../../../../../components/common/ScreenLayout';
import type { AppColors } from '../../../../../theme';
import type { PastAttempt } from '../resultCache';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-07T10:05:00Z' -> '7 Nov 2026, 3:35 pm' in the device's time zone. */
export function formatTakenAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const time = `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${time}`;
}

const duration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

function Shell({ title, topic, subject, onBack, onMenuPress, colors, children }: {
  title: string; topic: string; subject: string; onBack: () => void; onMenuPress: () => void;
  colors: AppColors; children: React.ReactNode;
}) {
  return (
    <ScreenLayout>
      <View style={{ flex: 1, backgroundColor: colors.bgDark }}>
        <Header title={title} subtitle={topic} showBack onBack={onBack} onMenuPress={onMenuPress} />
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={[s.subject, { color: colors.accentYellow }]}>{subject}</Text>
          {children}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}

export function PracticeStart({ topic, subject, attempts, loading, onTakeTest, onHistory, onBack, onMenuPress, colors }: {
  topic: string; subject: string; attempts: PastAttempt[]; loading: boolean;
  onTakeTest: () => void; onHistory: () => void; onBack: () => void; onMenuPress: () => void; colors: AppColors;
}) {
  const accent = colors.accentYellow;
  const last = attempts[0];
  return (
    <Shell title={`${subject} Practice`} topic={topic} subject={subject} onBack={onBack} onMenuPress={onMenuPress} colors={colors}>
      <Text style={[s.topic, { color: colors.textMain }]}>{topic}</Text>
      <View style={s.cards}>
        <TouchableOpacity testID="practice-take-test" style={[s.card, { backgroundColor: colors.cardDark, borderColor: accent + '70' }]} onPress={onTakeTest} activeOpacity={0.85} accessibilityRole="button">
          <View style={[s.cardIcon, { backgroundColor: accent }]}><Feather name="play" size={20} color="#fff" /></View>
          <Text style={[s.cardTitle, { color: colors.textMain }]}>Take a Test</Text>
          <Text style={[s.cardSub, { color: colors.textMuted }]}>New questions on this topic, then explain it in your own words.</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="practice-history" style={[s.card, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]} onPress={onHistory} activeOpacity={0.85} accessibilityRole="button">
          <View style={[s.cardIcon, { backgroundColor: accent + '22' }]}><Feather name="clock" size={20} color={accent} /></View>
          <Text style={[s.cardTitle, { color: colors.textMain }]}>History</Text>
          <Text style={[s.cardSub, { color: colors.textMuted }]}>
            {loading ? 'Loading your past tests…'
              : attempts.length === 0 ? 'No tests yet. Your results will be saved here.'
                : `${attempts.length} past test${attempts.length === 1 ? '' : 's'} · last ${last.score}% on ${formatTakenAt(last.createdAt)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </Shell>
  );
}

export function PracticeHistoryList({ topic, subject, attempts, loading, error, onOpen, onRetry, onTakeTest, onBack, onMenuPress, colors }: {
  topic: string; subject: string; attempts: PastAttempt[]; loading: boolean; error: string;
  onOpen: (a: PastAttempt) => void; onRetry: () => void; onTakeTest: () => void;
  onBack: () => void; onMenuPress: () => void; colors: AppColors;
}) {
  const accent = colors.accentYellow;
  const good = colors.accentGreen;
  const warn = colors.accentRed;
  return (
    <Shell title="Practice History" topic={topic} subject={subject} onBack={onBack} onMenuPress={onMenuPress} colors={colors}>
      <Text style={[s.topic, { color: colors.textMain }]}>{topic}</Text>
      {loading ? (
        <ActivityIndicator color={accent} style={{ marginTop: 32 }} />
      ) : error ? (
        <View style={s.empty}>
          <Text style={[s.emptyText, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity onPress={onRetry} style={[s.smallBtn, { borderColor: accent }]} accessibilityRole="button">
            <Text style={[s.smallBtnText, { color: accent }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : attempts.length === 0 ? (
        <View style={s.empty}>
          <Feather name="clock" size={26} color={colors.textDim} />
          <Text style={[s.emptyText, { color: colors.textMuted }]}>No tests for this topic yet.</Text>
          <TouchableOpacity onPress={onTakeTest} style={[s.smallBtn, { backgroundColor: accent, borderColor: accent }]} accessibilityRole="button">
            <Text style={[s.smallBtnText, { color: colors.onPrimary }]}>Take a Test</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.list}>
          {attempts.map((a, i) => {
            const tone = a.passed ? good : warn;
            return (
              <TouchableOpacity
                key={a.id}
                testID="history-row"
                style={[s.row, { backgroundColor: colors.cardDark, borderColor: colors.borderColor, borderLeftColor: tone }]}
                onPress={() => onOpen(a)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Test from ${formatTakenAt(a.createdAt)}, ${a.score} percent`}
              >
                {/* Columns: date + test/correct | clock + duration | score | open.
                    Each group wraps as a unit on narrow screens. */}
                <View style={s.rowMain}>
                  <Text style={[s.rowDate, { color: colors.textHeading }]}>{formatTakenAt(a.createdAt)}</Text>
                  <Text style={[s.rowSub, { color: colors.textMuted }]}>
                    {`Test ${a.attemptNumber || attempts.length - i} · ${a.correctAnswers} / ${a.totalQuestions || a.questions.length} correct`}
                  </Text>
                </View>
                <View style={s.rowMetaGroup}>
                  <View style={s.timeGroup}>
                    <Feather name="clock" size={16} color={colors.textMuted} />
                    <Text style={[s.timeText, { color: colors.textMain }]}>{duration(a.timeSpentSeconds)}</Text>
                  </View>
                  <View style={[s.scoreChip, { backgroundColor: tone + '1F', borderColor: tone + '60' }]}>
                    <Text style={[s.scoreText, { color: tone }]}>{a.score}%</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </Shell>
  );
}

const s = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48, width: '100%', maxWidth: 820, alignSelf: 'center', gap: 6 },
  subject: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  topic: { fontSize: 22, fontWeight: '800', marginBottom: 14 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { flexGrow: 1, flexBasis: 260, borderWidth: 1.5, borderRadius: 18, padding: 22, gap: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSub: { fontSize: 14, lineHeight: 21 },
  list: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 16, rowGap: 10, minHeight: 56, borderWidth: 1, borderLeftWidth: 4, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  rowMain: { flexGrow: 1, flexBasis: 220, gap: 4 },
  rowDate: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  rowSub: { fontSize: 14, lineHeight: 20 },
  rowMetaGroup: { flexDirection: 'row', alignItems: 'center', gap: 16, marginLeft: 'auto' },
  timeGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72 },
  timeText: { fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'] },
  scoreChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', gap: 12, paddingTop: 32 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  smallBtn: { borderWidth: 1.5, borderRadius: 22, minHeight: 44, paddingVertical: 9, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  smallBtnText: { fontWeight: '800', fontSize: 14, textAlign: 'center' },
});
