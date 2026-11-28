import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../../../theme';
import type { AppColors } from '../../../theme';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useAuth } from '../../../context/AuthContext';
import { useStudentData, xpForNextLevel } from '../../../context/StudentDataContext';
import { useTheme } from '../../../context/ThemeContext';

import { useWeeklyActivity } from './hooks/useWeeklyActivity';
import { useStudentSubjectProgress } from '../learning-paths/hooks/useStudentSubjectProgress';
import { subjectColor, subjectIcon, computeMaxMinutes, computeAchievements } from './utils/progressCalculations';
import { ProgressHero } from './components/ProgressHero';
import { WeeklyActivityCard } from './components/WeeklyActivityCard';
import { SubjectPerformanceSection } from './components/SubjectPerformanceSection';
import { CompletedTopicsSection } from './components/CompletedTopicsSection';
import { AchievementsGrid } from './components/AchievementsGrid';

// ── Main Screen ───────────────────────────────────────────────

export default function ProgressScreen({ navigation }: any) {
  const { user } = useAuth();
  const { stats, studentId, statsLoading, statsLoadError, refreshStats, activityRevision } = useStudentData();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const weekly = useWeeklyActivity(studentId, activityRevision);
  const { weeklyDays } = weekly;

  // ── Derived real values ───────────────────────────────────

  const completedSet = useMemo(() => new Set((stats.completedTopics ?? []).filter(Boolean)), [stats.completedTopics]);
  const subjects = useStudentSubjectProgress(user?.curriculum ?? '', user?.grade ?? '', completedSet, user?.email);
  const showProgress = !statsLoading && !statsLoadError && !subjects.loading && !subjects.warning;
  const totalChapters = subjects.progress.reduce((sum, item) => sum + item.totalChapters, 0);
  const completedChapters = subjects.progress.reduce((sum, item) => sum + item.completedChapters, 0);
  const subjectStats = subjects.progress.map(({ subject, ...metrics }) => ({
    ...metrics,
    pct: showProgress ? metrics.pct : null,
    name: subject.subject,
    color: subjectColor(subject.subject),
    icon: subjectIcon(subject.subject),
  }));

  // Weekly bar chart — real study minutes per day
  const maxMinutes = useMemo(() => computeMaxMinutes(weeklyDays), [weeklyDays]);

  // XP level progress
  const xpInfo = xpForNextLevel(stats.xpPoints);
  const xpProgress = xpInfo.current / xpInfo.needed;

  const achievements = useMemo(() => computeAchievements(stats, completedSet.size), [stats, completedSet]);

  if (statsLoading) {
    return (
      <ScreenLayout>
        <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={colors.accentYellow} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading your progress…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.screen}>
        <Header
          title="My Progress"
          compactMobileTitle
          subtitle={`Track your growth and achievements, ${firstName}.`}
          searchPlaceholder="Search topics or stats..."
          onMenuPress={() => navigation.openDrawer()}
          renderContent={mobileTitle => (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {mobileTitle}

              {statsLoadError && (
                <TouchableOpacity
                  style={styles.loadErrorBanner}
                  onPress={refreshStats}
                  activeOpacity={0.8}
                  testID="stats-load-error-banner"
                >
                  <Feather name="wifi-off" size={16} color="#C8551C" />
                  <Text style={styles.loadErrorText}>
                    Couldn&apos;t load your latest progress. Tap to retry.
                  </Text>
                  <Feather name="refresh-cw" size={14} color="#C8551C" />
                </TouchableOpacity>
              )}

              {!statsLoadError && <ProgressHero
                styles={styles}
                overallPct={showProgress ? subjects.overallPct : null}
                completedCount={completedSet.size}
                completedChapters={completedChapters}
                totalChapters={showProgress && subjects.overallPct !== null ? totalChapters : 0}
                currentStreak={stats.currentStreak}
                level={stats.level}
                xpPoints={stats.xpPoints}
                studyTimeMinutes={stats.studyTimeMinutes}
                xpCurrent={xpInfo.current}
                xpNeeded={xpInfo.needed}
                xpProgress={xpProgress}
              />}

              {weekly.error ? (
                <TouchableOpacity style={styles.loadErrorBanner} accessibilityRole="button" onPress={weekly.retry}>
                  <Text style={styles.loadErrorText}>Couldn&apos;t load weekly activity. Tap to retry.</Text>
                </TouchableOpacity>
              ) : weekly.loading ? (
                <Text style={styles.emptyText}>Loading weekly activity…</Text>
              ) : <WeeklyActivityCard
                styles={styles}
                colors={colors}
                weeklyDays={weeklyDays}
                maxMinutes={maxMinutes}
              />}

              <SubjectPerformanceSection styles={styles} subjectStats={subjectStats} navigation={navigation}
                loading={subjects.loading} error={subjects.error || subjects.warning} onRetry={subjects.retry} />

              {!statsLoadError && <CompletedTopicsSection styles={styles} colors={colors} completedSet={completedSet} />}

              {!statsLoadError && <AchievementsGrid styles={styles} colors={colors} achievements={achievements} />}

            </ScrollView>
          )}
        />
      </View>
    </ScreenLayout>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (c: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bgDark },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 40 },

  loadErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: c.accentYellowGlow,
    borderWidth: 1,
    borderColor: c.borderColor,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  loadErrorText: { flex: 1, fontSize: 12, fontWeight: '600', color: c.accentRed },

  heroBanner: {
    backgroundColor: c.cardDark,
    borderWidth: 1,
    borderColor: c.borderColor,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  heroPct: { fontSize: 22, fontWeight: '800', color: c.textMain },
  heroCircleLabel: { fontSize: 12, color: c.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  heroText: { alignItems: 'center', marginBottom: spacing.lg },
  heroTitle: { fontSize: 17, fontWeight: '700', color: c.textMain, textAlign: 'center', marginBottom: 6, fontFamily: fonts.serif },
  heroSub: { fontSize: 12, color: c.textMuted, textAlign: 'center', lineHeight: 18 },
  xpLabel: { fontSize: 13, color: c.textMuted, fontWeight: '600' },
  xpTrack: { height: 6, backgroundColor: c.cardHover, borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 3, backgroundColor: c.primary },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: spacing.md },
  heroStat: { alignItems: 'center', gap: 4, minWidth: 70 },
  heroStatVal: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  heroStatLabel: { fontSize: 12, color: c.textMuted },

  glassCard: {
    backgroundColor: c.cardDark,
    borderWidth: 1,
    borderColor: c.borderColor,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  cardTitle: { fontSize: 14, fontWeight: '600', color: c.textMain },

  emptyBar: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 12, color: c.textMuted, textAlign: 'center', lineHeight: 18 },

  barChart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 6, marginBottom: spacing.lg },
  barItem: { flex: 1, alignSelf: 'stretch', alignItems: 'center', gap: 2 },
  barMinute: { fontSize: 12, color: c.textDim, fontWeight: '600', height: 14 },
  barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barActive: { shadowColor: c.primary, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, shadowOpacity: 0.5 },
  barLabel: { fontSize: 12, color: c.textMuted },

  weekTotals: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: c.borderColor, paddingTop: spacing.lg },
  weekTotal: { flex: 1, alignItems: 'center', gap: 2 },
  weekTotalVal: { fontSize: 16, fontWeight: '700' },
  weekTotalLabel: { fontSize: 13, color: c.textMuted, textAlign: 'center' },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: c.textMain, marginBottom: spacing.lg },
  seeAll: { fontSize: 13, fontWeight: '600' },

  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xxl },
  subjectCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: c.cardDark,
    borderWidth: 1,
    borderColor: c.borderColor,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
  },
  subjectIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontSize: 13, fontWeight: '600', color: c.textMain },
  subjectStats: { marginTop: 'auto', gap: 6 },
  subjectScore: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  progressTrack: { height: 4, backgroundColor: c.borderColor, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  subjectMeta: { fontSize: 13, color: c.textMuted },

  topicsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xxl },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.cardHover,
    borderWidth: 1,
    borderColor: c.borderColor,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 200,
  },
  topicChipText: { flexShrink: 1, fontSize: 12, fontWeight: '600', color: c.textMain },

  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: 20 },
  achieveCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: c.cardDark,
    borderWidth: 1,
    borderColor: c.borderColor,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  achieveCardLocked: { opacity: 0.6 },
  unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  unlockedBadgeText: { fontSize: 12, fontWeight: '700' },
  achieveIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  achieveLabel: { fontSize: 12, fontWeight: '600', color: c.textMain, textAlign: 'center' },
  lockedText: { fontSize: 12, color: c.textDim, fontWeight: '600' },

  // ── Rewards ─────────────────────────────────────────────────
  creditsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md,
  },
  creditsLeft:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  creditsIconCircle:{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  creditsCount:     { fontSize: 28, fontWeight: '800' },
  creditsLabel:     { fontSize: 12, fontWeight: '600', marginTop: 1 },
  xpConvertBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  xpConvertText:    { fontSize: 13, fontWeight: '700' },

  taglineRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.lg,
  },
  taglineText: { fontSize: 12, lineHeight: 18, flex: 1, fontStyle: 'italic' },

  merchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: 32 },
  merchCard: {
    width: '47%', borderWidth: 1, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm, alignItems: 'center',
  },
  merchIcon:        { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  merchLabel:       { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  merchDesc:        { fontSize: 13, textAlign: 'center' },
  merchCreditRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  merchCreditText:  { fontSize: 13, fontWeight: '700' },
  comingSoonBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  comingSoonBtnText:{ fontSize: 13, fontWeight: '600' },
});
