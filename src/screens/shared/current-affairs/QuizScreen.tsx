import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../hooks/useResponsive';
import { spacing, radius, fonts } from '../../../theme';
import type { AppColors } from '../../../theme';
import {
  fetchWeeklyQuiz, checkQuizAnswer, submitQuiz, recordQuizComplete,
  type AgeGroup, type AnswerReveal, type Quiz, type QuizAnswer, type QuizCompleteResult, type QuizQuestion, type QuizResult,
} from '../../../services/currentAffairsApi';
import {
  QUESTION_TYPES, OPTION_LETTERS, EXCELLENCE_PERCENT, ageGroupForStudent, normalizeAgeGroup,
} from './constants';
import CategoryBadge from './components/CategoryBadge';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** '2026-11-28' -> 'Saturday, 28 Nov'. */
export function formatDueDate(date?: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/**
 * Where to resume a quiz from the answers already saved on the server: the
 * first unanswered question, or the last one (shown answered, ready to
 * submit) when every question has an answer.
 */
export function resumePoint(questions: QuizQuestion[], progress: AnswerReveal[] = []) {
  const byId = new Map(progress.filter((p) => Number.isInteger(p.selected)).map((p) => [p.questionId, p]));
  const answers: QuizAnswer[] = questions
    .filter((q) => byId.has(q.id))
    .map((q) => ({ questionId: q.id, answer: byId.get(q.id)!.selected as number }));
  const firstOpen = questions.findIndex((q) => !byId.has(q.id));
  if (firstOpen >= 0) return { index: firstOpen, answers, reveal: null as AnswerReveal | null };
  const last = questions.length - 1;
  return { index: Math.max(last, 0), answers, reveal: last >= 0 ? byId.get(questions[last].id) || null : null };
}

export default function QuizScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const styles = useMemo(() => makeStyles(colors, isMobile), [colors, isMobile]);
  const titleColor = colors.textHeading;

  const ageGroup: AgeGroup = normalizeAgeGroup(route?.params?.ageGroup) || ageGroupForStudent(user);
  const email = user?.email || undefined;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [reveal, setReveal] = useState<AnswerReveal | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [busy, setBusy] = useState(false);
  const [resumedCount, setResumedCount] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const [result, setResult] = useState<QuizResult | null>(null);
  const [award, setAward] = useState<QuizCompleteResult | null>(null);
  const [awardError, setAwardError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = await fetchWeeklyQuiz(ageGroup, email);
      setQuiz(q);
      // Already taken this week → straight to the result.
      setResult(q.attempt);
      setAward(null); setAwardError(null);
      // Started earlier → continue where the student left off (answers are saved one by one).
      const resume = resumePoint(q.questions || [], q.attempt ? [] : q.progress);
      setIndex(resume.index);
      setAnswers(resume.answers);
      setReveal(resume.reveal);
      setSelected(resume.reveal ? (resume.reveal.selected as number) : null);
      setResumedCount(resume.answers.length);
    } catch (e: any) {
      setError(e?.message || "Could not load this week's quiz");
    } finally {
      setLoading(false);
    }
  }, [ageGroup, email]);

  // Reload only when nothing is in progress (coming back from a story mid-quiz keeps the answers).
  useFocusEffect(useCallback(() => {
    if (!quiz) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep an in-progress quiz on refocus
  }, [load]));

  const questions = quiz?.questions || [];
  const question = questions[index];
  const isLast = index === questions.length - 1;
  // Back to where the student came from (The World & You → Current Affairs).
  const goToDigest = () => {
    if (navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate('WorldAndYou', { tab: 'news' });
  };

  const onCheck = async () => {
    if (selected === null || !question) return;
    if (!email) { setActionError('Please sign in to take the quiz.'); return; }
    setBusy(true);
    setActionError(null);
    try {
      const revealed = await checkQuizAnswer(email, ageGroup, question.id, selected);
      // The server keeps the first answer given to a question; show that one.
      const counted = Number.isInteger(revealed.selected) ? (revealed.selected as number) : selected;
      setSelected(counted);
      setReveal(revealed);
      setAnswers((prev) => [...prev.filter((a) => a.questionId !== question.id), { questionId: question.id, answer: counted }]);
    } catch (e: any) {
      setActionError(e?.message || 'Could not check the answer');
    } finally {
      setBusy(false);
    }
  };

  const onNext = () => {
    setIndex((i) => i + 1);
    setSelected(null);
    setReveal(null);
    setActionError(null);
  };

  const onSubmit = async () => {
    if (!email || !quiz) { setActionError('Please sign in to submit the quiz.'); return; }
    setBusy(true);
    setActionError(null);
    try {
      const graded = await submitQuiz(email, ageGroup, answers, quiz.weekStart);
      setResult(graded);
      try {
        setAward(await recordQuizComplete(email, ageGroup, graded.attemptId));
      } catch (e: any) {
        setAwardError(e?.message || 'Could not save your quiz points');
      }
    } catch (e: any) {
      setActionError(e?.message || 'Could not submit the quiz');
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  if (loading) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator testID="quiz-loading" size="large" color={colors.primary} />
      </View>
    );
  } else if (error || !quiz) {
    body = (
      <View style={styles.center}>
        <Feather name="wifi-off" size={28} color={colors.textDim} />
        <Text style={[styles.hint, { color: colors.textMuted }]}>{error}</Text>
        <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.primary + '60' }]} onPress={load} accessibilityRole="button">
          <Feather name="refresh-cw" size={13} color={colors.primary} />
          <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (result) {
    body = (
      <ResultView
        styles={styles} colors={colors} titleColor={titleColor}
        result={result} award={award} awardError={awardError}
        alreadyTaken={!!result.alreadySubmitted || (!!quiz.attempt && result === quiz.attempt)}
        onDone={goToDigest}
      />
    );
  } else if (questions.length === 0) {
    body = (
      <View style={[styles.emptyBox, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]} testID="quiz-empty">
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
          <Feather name="calendar" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: titleColor }]}>This week’s quiz isn’t ready yet</Text>
        <Text style={[styles.emptySub, { color: colors.textMuted }]}>A new quiz comes out every Sunday. Keep reading the daily stories!</Text>
        <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.primary + '60' }]} onPress={goToDigest} accessibilityRole="button">
          <Feather name="arrow-left" size={13} color={colors.primary} />
          <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Back to today’s stories</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (question) {
    const due = formatDueDate(quiz.dueDate);
    body = (
      <>
        <View style={styles.infoRow} testID="quiz-info">
          <Feather name="clock" size={12} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            No time limit{due ? ` · open until ${due}` : ''} · your answers are saved as you go
          </Text>
        </View>
        {resumedCount > 0 ? (
          <Text style={[styles.infoText, { color: colors.primary }]} testID="quiz-resumed">
            Welcome back! You answered {resumedCount} of {questions.length} questions. Carry on from here.
          </Text>
        ) : null}
        <View style={[styles.card, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
          <View style={styles.counterRow}>
            <Text style={[styles.counter, { color: colors.textMuted }]}>Question {index + 1} of {questions.length}</Text>
            <Text style={[styles.typeText, { color: colors.primary }]}>{QUESTION_TYPES[question.type]}</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.borderColor }]}>
            <View style={[styles.fill, { width: `${Math.round(((index + (reveal ? 1 : 0)) / questions.length) * 100)}%` }]} />
          </View>
          <CategoryBadge category={question.category} />
          <Text accessibilityRole="header" style={[styles.question, { color: titleColor }]}>{question.question}</Text>

          <View style={styles.options} accessibilityRole="radiogroup">
            {question.options.map((option, i) => {
              const isChosen = selected === i;
              const isCorrect = !!reveal && reveal.correctIndex === i;
              const isWrongChoice = !!reveal && isChosen && !reveal.correct;
              let bg = colors.surfaceSubtle;
              let border = colors.borderColor;
              if (isCorrect) { bg = colors.accentGreen + '18'; border = colors.accentGreen + '80'; }
              else if (isWrongChoice) { bg = colors.accentRed + '18'; border = colors.accentRed + '80'; }
              else if (isChosen) { bg = colors.primary + '18'; border = colors.primary; }
              return (
                <TouchableOpacity
                  key={`${question.id}-${i}`}
                  testID={`option-${i}`}
                  disabled={!!reveal || busy}
                  onPress={() => setSelected(i)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isChosen, selected: isChosen, disabled: !!reveal || busy }}
                  style={[styles.option, { backgroundColor: bg, borderColor: border }]}
                >
                  <View style={[styles.optionIdx, { backgroundColor: (isChosen ? colors.primary : colors.primary + '20') }]}>
                    <Text style={[styles.optionIdxText, { color: isChosen ? colors.onPrimary : colors.primary }]}>{OPTION_LETTERS[i]}</Text>
                  </View>
                  <Text style={[styles.optionText, { color: titleColor }]}>{option}</Text>
                  {isCorrect ? <Feather name="check" size={14} color={colors.accentGreen} /> : null}
                  {isWrongChoice ? <Feather name="x" size={14} color={colors.accentRed} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {reveal ? (
          <View
            testID="answer-feedback"
            style={[styles.feedback, {
              backgroundColor: (reveal.correct ? colors.accentGreen : colors.accentRed) + '12',
              borderColor: (reveal.correct ? colors.accentGreen : colors.accentRed) + '35',
            }]}
          >
            <View style={styles.feedbackTop}>
              <Feather name={reveal.correct ? 'check-circle' : 'info'} size={15} color={reveal.correct ? colors.accentGreen : colors.accentRed} />
              <Text style={[styles.feedbackTitle, { color: reveal.correct ? colors.accentGreen : colors.accentRed }]}>
                {reveal.correct ? 'Correct!' : `Not quite — the answer is ${OPTION_LETTERS[reveal.correctIndex]}: ${question.options[reveal.correctIndex]}`}
              </Text>
            </View>
            <Text style={[styles.body, { color: colors.textMain }]}>{reveal.explanation}</Text>
            {reveal.extraFact ? (
              <Text style={[styles.body, { color: colors.textMain }]}>
                <Text style={styles.bold}>Did you know? </Text>{reveal.extraFact}
              </Text>
            ) : null}
            {reveal.storyId ? (
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => navigation.navigate('CurrentAffairsStory', { storyId: reveal.storyId, ageGroup })}
                accessibilityRole="link"
              >
                <Feather name="book-open" size={12} color={colors.primary} />
                <Text style={[styles.link, { color: colors.primary }]}>Read the story</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {actionError ? <Text style={[styles.hint, { color: colors.accentRed }]}>{actionError}</Text> : null}

        {!reveal ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, (selected === null || busy) && styles.disabled]}
            disabled={selected === null || busy}
            onPress={onCheck}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {busy ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <Text style={styles.primaryBtnText}>Check Answer</Text>}
          </TouchableOpacity>
        ) : isLast ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, busy && styles.disabled]}
            disabled={busy}
            onPress={onSubmit}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {busy ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <Text style={styles.primaryBtnText}>Submit Quiz</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onNext} activeOpacity={0.85} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Next Question</Text>
            <Feather name="arrow-right" size={14} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.screen}>
        <Header
          title="Weekly Quiz"
          subtitle="Current Affairs"
          showSearch={false}
          compactMobileTitle
          showBack
          onBack={goToDigest}
          onMenuPress={() => navigation.openDrawer?.()}
          renderContent={mobileTitle => (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {mobileTitle}
              {body}
            </ScrollView>
          )}
        />
      </View>
    </ScreenLayout>
  );
}

function ResultView({ styles, colors, titleColor, result, award, awardError, alreadyTaken, onDone }: {
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
  titleColor: string;
  result: QuizResult;
  award: QuizCompleteResult | null;
  awardError: string | null;
  alreadyTaken: boolean;
  onDone: () => void;
}) {
  const excellent = result.percentage >= EXCELLENCE_PERCENT;
  return (
    <View style={{ gap: spacing.md }} testID="quiz-result">
      <View style={[styles.card, styles.resultCard, {
        backgroundColor: colors.cardDark,
        borderColor: colors.borderColor,
      }]}>
        <View style={[styles.bigIcon, { backgroundColor: colors.primary + '20' }]}>
          <Feather name={excellent ? 'award' : 'check-circle'} size={22} color={colors.primary} />
        </View>
        <Text style={[styles.score, { color: colors.primary }]}>{result.score}/{result.total}</Text>
        <Text style={[styles.percent, { color: colors.accentGreen }]}>{result.percentage}%</Text>
        {alreadyTaken ? <Text style={[styles.hint, { color: colors.textMuted }]}>You already took this week’s quiz — here is your result.</Text> : null}
        {award ? (
          <Text style={[styles.points, { color: colors.primary }]}>
            {award.alreadyRecorded ? 'Points for this quiz were already added.' : `+${award.pointsAwarded} points`}
          </Text>
        ) : null}
        {awardError ? <Text style={[styles.hint, { color: colors.accentRed }]}>{awardError}</Text> : null}
        {excellent ? (
          <View style={[styles.pill, { backgroundColor: colors.primary }]} testID="excellence-badge">
            <Feather name="award" size={13} color={colors.onPrimary} />
            <Text style={styles.pillText}>Excellence badge — {EXCELLENCE_PERCENT}% or more!</Text>
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.textMuted }]}>Every week is a chance to learn more. Keep reading the daily stories!</Text>
        )}
        {award?.newBadges.includes('growth') ? (
          <View style={[styles.pill, { backgroundColor: colors.accentGreen + '25' }]}>
            <Feather name="trending-up" size={13} color={colors.accentGreen} />
            <Text style={[styles.pillText, { color: colors.accentGreen }]}>Growth badge — you beat your last score!</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.primary }]}>REVIEW YOUR ANSWERS</Text>
      {result.results.map((r, i) => (
        <View key={r.questionId} style={[styles.reviewItem, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
          <View style={styles.reviewHeader}>
            <Feather name={r.correct ? 'check-circle' : 'x-circle'} size={16} color={r.correct ? colors.accentGreen : colors.accentRed} />
            <Text style={[styles.reviewQuestion, { color: titleColor }]}>{i + 1}. {r.question}</Text>
          </View>
          <Text style={[styles.reviewText, { color: colors.textMain }]}>
            Your answer: {r.selected === null ? 'not answered' : `${OPTION_LETTERS[r.selected]}. ${r.options[r.selected]}`}
          </Text>
          {!r.correct ? (
            <Text style={[styles.reviewText, { color: colors.accentGreen }]}>Correct answer: {OPTION_LETTERS[r.correctIndex]}. {r.options[r.correctIndex]}</Text>
          ) : null}
          <Text style={[styles.reviewExplain, { color: colors.textMuted }]}>{r.explanation}</Text>
        </View>
      ))}

      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onDone} activeOpacity={0.85} accessibilityRole="button">
        <Feather name="calendar" size={14} color={colors.onPrimary} />
        <Text style={styles.primaryBtnText}>Try Again Next Week</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: AppColors, isMobile: boolean) => StyleSheet.create({
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  infoText: { fontSize: 12, fontWeight: '600' },
  screen: { flex: 1, backgroundColor: c.bgDark },
  content: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: isMobile ? spacing.lg : spacing.xl, paddingBottom: 56, gap: spacing.md },
  center: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  hint: { fontSize: 13, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21 },
  bold: { fontWeight: '800' },

  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
  counterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'space-between', alignItems: 'center' },
  counter: { fontSize: 12, fontWeight: '600' },
  typeText: { fontSize: 12, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: c.primary },
  question: { fontFamily: fonts.title, fontSize: isMobile ? 19 : 22, fontWeight: '700', lineHeight: isMobile ? 25 : 29 },

  options: { gap: 8 },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1 },
  optionIdx: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  optionIdxText: { fontSize: 12, fontWeight: '800' },
  optionText: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 21, fontWeight: '500' },

  feedback: { borderRadius: 12, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  feedbackTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  link: { fontSize: 13, fontWeight: '600' },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, minHeight: 44,
  },
  primaryBtnText: { color: c.onPrimary, fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 10, borderWidth: 1,
  },
  outlineBtnText: { fontSize: 13, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: spacing.lg, borderRadius: radius.xl, borderWidth: 1, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  resultCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  bigIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 34, fontWeight: '800', fontFamily: fonts.serif },
  percent: { fontSize: 16, fontWeight: '700' },
  points: { fontSize: 15, fontWeight: '800' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  pillText: { color: c.onPrimary, fontSize: 12, fontWeight: '800' },

  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: spacing.xs },
  reviewItem: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: 4 },
  reviewHeader: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  reviewQuestion: { flex: 1, fontSize: 14, fontWeight: '700' },
  reviewText: { fontSize: 13 },
  reviewExplain: { fontSize: 12, lineHeight: 18 },
});
