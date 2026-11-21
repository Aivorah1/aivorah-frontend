/**
 * QuizScreen.tsx
 * Practice for any topic. Opens on a start page - Take a Test / History - then:
 * - Take a Test: a new test (questions + the spoken explanation) with every
 *   question on one scrolling page, answered in any order, then its results
 * - History: every past test for this topic by date & time; tap one for its report
 * - Generates mixed MCQ + fill-in-the-blank questions via Groq (/ibpyp/quiz)
 * - MCQ wrong → hint available → retry (up to 2 attempts) → explanation
 * - Fill-blank: 3-attempt nudge logic (wrong1 → retry, wrong2 → hint, wrong3 → reveal)
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { useTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext';
import { useStudentData } from '../../../../context/StudentDataContext';
import ScreenLayout from '../../../../components/common/ScreenLayout';

import { makeStyles } from './styles';
import { useQuiz } from './hooks/useQuiz';
import QuizResult from './components/QuizResult';
import { useNextTopic } from './hooks/useNextTopic';
import QuizQuestionList from './components/QuizQuestionList';
import { PracticeStart, PracticeHistoryList, formatTakenAt } from './components/PracticeHome';
import { usePracticeHistory, useAttemptExplanations } from './hooks/usePracticeHistory';
import type { PastAttempt } from './resultCache';
import WrongQuestionActions from '../practice-followup/components/WrongQuestionActions';
import { useWorkedOn } from '../practice-followup/hooks/useWorkedOn';

// The drawer keeps this screen mounted, so coming back would show the last test's
// questions/results. Each new visit gets a fresh session (new questions).
export default function QuizScreen({ navigation, route }: any) {
  const [visit, setVisit] = useState(0);
  const left = useRef(false);
  useEffect(() => {
    const offBlur = navigation.addListener?.('blur', () => { left.current = true; });
    const offFocus = navigation.addListener?.('focus', () => {
      if (!left.current) return;
      left.current = false;
      setVisit(v => v + 1);
    });
    return () => { offBlur?.(); offFocus?.(); };
  }, [navigation]);
  return <QuizSession key={visit} navigation={navigation} route={route} />;
}

function QuizSession({ navigation, route }: any) {
  const { topic, grade = 'Grade 3', subject = 'Mathematics', curriculum = 'IB PYP', returnTo, returnParams, passageText, topicId, keyPoints, practiceQuiz } = route?.params ?? {};
  // Whoever launched this quiz — SubjectTopics by default, but LessonScreen's
  // Practice tab passes its own returnTo/returnParams so back lands there
  // instead of always dumping the student back on the topic list.
  // Drawer uses backBehavior="history": navigate() would push the origin on top
  // of Quiz, so the origin's own back button would reopen these results.
  const goBackToOrigin = () => {
    const target = returnTo ?? 'SubjectTopics';
    const state = navigation.getState?.();
    const history = (state?.history ?? []).filter((h: any) => h.type === 'route');
    const prevKey = history[history.length - 2]?.key;
    const prevName = state?.routes?.find((r: any) => r.key === prevKey)?.name;
    if (prevName === target) navigation.goBack();
    else if (returnTo) navigation.navigate(returnTo, returnParams);
    else navigation.navigate('SubjectTopics', { subject, grade, curriculum });
  };
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { studentId, completeLesson, addXP, recordStudySeconds, recordQuizResult } = useStudentData();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const accent = colors.accentYellow;

  const quiz = useQuiz({
    topic, grade, subject, curriculum, passageText, topicId, keyPoints, practiceQuiz,
    // B004 fix: track-attempt needs the real resolved student id
    // (StudentDataContext.studentId, from POST /user/sync), not AuthContext's
    // user.id — that field is never populated on the real user object, which
    // silently skipped every attempt POST (score/XP still showed correctly
    // via completeLesson(), which already used the right id).
    userEmail: user?.email, userRole: user?.role, studentId,
    navigation, completeLesson, addXP, recordStudySeconds, recordQuizResult,
  });

  const nextTopic = useNextTopic(subject, curriculum, grade, topic);

  // Start page / History / one past test's report (while no test is running)
  const history = usePracticeHistory(studentId, subject, topic);
  const [view, setView] = useState<'start' | 'history' | 'report'>('start');
  const [pastAttempt, setPastAttempt] = useState<PastAttempt | null>(null);
  const pastExplanations = useAttemptExplanations(view === 'report' ? pastAttempt : null, { topic, subject, grade });
  const pastExplanationsRef = useRef<Record<number, string>>({});
  const [pastStartedAt, setPastStartedAt] = useState(0);
  const openHistory = () => { history.reload(); setView('history'); quiz.backToHub(); };

  // ── Explain This Question / Practise This Skill ─────────────────
  // Under each wrong question, for the exact original attempt: the test just
  // finished (once saved) or the past one opened from History.
  const reportAttemptId = quiz.phase === 'result' ? quiz.savedAttemptId : (view === 'report' ? pastAttempt?.id : null);
  const workedOn = useWorkedOn(reportAttemptId);
  useEffect(() => {
    // Back from Ask Aivorah: show the latest "What you worked on".
    const off = navigation.addListener?.('focus', () => workedOn.reload());
    return () => off?.();
  }, [navigation, workedOn.reload]);
  const openCoach = (questionIndex: number, coachMode: 'explain' | 'practice') => {
    if (!reportAttemptId) return;
    const lessonParams = returnTo === 'LessonScreen' && returnParams
      ? returnParams
      : { subject, grade, curriculum, topicId, topicName: topic };
    navigation.navigate('LessonScreen', {
      ...lessonParams, mode: 'ask', attemptId: reportAttemptId, questionIndex, coachMode, followupNonce: Date.now(),
      followupReturn: { params: { ...(route?.params || {}), openAttemptId: undefined, openNonce: undefined } },
    });
  };
  const wrongActions = (quiz.phase === 'result' && quiz.attemptSaveFailed) ? undefined : (idx: number) => (
    <WrongQuestionActions
      index={idx}
      ready={!!reportAttemptId}
      saving={quiz.phase === 'result' && !quiz.savedAttemptId}
      workedOn={workedOn.byIndex[idx]}
      onExplain={(i) => openCoach(i, 'explain')}
      onPractise={(i) => openCoach(i, 'practice')}
      colors={colors}
    />
  );
  const wrongLabel = (idx: number) => workedOn.byIndex[idx]?.skillLabel || null;

  // "Back to Test Report" from Ask Aivorah: open that exact past report.
  const openAttemptId = route?.params?.openAttemptId as string | undefined;
  const openNonce = route?.params?.openNonce;
  const openedRef = useRef<unknown>(null);
  useEffect(() => {
    if (!openAttemptId || openedRef.current === openNonce || history.loading) return;
    const a = history.attempts.find((x) => x.id === openAttemptId);
    if (!a) return;
    openedRef.current = openNonce;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navigation param → open that report
    setPastAttempt(a);
    setPastStartedAt(Date.now() - (a.timeSpentSeconds || 0) * 1000);
    setView('report');
  }, [openAttemptId, openNonce, history.loading, history.attempts]);
  const takeTest = () => { setView('start'); quiz.startTest(history.nextAttemptNumber); };

  // ── Start page / History / past report ─────────────────────────
  if (quiz.phase === 'hub') {
    const menu = () => navigation.openDrawer();
    if (view === 'report' && pastAttempt) {
      return (
        <QuizResult
          topic={topic}
          score={pastAttempt.correctAnswers}
          questions={pastAttempt.questions}
          perQuestionResults={pastAttempt.questions}
          resultExplanations={pastExplanations}
          explanationsRef={pastExplanationsRef}
          attemptNumber={pastAttempt.attemptNumber || 1}
          quizStartTime={pastStartedAt}
          colors={colors}
          isDark={isDark}
          styles={styles}
          onRetry={takeTest}
          onBack={() => setView('history')}
          onMenuPress={menu}
          onHistory={() => setView('history')}
          takenAt={formatTakenAt(pastAttempt.createdAt)}
          review
          wrongActions={wrongActions}
          wrongLabel={wrongLabel}
        />
      );
    }
    if (view === 'history') {
      return (
        <PracticeHistoryList
          topic={topic} subject={subject} colors={colors}
          attempts={history.attempts} loading={history.loading} error={history.error}
          onOpen={(a) => { setPastAttempt(a); setPastStartedAt(Date.now() - (a.timeSpentSeconds || 0) * 1000); setView('report'); }}
          onRetry={history.reload}
          onTakeTest={takeTest}
          onBack={() => setView('start')}
          onMenuPress={menu}
        />
      );
    }
    return (
      <PracticeStart
        topic={topic} subject={subject} colors={colors}
        attempts={history.attempts} loading={history.loading}
        onTakeTest={takeTest}
        onHistory={() => setView('history')}
        onBack={goBackToOrigin}
        onMenuPress={menu}
      />
    );
  }

  // ── Loading ────────────────────────────────────────────────────
  if (quiz.phase === 'loading') return (
    <ScreenLayout>
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Preparing your practice test…</Text>
      </View>
    </ScreenLayout>
  );

  // ── Results ────────────────────────────────────────────────────
  if (quiz.phase === 'result') {
    return (
      <QuizResult
        topic={topic}
        score={quiz.score}
        questions={quiz.questions}
        perQuestionResults={quiz.perQuestionResultsRef.current}
        resultExplanations={quiz.resultExplanations}
        explanationsRef={quiz.explanationsRef}
        attemptNumber={quiz.attemptNumber}
        quizStartTime={quiz.quizStartTimeRef.current}
        colors={colors}
        isDark={isDark}
        styles={styles}
        onRetry={() => quiz.fetchQuiz(true)}
        onBack={goBackToOrigin}
        onMenuPress={() => navigation.openDrawer()}
        nextTopic={nextTopic.next}
        nextTopicLoading={nextTopic.loading}
        onNextTopic={(next) => navigation.navigate('LessonScreen', next.params)}
        onHistory={openHistory}
        wrongActions={wrongActions}
        wrongLabel={wrongLabel}
      />
    );
  }

  // ── Quiz: every question on one page ─────────────────────────
  return (
    <QuizQuestionList
      questions={quiz.questions}
      answers={quiz.answers}
      results={quiz.perQuestionResultsRef.current}
      answeredCount={quiz.answeredCount}
      allAnswered={quiz.allAnswered}
      topic={topic}
      subject={subject}
      colors={colors}
      isDark={isDark}
      styles={styles}
      onMcqAnswer={quiz.handleMcqAnswer}
      setFillInput={quiz.setFillInput}
      onFillSubmit={quiz.handleFillSubmit}
      onFinish={quiz.finish}
      onBack={goBackToOrigin}
      onMenuPress={() => navigation.openDrawer()}
      spokenText={quiz.spokenText}
      setSpokenText={quiz.setSpokenText}
      spokenStatus={quiz.spokenStatus}
      spokenError={quiz.spokenError}
      onSpokenSubmit={quiz.submitSpoken}
      reasoningByIndex={quiz.reasoningByIndex}
      setReasoningByIndex={quiz.setReasoning}
      toggleReasoningVoiceByIndex={quiz.toggleReasoningVoice}
      listeningIndex={quiz.listeningIndex}
    />
  );
}
