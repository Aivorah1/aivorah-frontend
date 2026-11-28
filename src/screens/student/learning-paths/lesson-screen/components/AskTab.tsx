import React from 'react';
import { View, Text, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import { fonts, radius, spacing } from '../../../../../theme';
import TopicAICoach from '../../../../../components/common/TopicAICoach';
import { makeStyles } from '../styles';
import BookPane from './BookPane';
import TopicPractice, { lessonTextOf, type CoachRequest } from '../../practice-followup/components/TopicPractice';

export default function AskTab({
  coachRequest,
  onBackToReport,
  onGoToLearn,
  onGoToPractice,
  topicId,
  topic,
  chapter,
  grade,
  subject,
  curriculum,
  chapterIndex,
  colors,
  styles,
  onReadFullBook,
}: {
  // Explain This Question / Practise This Skill from a Test Report.
  coachRequest?: CoachRequest | null;
  onBackToReport?: (attemptId: string) => void;
  onGoToLearn?: () => void;
  onGoToPractice?: () => void;
  topicId?: string;
  topic: any;
  chapter: any;
  grade: string;
  subject: string;
  curriculum: string;
  chapterIndex: number;
  colors: AppColors;
  styles: ReturnType<typeof makeStyles>;
  onReadFullBook: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const hasSidePreview = Platform.OS === 'web' && width >= 1100 && !!topic.pdfFile && !!topic.pdfPage;
  return (
    <View style={styles.dualPane}>
      <View style={hasSidePreview ? styles.leftPane : styles.leftPaneFull}>
        {/* Scrolls as one column: the practice panel, then the chat. */}
        <ScrollView
          style={styles.leftScroll}
          contentContainerStyle={{ padding: width < 768 ? spacing.md : spacing.xl, flexGrow: 1, gap: spacing.lg }}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          testID="ask-tab-scroll"
        >
        <View style={[styles.contextPill, { backgroundColor: colors.primary + '18', maxWidth: '100%' }]}>
          <Feather name="zap" size={11} color={colors.primary} />
          <Text style={[styles.contextPillText, { color: colors.primary, flexShrink: 1 }]}>
            Context loaded: {grade} · {subject} · Unit {chapterIndex + 1} · {topic.name}
          </Text>
        </View>
        {/* Practise This Skill: the follow-up from the Test Report, or this topic's open one */}
        <View style={{ width: '100%', maxWidth: 840, gap: spacing.md, alignSelf: 'center', padding: spacing.md, borderWidth: 1, borderRadius: radius.lg, borderColor: colors.borderColor, backgroundColor: colors.cardDark }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Feather name="target" size={18} color={colors.primary} />
            <Text accessibilityRole="header" style={{ color: colors.textHeading, fontFamily: fonts.title, fontSize: 19, fontWeight: '700', flexShrink: 1 }}>Practice This Skill</Text>
          </View>
          <TopicPractice
            request={coachRequest}
            topicName={topic.name}
            subject={subject}
            topicId={topicId}
            lessonText={lessonTextOf(topic)}
            colors={colors}
            onBackToReport={(id) => onBackToReport?.(id)}
            onGoToPractice={onGoToPractice}
          />
        </View>
        {/* The chat keeps its own scrolling at a usable height inside the column. */}
        <View style={{ height: Math.max(420, Math.min(560, height - 152)), width: '100%', maxWidth: 840, alignSelf: 'center' }}>
          <TopicAICoach
            topic={topic.name}
            subject={subject}
            grade={grade}
            curriculum={curriculum}
            chapter={chapter.title}
            autoOpen
            inline
          />
        </View>
        </ScrollView>
      </View>

      {hasSidePreview && (
        <BookPane topic={topic} grade={grade} subject={subject} colors={colors} styles={styles} onReadFullBook={onReadFullBook} />
      )}
    </View>
  );
}
