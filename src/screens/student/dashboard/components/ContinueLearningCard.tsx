import React from 'react';
import { View, Text, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import Icon from '../../../../components/common/Icon';
import type { AppColors } from '../../../../theme';
import { fonts } from '../../../../theme';
import { LessonThumb } from './DashboardOverview';
import type { ContinueLearning, LessonRef } from '../../utils/learningPathProgress';

interface ContinueLearningCardProps {
  colors: AppColors;
  isDark: boolean;
  continueLearning: ContinueLearning;
  // Topics done in the current topic's chapter (for the progress bar).
  chapterDone: number;
  // Average quiz score on the current topic, if any.
  quizScore: number | null;
  studentGrade: string;
  onOpen: (ref: LessonRef) => void;
  onViewAll: () => void;
}

const STATUS_LABEL = { not_started: 'Not started', in_progress: 'In progress', completed: 'Completed' } as const;

// "My Learning Paths" (Website Redesign, Phase 3) — the Learning Path topic
// the student last worked on. Left partway → that same topic, "Continue".
// Finished → marked Completed, with the next unfinished topic (next chapter
// once this one is done) as the call to action. Nothing touched yet → the
// first topic, "Start".
export function ContinueLearningCard({
  colors: c,
  isDark,
  continueLearning,
  chapterDone,
  quizScore,
  studentGrade,
  onOpen,
  onViewAll,
}: ContinueLearningCardProps) {
  const { width } = useWindowDimensions();
  const narrow = width < 640;
  const { current, status, next } = continueLearning;
  const total = current.chapter.topics.length;
  const pct = total ? Math.round((chapterDone / total) * 100) : 0;
  const target = status === 'completed' && next ? next : current;
  const statusColor = status === 'completed' ? c.accentGreen : status === 'in_progress' ? c.primary : c.textDim;
  const cta = status === 'completed' ? (next ? 'Start next' : 'Review') : status === 'in_progress' ? 'Continue' : 'Start';
  const hint = status === 'completed'
    ? (next ? `Up next: Chapter ${next.chapter.chapterNo} · ${next.chapter.title} — ${next.topic.name}` : `You've finished every chapter in ${current.subject}!`)
    : status === 'in_progress'
      ? (quizScore != null ? `Quiz score ${quizScore}% — pass the quiz to complete it.` : 'Pick up where you left off.')
      : 'Start to build your foundation.';

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: narrow ? 22 : 26, fontWeight: '600', color: c.textHeading, letterSpacing: -0.3 }} accessibilityRole="header">
          My Learning Paths
        </Text>
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.75} accessibilityRole="link" testID="learning-paths-view-all"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: c.primary }}>View all</Text>
          <Icon name="arrow-right" size={17} color={c.primary} />
        </TouchableOpacity>
      </View>

      <View
        testID="continue-learning-card"
        style={{
          flexDirection: narrow ? 'column' : 'row', alignItems: narrow ? 'stretch' : 'center', gap: narrow ? 14 : 20,
          padding: narrow ? 14 : 18, borderRadius: 20, borderWidth: 1, borderColor: c.borderColor, backgroundColor: c.cardDark,
          shadowColor: '#302117', shadowOpacity: isDark ? 0.3 : 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: narrow ? undefined : 1, minWidth: 0 }}>
          <LessonThumb isDark={isDark} size={narrow ? 72 : 96} />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.textMuted, letterSpacing: 0.2 }} numberOfLines={1}>
              {current.subject} · {studentGrade}
            </Text>
            <Text style={{ fontFamily: fonts.serif, fontSize: narrow ? 18 : 21, fontWeight: '600', color: c.textHeading, lineHeight: narrow ? 23 : 27 }} numberOfLines={2}>
              Chapter {current.chapter.chapterNo}: {current.chapter.title}
            </Text>
            <Text style={{ fontSize: 13.5, color: c.textMuted }} numberOfLines={1}>{current.topic.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <View style={{ flex: 1, maxWidth: 260, height: 8, borderRadius: 999, backgroundColor: c.borderColor, overflow: 'hidden' }}
                accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: chapterDone }}>
                <View style={{
                  height: '100%', width: `${Math.max(pct, 2)}%` as any, borderRadius: 999, backgroundColor: c.primary,
                  ...(Platform.OS === 'web' ? { transitionProperty: 'width', transitionDuration: '500ms' } as any : null),
                }} />
              </View>
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: c.textMuted }}>{chapterDone} of {total} lessons</Text>
            </View>
          </View>
        </View>

        <View style={{ gap: 8, alignItems: narrow ? 'stretch' : 'flex-end', maxWidth: narrow ? undefined : 300 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: narrow ? 'flex-start' : 'flex-end' }}>
            <Icon name={status === 'completed' ? 'circle-check' : status === 'in_progress' ? 'clock' : 'circle'} size={15} color={statusColor} />
            <Text testID="continue-learning-status" style={{ fontSize: 13, fontWeight: '700', color: statusColor }}>{STATUS_LABEL[status]}</Text>
          </View>
          <Text style={{ fontSize: 12.5, lineHeight: 18, color: c.textMuted, textAlign: narrow ? 'left' : 'right' }} numberOfLines={2}>{hint}</Text>
          <TouchableOpacity
            testID="continue-learning-cta"
            onPress={() => onOpen(target)}
            activeOpacity={0.86}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, paddingHorizontal: 24, borderRadius: 999, backgroundColor: c.primary }}
          >
            <Icon name="play" size={15} color={c.onPrimary} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.onPrimary }}>{cta}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
