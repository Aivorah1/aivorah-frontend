/**
 * QuizQuestionList - the practice test with every question on one scrolling
 * page: one QuestionCard per question, stacked in order. The student answers
 * them in any order; "See Results" opens the results once all are answered.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../../../../components/common/Header';
import ScreenLayout from '../../../../../components/common/ScreenLayout';
import type { AppColors } from '../../../../../theme';
import type { makeStyles } from '../styles';
import { emptyAnswer } from '../types';
import type { Question, QuestionAnswer, SpokenStatus } from '../types';
import QuestionCard from './QuestionCard';

export default function QuizQuestionList({
  questions, answers, results, answeredCount, allAnswered,
  topic, subject, colors, isDark, styles,
  onMcqAnswer, setFillInput, onFillSubmit, onFinish, onBack, onMenuPress,
  spokenText, setSpokenText, spokenStatus, spokenError, onSpokenSubmit,
  reasoningByIndex, setReasoningByIndex, toggleReasoningVoiceByIndex, listeningIndex,
}: {
  questions: Question[];
  answers: QuestionAnswer[];
  // Recorded results by question index (useQuiz.perQuestionResultsRef)
  results: ({ isCorrect: boolean } | undefined)[];
  answeredCount: number;
  allAnswered: boolean;
  topic: string;
  subject: string;
  colors: AppColors;
  isDark: boolean;
  styles: ReturnType<typeof makeStyles>;
  onMcqAnswer: (qIdx: number, optIdx: number) => void;
  setFillInput: (qIdx: number, s: string) => void;
  onFillSubmit: (qIdx: number) => void;
  onFinish: () => void;
  onBack: () => void;
  onMenuPress: () => void;
  spokenText: string;
  setSpokenText: (t: string) => void;
  spokenStatus: SpokenStatus;
  spokenError: string;
  onSpokenSubmit: () => void;
  reasoningByIndex: Record<number, string>;
  setReasoningByIndex: (qIdx: number, s: string) => void;
  toggleReasoningVoiceByIndex: (qIdx: number) => void;
  listeningIndex: number | null;
}) {
  const accent = colors.accentYellow;
  const total = questions.length;

  return (
    <ScreenLayout>
      <View style={styles.screen}>
        <Header title={`${subject} Practice`} subtitle={topic} showBack onBack={onBack} onMenuPress={onMenuPress} />
        <ScrollView contentContainerStyle={styles.qListScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.qList}>

            {/* ── Progress: how many are answered ── */}
            <View style={{ gap: 8 }}>
              <View style={styles.qProgressRow}>
                <Text style={[styles.qProgressSubject, { color: accent }]}>{subject}</Text>
                <Text testID="answered-count" style={[styles.progressText, { color: colors.textMuted }]}>
                  {answeredCount} of {total} answered
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.borderColor }]}>
                <View style={[styles.progressFill, { backgroundColor: accent, width: `${total ? (answeredCount / total) * 100 : 0}%` }]} />
              </View>
            </View>

            {questions.map((q, i) => (
              <QuestionCard
                key={i}
                index={i}
                q={q}
                answer={answers[i] ?? emptyAnswer()}
                isCorrect={results[i]?.isCorrect}
                topic={topic}
                subject={subject}
                colors={colors}
                isDark={isDark}
                styles={styles}
                onMcqAnswer={(opt) => onMcqAnswer(i, opt)}
                setFillInput={(s) => setFillInput(i, s)}
                onFillSubmit={() => onFillSubmit(i)}
                spokenText={spokenText}
                setSpokenText={setSpokenText}
                spokenStatus={spokenStatus}
                spokenError={spokenError}
                onSpokenSubmit={onSpokenSubmit}
                reasoning={reasoningByIndex[i] || ''}
                setReasoning={(s) => setReasoningByIndex(i, s)}
                toggleReasoningVoice={() => toggleReasoningVoiceByIndex(i)}
                isListening={listeningIndex === i}
              />
            ))}

            {/* ── See Results, once every question is answered ── */}
            <View style={styles.qFooter}>
              <TouchableOpacity
                testID="see-results"
                style={[styles.nextBtn, { backgroundColor: allAnswered ? accent : accent + '45', margin: 0 }]}
                onPress={onFinish}
                activeOpacity={0.85}
                disabled={!allAnswered}
                accessibilityState={{ disabled: !allAnswered }}
              >
                <Text style={styles.nextBtnText}>See Results</Text>
                <Feather name="arrow-right" size={15} color="#fff" />
              </TouchableOpacity>
              {!allAnswered && (
                <Text style={[styles.qFooterNote, { color: colors.textMuted }]}>
                  Answer all {total} questions to see your results
                </Text>
              )}
            </View>

          </View>
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}
