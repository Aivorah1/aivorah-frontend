import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import ActivityIndicator from '../../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import Header from '../../../../../components/common/Header';
import ScreenLayout from '../../../../../components/common/ScreenLayout';
import Confetti from '../../../../../components/common/Confetti';
import TrophyIcon from '../../../../../components/common/TrophyIcon';
import type { AppColors } from '../../../../../theme';
import { useResponsive } from '../../../../../hooks/useResponsive';
import type { NextTopic } from '../hooks/useNextTopic';
import { makeStyles } from '../styles';
import SpokenReport from './SpokenReport';

export default function QuizResult({
  topic,
  score,
  questions,
  perQuestionResults,
  resultExplanations,
  explanationsRef,
  attemptNumber,
  quizStartTime,
  colors,
  isDark,
  styles,
  onRetry,
  onBack,
  onMenuPress,
  nextTopic,
  nextTopicLoading,
  onNextTopic,
  onHistory,
  takenAt,
  review = false,
  followupSlot,
  wrongActions,
  wrongLabel,
}: {
  topic: string;
  score: number;
  questions: { question: string }[];
  perQuestionResults: any[];
  resultExplanations: Record<number, string>;
  explanationsRef: React.MutableRefObject<Record<number, string>>;
  attemptNumber: number;
  quizStartTime: number;
  colors: AppColors;
  isDark: boolean;
  styles: ReturnType<typeof makeStyles>;
  onRetry: () => void;
  onBack: () => void;
  onMenuPress: () => void;
  nextTopic?: NextTopic | null;
  nextTopicLoading?: boolean;
  onNextTopic?: (next: NextTopic) => void;
  // Practice History: "See all past tests" / "Back to history"
  onHistory?: () => void;
  // A past test opened from History: when it was taken; no celebration, no next-topic.
  takenAt?: string;
  review?: boolean;
  // Optional content right under the score.
  followupSlot?: React.ReactNode;
  // Under each wrong question: Explain This Question / Practise This Skill
  // and "What you worked on"; and the skill label shown above the question.
  wrongActions?: (questionIndex: number) => React.ReactNode;
  wrongLabel?: (questionIndex: number) => string | null;
}) {
  const accent = colors.accentYellow;
  const gold = colors.accentYellow;
  const pct = Math.round((score / questions.length) * 100);
  const passed = pct >= 60;
  // Freeze the elapsed time at first render of the result screen instead of
  // recomputing Date.now() on every render (which would make the displayed
  // time keep ticking upward while the results are just being read).
  const [resultShownAt] = React.useState(() => Date.now());
  const totalTime = Math.round((resultShownAt - quizStartTime) / 1000);
  const timeStr = totalTime >= 60 ? `${Math.floor(totalTime / 60)}m ${totalTime % 60}s` : `${totalTime}s`;
  const scoreColor = pct >= 60 ? gold : colors.accentRed;
  const trophyTier: 'gold' | 'silver' | 'bronze' = pct >= 80 ? 'gold' : pct >= 60 ? 'silver' : 'bronze';
  const message = pct === 100 ? 'Perfect score! Outstanding work!'
    : pct >= 80 ? 'Excellent! You really understand this topic!'
    : pct >= 60 ? 'Good job! A little more practice and you will master this!'
    : 'Keep going! Review what you missed below and try again.';

  const { isMobile } = useResponsive();
  // Two columns of question cards on wider screens; cards in a row share the taller one's height.
  const cardWidth = isMobile ? '100%' : '49.2%';
  const grid = { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const, alignItems: 'stretch' as const };

  // Soft pulsing glow on the Next topic button.
  const [glow] = React.useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!passed || !nextTopic || review) return; // the next-topic button is hidden in a past test's report
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [passed, nextTopic, glow, review]);

  // The spoken question has its own report card; right/wrong lists are the others.
  const spokenQs = perQuestionResults.filter(r => r?.type === 'spoken');
  const correctQs = perQuestionResults.filter(r => r && r.isCorrect && r.type !== 'spoken');
  const wrongQs = perQuestionResults.map((r, i) => ({ ...r, idx: i })).filter(r => r && !r.isCorrect && r.type !== 'spoken');

  return (
    <ScreenLayout>
      <View style={styles.screen}>
        <Header title={review ? 'Test Report' : 'Practice Results'} subtitle={review ? topic : undefined} showBack onBack={onBack} onMenuPress={onMenuPress} />
        <ScrollView contentContainerStyle={[styles.scrollContent]} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { alignItems: 'center', paddingTop: 32 }]}>

          {/* ── Score hero ── */}
          {passed && !review && <Confetti trigger />}
          <TrophyIcon size={96} tier={trophyTier} />
          <Text style={[styles.resultScore, { color: scoreColor, marginTop: 12 }]}>{pct}%</Text>
          <Text style={[styles.resultLabel, { color: colors.textMain }]}>{score} / {questions.length} correct</Text>
          <Text style={[styles.resultMessage, { color: colors.textMuted }]}>{message}</Text>
          {followupSlot}

          {/* badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            <View style={[styles.topicBadge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
              <Text style={[styles.topicBadgeText, { color: accent }]}>{topic}</Text>
            </View>
            <View style={[styles.topicBadge, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
              <Feather name="clock" size={11} color={colors.textMuted} />
              <Text style={[styles.topicBadgeText, { color: colors.textMuted }]}> {timeStr}</Text>
            </View>
            {!!takenAt && (
              <View testID="quiz-taken-at" style={[styles.topicBadge, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
                <Feather name="calendar" size={11} color={colors.textMuted} />
                <Text style={[styles.topicBadgeText, { color: colors.textMuted }]}> {takenAt}</Text>
              </View>
            )}
            {attemptNumber > 1 && (
              <View style={[styles.topicBadge, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
                <Text style={[styles.topicBadgeText, { color: colors.textMuted }]}>Attempt #{attemptNumber}</Text>
              </View>
            )}
          </View>

          {/* action buttons */}
          <View style={styles.resultBtns}>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: !passed ? colors.accentRed : accent, backgroundColor: !passed ? colors.accentRed + '14' : accent + '14' }]}
              onPress={onRetry} activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={16} color={!passed ? colors.accentRed : accent} />
              <Text style={[styles.retryBtnText, { color: !passed ? colors.accentRed : accent }]}>
                {review ? 'Take a New Test' : !passed ? 'Retake (New Questions)' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
          {!!onHistory && (
            <TouchableOpacity testID="quiz-see-history" onPress={onHistory} activeOpacity={0.75} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }} accessibilityRole="button">
              <Feather name={review ? 'arrow-left' : 'clock'} size={14} color={accent} />
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: accent }}>{review ? 'Back to history' : 'See all past tests'}</Text>
            </TouchableOpacity>
          )}

          {passed && !review && nextTopic && onNextTopic && (
            <Animated.View style={{
              width: '100%', marginTop: 12, borderRadius: 14,
              shadowColor: gold, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] }) as any,
              shadowRadius: glow.interpolate({ inputRange: [0, 1], outputRange: [6, 18] }) as any,
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
            }}>
              <TouchableOpacity
                testID="quiz-next-topic"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18 }}
                onPress={() => onNextTopic(nextTopic)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: colors.onPrimary, opacity: 0.85, letterSpacing: 0.6 }}>NEXT TOPIC</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.onPrimary }} numberOfLines={2}>{nextTopic.name}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onPrimary }} numberOfLines={2}>{nextTopic.chapterTitle}</Text>
                </View>
                <Feather name="arrow-right" size={20} color={colors.onPrimary} />
              </TouchableOpacity>
            </Animated.View>
          )}
          {passed && !review && !nextTopic && !nextTopicLoading && onNextTopic && (
            <Text testID="quiz-subject-finished" style={{ marginTop: 12, fontSize: 13, fontWeight: '700', color: gold, textAlign: 'center' }}>
              That was the last topic in this subject. Well done!
            </Text>
          )}
          {!passed && !review && (
            <View testID="quiz-next-locked" style={{ width: '100%', marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.borderColor, backgroundColor: colors.cardDark }}>
              <Feather name="lock" size={16} color={colors.textMuted} />
              <Text style={{ flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 19 }}>
                Score 60% or more to unlock the next topic. Look at the mistakes below, then retake.
              </Text>
            </View>
          )}
        </View>

        <View style={{ width: '100%', maxWidth: 1040, alignSelf: 'center' }}>

          {/* ── The spoken explanation ── */}
          {spokenQs.length > 0 && (
            <View style={styles.reviewSection}>
              <View style={styles.reviewSectionHeader}>
                <View style={[styles.reviewSectionIcon, { backgroundColor: accent + '20' }]}>
                  <Feather name="mic" size={16} color={accent} />
                </View>
                <Text style={[styles.reviewSectionTitle, { color: accent }]}>Your Spoken Explanation</Text>
              </View>
              {spokenQs.map((r, i) => (
                <SpokenReport key={i} question={r.question} said={r.studentAnswer} evaluation={r.evaluation} colors={colors} />
              ))}
            </View>
          )}

          {/* ── What you got RIGHT ── */}
          {correctQs.length > 0 && (
            <View style={styles.reviewSection}>
              <View style={styles.reviewSectionHeader}>
                <View style={[styles.reviewSectionIcon, { backgroundColor: '#9FB2A420' }]}>
                  <Feather name="check-circle" size={16} color="#9FB2A4" />
                </View>
                <Text style={[styles.reviewSectionTitle, { color: colors.accentGreen }]}>
                  Questions You Got Right ({correctQs.length})
                </Text>
              </View>
              <View style={grid}>
              {correctQs.map((r, i) => (
                <View key={i} testID="quiz-review-card" style={[styles.reviewCard, { width: cardWidth }, {
                  backgroundColor: colors.cardDark,
                  borderColor: '#9FB2A430',
                  borderLeftColor: colors.accentGreen,
                }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#9FB2A420', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Feather name="check" size={13} color="#9FB2A4" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMain, lineHeight: 22 }}>{r.question}</Text>
                      <View style={[styles.reviewAnswerRow, { backgroundColor: colors.bgDark, borderRadius: 8, marginTop: 10 }]}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.accentGreen, width: 90, letterSpacing: 0.3 }}>Your answer</Text>
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.accentGreen }}>{r.studentAnswer}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              </View>
            </View>
          )}

          {/* ── What you got WRONG ── */}
          {wrongQs.length > 0 && (
            <View style={styles.reviewSection}>
              <View style={styles.reviewSectionHeader}>
                <View style={[styles.reviewSectionIcon, { backgroundColor: '#C8551C20' }]}>
                  <Feather name="x-circle" size={16} color="#C8551C" />
                </View>
                <Text style={[styles.reviewSectionTitle, { color: colors.textHeading }]}>
                  Questions You Got Wrong ({wrongQs.length})
                </Text>
              </View>
              <View style={grid}>
              {wrongQs.map((r) => {
                const expl = resultExplanations[r.idx];
                return (
                  <View key={r.idx} testID="quiz-review-card" style={[styles.reviewCard, { width: cardWidth }, {
                    backgroundColor: colors.cardDark,
                    borderColor: '#C8551C30',
                    borderLeftColor: colors.accentRed,
                  }]}>
                    {!!wrongLabel?.(r.idx) && (
                      <View style={{ alignSelf: 'flex-start', backgroundColor: colors.bgDark, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 }} testID={`wrong-label-${r.idx}`}>
                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.textMain }}>{wrongLabel(r.idx)}</Text>
                      </View>
                    )}
                    {/* question */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#C8551C20', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Feather name="x" size={13} color="#C8551C" />
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textMain, lineHeight: 22 }}>{r.question}</Text>
                    </View>

                    {/* your answer vs correct answer */}
                    <View style={{ gap: 7, marginBottom: 14, marginLeft: 36 }}>
                      <View style={[styles.reviewAnswerRow, { backgroundColor: colors.accentRed + '14', borderWidth: 1, borderColor: colors.accentRed + '80', borderRadius: 10 }]}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textHeading, width: 120 }}>Your answer</Text>
                        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.textMain }}>{r.studentAnswer || '—'}</Text>
                      </View>
                      <View style={[styles.reviewAnswerRow, { backgroundColor: colors.accentGreen + '14', borderWidth: 1, borderColor: colors.accentGreen + '80', borderRadius: 10 }]}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textHeading, width: 120 }}>Correct answer</Text>
                        <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.textMain }}>{r.correctAnswer}</Text>
                      </View>
                    </View>

                    {/* Aivorah explanation */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10, backgroundColor: colors.cardHover, borderWidth: 1, borderColor: colors.borderColor }}>
                      {expl ? (
                        <>
                          <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Feather name="book-open" size={14} color={colors.primary} />
                          </View>
                          <Text style={{ flex: 1, fontSize: 15, color: colors.textMain, lineHeight: 23 }}>
                            <Text style={{ fontWeight: '800', color: colors.textHeading }}>Aivorah: </Text>{expl}
                          </Text>
                        </>
                      ) : (
                        <>
                          <ActivityIndicator size="small" color="#C8551C" />
                          <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>Aivorah is preparing your explanation…</Text>
                        </>
                      )}
                    </View>
                    {wrongActions?.(r.idx)}
                  </View>
                );
              })}
              </View>
            </View>
          )}

        </View>
        </ScrollView>
      </View>
    </ScreenLayout>
  );
}
