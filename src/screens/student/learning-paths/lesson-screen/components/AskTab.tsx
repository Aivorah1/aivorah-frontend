import React from 'react';
import { View, Text, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import { spacing } from '../../../../../theme';
import TopicAICoach from '../../../../../components/common/TopicAICoach';
import { makeStyles } from '../styles';
import BookPane from './BookPane';
import TopicPractice, { lessonTextOf } from '../../practice-followup/components/TopicPractice';

export default function AskTab({
  followupId,
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
  // Practise This Skill: the follow-up to teach and check here.
  followupId?: string;
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
  const hasRealPdf = Platform.OS === 'web' && !!topic.pdfFile && !!topic.pdfPage;
  return (
    <View style={styles.dualPane}>
      <View style={hasRealPdf ? styles.leftPane : styles.leftPaneFull}>
        {/* Scrolls as one column: the practice panel, then the chat. */}
        <ScrollView
          style={styles.leftScroll}
          contentContainerStyle={{ padding: spacing.xl, flexGrow: 1 }}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          testID="ask-tab-scroll"
        >
        <View style={[styles.contextPill, { backgroundColor: colors.primary + '18', marginBottom: 10 }]}>
          <Feather name="zap" size={11} color={colors.primary} />
          <Text style={[styles.contextPillText, { color: colors.primary }]}>
            Context loaded: {grade} · {subject} · Unit {chapterIndex + 1} · {topic.name}
          </Text>
        </View>
        {/* Practise This Skill: the follow-up from the Test Report, or this topic's open one */}
        <View style={{ marginBottom: 16 }}>
          <TopicPractice
            followupId={followupId}
            topicName={topic.name}
            subject={subject}
            topicId={topicId}
            lessonText={lessonTextOf(topic)}
            colors={colors}
            onBackToReport={(id) => onBackToReport?.(id)}
            onGoToLearn={onGoToLearn}
            onGoToPractice={onGoToPractice}
          />
        </View>
        {/* The chat keeps its own scrolling at a usable height inside the column. */}
        <View style={{ height: 560, minHeight: 420 }}>
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

      {hasRealPdf && (
        <BookPane topic={topic} grade={grade} subject={subject} colors={colors} styles={styles} onReadFullBook={onReadFullBook} />
      )}
    </View>
  );
}
