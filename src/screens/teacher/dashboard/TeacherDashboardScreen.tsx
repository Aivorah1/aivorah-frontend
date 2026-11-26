import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, Modal, Platform, Pressable } from 'react-native';
import ActivityIndicator from '../../../components/common/AivorahLoader';
import { spacing, radius, fonts } from '../../../theme';
import type { AppColors } from '../../../theme';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../hooks/useResponsive';

import { useTeacherDashboardData } from './hooks/useTeacherDashboardData';
import { buildDashboardStats } from './utils/buildDashboardStats';
import { useTeacherTopicHelp } from './hooks/useTeacherTopicHelp';
import Icon from '../../../components/common/Icon';
import { WelcomeShapes } from '../../../components/common/WelcomeShapes';
import AISuggestedActionCard from './components/AISuggestedActionCard';
import StudentOverviewCard from './components/StudentOverviewCard';
import ClassProgressCard from './components/ClassProgressCard';
import InsightsColumns from './components/InsightsColumns';
import TeachingInsightsSummaryCard from './components/TeachingInsightsSummaryCard';
import { renderLearningPathModal } from './components/modals/LearningPathModals';
import { renderAssignmentModal } from './components/modals/AssignmentModals';
import { renderChallengeModal } from './components/modals/ChallengeModals';

// ─────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────
export default function TeacherDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const gold = colors.accentYellow;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { students, loading, refreshing, setRefreshing, insights, activityFeed, fetchStudents } =
    useTeacherDashboardData(user?.email);

  // Classes this teacher teaches: distinct grade / section among their students,
  // else the grades on their profile.
  const classesCount = useMemo(() => {
    const keys = new Set(students.map((s: any) => [s.grade, s.section].filter(Boolean).join(' ')).filter(Boolean));
    return keys.size || (user as any)?.teaches?.length || 0;
  }, [students, user]);
  const scrollRef = React.useRef<ScrollView | null>(null);
  const [columnsY, setColumnsY] = useState(0);

  const topicHelp = useTeacherTopicHelp();
  const stats = useMemo(
    () => buildDashboardStats(students, insights, activityFeed, gold, topicHelp),
    [students, insights, activityFeed, gold, topicHelp]
  );

  const {
    totalStudents, allNeedsAttention, needSupport, activeToday, avgProgress,
    medianCombinedMins, minCombinedMins, maxCombinedMins,
    totalAssignmentsAssigned, totalAssignmentsSubmitted, assignSubmitPct,
    totalChallengesAssigned, totalChallengesCompleted, challCompletePct, classProgressPct,
    totalStudyMins, assignStats, challStats,
    studentsWithSubmissions, classAvgScore, studentsCompletedChallenge, studentsWithChallenges,
    learningPathTiles, assignmentTiles, challengeTiles, aiInsightTiles,
    recentStudents, aiActionTitle, aiActionBody,
  } = stats;

  // ── Insight detail modal ───────────────────────────────
  const [insightModal, setInsightModal] = useState<null | { tileIndex: number }>(null);

  function renderInsightModalContent(tileIndex: number) {
    const tile = aiInsightTiles[tileIndex];
    if (!tile) return null;
    const ctx = {
      tile, students, allNeedsAttention, assignStats, challStats,
      classAvgScore, studentsWithSubmissions, studentsWithChallenges, studentsCompletedChallenge,
      totalStudyMins, styles, colors, onClose: () => setInsightModal(null),
      needSupport,
      onViewProgress: (studentId?: string, skillId?: string) => {
        setInsightModal(null);
        navigation.navigate('TeacherProgress', studentId ? { studentId, skillId, skillNonce: Date.now() } : undefined);
      },
    };
    if (tileIndex <= 3) return renderLearningPathModal(tileIndex, ctx);
    if (tileIndex <= 6) return renderAssignmentModal(tileIndex, ctx);
    return renderChallengeModal(tileIndex, ctx);
  }

  if (loading) {
    return (
      <ScreenLayout>
        <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color={colors.accentYellow} size="large" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.screen}>
        {/* Website Redesign, Phase 4: the board's dashboard header. */}
        <Header
          title="Teacher Dashboard"
          subtitle="Welcome back! Here's an overview of your classes, student progress, and AI teaching insights."
          searchPlaceholder="Search students, assignments..."
          onMenuPress={() => navigation.openDrawer()}
          notificationCount={allNeedsAttention.length || undefined}
          actions={
            <Pressable
              testID="dashboard-new-assignment"
              onPress={() => navigation.navigate('TeacherAssignments' as any, { openNew: Date.now() })}
              accessibilityRole="button"
              accessibilityLabel="New Assignment"
              style={(state: any) => [styles.newAssignBtn, isMobile && styles.newAssignCompact, (state.hovered || state.focused) && { borderColor: colors.textHeading }]}
            >
              <Icon name="plus" size={isMobile ? 18 : 17} color={colors.textHeading} />
              {/* On phones the header row is full, so the button shows its icon only. */}
              {!isMobile && <Text style={styles.newAssignText}>New Assignment</Text>}
            </Pressable>
          }
        />

        <ScrollView
          testID="dashboard-scroll"
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStudents(); }} tintColor={colors.accentYellow} />}
        >
          {/* ── Top row (the board): Student Overview · Class Progress · AI Teaching Insights ── */}
          <View style={styles.topRowWrap}>
            <View pointerEvents="none" style={styles.topShapes}>
              <WelcomeShapes isDark={isDark} />
            </View>
            <View style={styles.topRow}>
              <StudentOverviewCard
                colors={colors}
                gold={gold}
                isDark={isDark}
                totalStudents={totalStudents}
                classesCount={classesCount}
                activeToday={activeToday}
                needsAttentionCount={allNeedsAttention.length}
                recentStudents={recentStudents}
                styles={styles}
                navigation={navigation}
              />

              <ClassProgressCard
                colors={colors}
                isDark={isDark}
                totalStudents={totalStudents}
                classProgressPct={classProgressPct}
                medianCombinedMins={medianCombinedMins}
                minCombinedMins={minCombinedMins}
                maxCombinedMins={maxCombinedMins}
                avgProgress={avgProgress}
                totalAssignmentsSubmitted={totalAssignmentsSubmitted}
                totalAssignmentsAssigned={totalAssignmentsAssigned}
                assignSubmitPct={assignSubmitPct}
                totalChallengesCompleted={totalChallengesCompleted}
                totalChallengesAssigned={totalChallengesAssigned}
                challCompletePct={challCompletePct}
                styles={styles}
                onOpen={() => navigation.navigate('TeacherProgress' as any)}
              />

              <TeachingInsightsSummaryCard
                colors={colors}
                isDark={isDark}
                suggestion={aiActionTitle}
                learningPathTiles={learningPathTiles}
                assignmentTiles={assignmentTiles}
                challengeTiles={challengeTiles}
                onTilePress={(tileIndex) => setInsightModal({ tileIndex })}
                onSeeAll={() => scrollRef.current?.scrollTo({ y: columnsY, animated: true })}
                styles={styles}
              />
            </View>
          </View>

          {/* AI Suggested Action — web-only on Android/iOS. Contains the
              "Create First Assignment" call-to-action; native teacher flow
              starts from the Assignments screen instead. */}
          {Platform.OS === 'web' && (
            <AISuggestedActionCard
              title={aiActionTitle}
              body={aiActionBody}
              hasNeedsAttention={allNeedsAttention.length > 0}
              avgProgress={avgProgress}
              styles={styles}
              navigation={navigation}
            />
          )}

          <View onLayout={(e) => setColumnsY(e.nativeEvent.layout.y)}>
            <InsightsColumns
              gold={gold}
              learningPathTiles={learningPathTiles}
              assignmentTiles={assignmentTiles}
              challengeTiles={challengeTiles}
              onTilePress={(tileIndex) => setInsightModal({ tileIndex })}
              styles={styles}
            />
          </View>

          {/* Recent Activity has been moved to the Student Overview card */}

        </ScrollView>
      </View>

      {/* ── Insight Detail Modal ───────────────────────── */}
      <Modal testID="insight-modal" visible={!!insightModal} transparent animationType="fade" onRequestClose={() => setInsightModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, [1, 4, 6].includes(insightModal?.tileIndex as number) && { maxWidth: 720 }]}>
            {insightModal && renderInsightModalContent(insightModal.tileIndex)}
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
export const makeStyles = (c: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bgDark },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 48 },

  // Website Redesign, Phase 4: the suggested action is a calm card with the
  // homepage shapes in its corner and a burnt-orange / pale-blue primary pill.
  aiCard: {
    backgroundColor: c.cardDark,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.borderColor,
    padding: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    gap: spacing.lg,
    shadowColor: '#302117', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  aiTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, zIndex: 1 },
  aiIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: c.tintPeach,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  aiTag: { fontSize: 12, fontWeight: '700', color: c.textMuted, letterSpacing: 1, marginBottom: 4 },
  aiTitle: { fontSize: 22, fontWeight: '600', color: c.textHeading, marginBottom: 6, letterSpacing: -0.3, fontFamily: fonts.serif },
  aiSub: { fontSize: 14.5, color: c.textMuted, lineHeight: 21 },
  aiBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.primary, alignSelf: 'flex-start',
    minHeight: 46, paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 999, zIndex: 1,
  },
  aiBtnText: { fontSize: 15, fontWeight: '700', color: c.onPrimary },
  aiBtnSecondary: { backgroundColor: c.cardDark, borderWidth: 1.5, borderColor: c.textHeading },
  aiBtnSecondaryText: { color: c.textHeading },

  row: { flexDirection: 'row', gap: spacing.md },
  // Website Redesign, Phase 4 — the board's top row of three cards; they wrap
  // to two / one per row as the screen narrows.
  topRowWrap: { position: 'relative', paddingTop: 30, marginBottom: spacing.xl },
  topShapes: { position: 'absolute', top: -4, right: 0, width: 250, height: 110 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, alignItems: 'stretch' },
  topCard: { flexGrow: 1, flexBasis: 300, minWidth: 0, overflow: 'hidden', position: 'relative' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 24 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21, color: c.textMain },
  newAssignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 16,
    borderRadius: 999, borderWidth: 1.5, borderColor: c.borderColor, backgroundColor: c.cardDark,
  },
  newAssignText: { fontSize: 14.5, fontWeight: '700', color: c.textHeading },
  newAssignCompact: { width: 36, minHeight: 36, paddingHorizontal: 0, justifyContent: 'center' },
  flex1: { flex: 1 },
  card: {
    backgroundColor: c.cardDark, borderWidth: 1,
    borderColor: c.borderColor, borderRadius: 22, padding: 20,
    shadowColor: '#302117', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.lg, zIndex: 1 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: c.textHeading, flex: 1, fontFamily: fonts.serif, letterSpacing: -0.2 },
  cardSub: { fontSize: 11, color: c.textDim, marginBottom: spacing.md, fontWeight: '500' },

  bigNumber: { fontSize: 40, fontWeight: '700', color: c.textHeading, letterSpacing: -1 },
  changeText: { fontSize: 13.5, fontWeight: '600', marginTop: 2, marginBottom: 2 },
  overviewLabel: { fontSize: 13, color: c.textMuted, marginBottom: spacing.md },
  overviewDivider: { height: 1, backgroundColor: c.borderColor, marginBottom: spacing.md },
  overviewRow: { flexDirection: 'row' },
  overviewStat: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  overviewVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  overviewKey: { fontSize: 12.5, color: c.textMuted, textAlign: 'center', marginTop: 2 },

  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  donutWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutPct: { fontSize: 14, fontWeight: '800', letterSpacing: -0.5 },
  donutStats: { flex: 1 },
  donutStatVal: { fontSize: 15, fontWeight: '800', color: c.textMain },
  donutStatLabel: { fontSize: 10, color: c.textDim, marginTop: 1 },

  // 3 progress bars (Learning Path, Assignments, Challenges)
  progressBars: { gap: spacing.sm },
  progressItem: { gap: 3 },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  progressLabel: { flex: 1, fontSize: 10, fontWeight: '600', color: c.textMuted },
  progressPct: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressTimeLabel: { fontSize: 9, fontWeight: '600', color: c.textDim },

  insightRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md, alignItems: 'flex-start' },
  insightBorder: { borderBottomWidth: 1, borderBottomColor: c.borderColor },
  insightIcon: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightTitle: { fontSize: 12, fontWeight: '700', color: c.textMain, marginBottom: 3 },
  insightBody: { fontSize: 11, color: c.textMuted, lineHeight: 16 },

  // AI Teaching Insights — Aivorah Enchanting Forest card
  insightsCard: {
    backgroundColor: c.cardDark,
    borderWidth: 1, borderColor: c.borderColor,
    borderRadius: 22, overflow: 'hidden', paddingTop: 10,
  },
  insightsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs,
  },
  insightsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  insightsIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: c.accentYellow + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  insightsTitle: { fontSize: 13, fontWeight: '700', color: c.textMain, letterSpacing: -0.2 },

  // Filter tabs — pill style, Enchanting Forest
  filterRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
    borderColor: c.borderColor,
    backgroundColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: c.accentYellow + '18',
    borderColor: c.accentYellow + '40',
  },
  filterTabText: { fontSize: 11, fontWeight: '600', color: c.textDim },
  filterTabTextActive: { color: c.accentYellow, fontWeight: '700' },

  // Summary strip — compact horizontal stats
  summaryStrip: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: c.accentYellow + '18',
    borderWidth: 1, borderColor: c.accentYellow + '12',
    marginBottom: spacing.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 14, fontWeight: '800', color: c.textMain, letterSpacing: -0.3 },
  summaryLabel: { fontSize: 8, fontWeight: '600', color: c.textDim, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 1 },
  summaryDivider: { width: 1, height: 22, backgroundColor: c.borderColor },

  // 3-column insight layout
  insightCols: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  insightCol: { flex: 1, paddingHorizontal: spacing.xs },
  insightColBorder: { borderLeftWidth: 1, borderLeftColor: c.borderColor },
  colHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingBottom: 6, marginBottom: 2,
    borderBottomWidth: 1, borderBottomColor: c.borderColor,
  },
  colHeaderText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  colRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6,
  },
  colRowBorder: { borderBottomWidth: 1, borderBottomColor: c.borderColor + '50' },
  colRowIcon: {
    width: 24, height: 24, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  colRowTitle: { fontSize: 12, fontWeight: '700', color: c.textMain },
  colRowSub: { fontSize: 10, color: c.textDim, marginTop: 1 },
  colRowStat: { fontSize: 13, fontWeight: '900', letterSpacing: -0.3, flexShrink: 0 },

  // Keep tileGrid for modal use (legacy)
  tileGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
  },
  // Tile styles (used in modals)
  tileIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: c.textMain },

  qaScroll: { marginHorizontal: -spacing.xl },
  qaContent: { paddingHorizontal: spacing.xl, gap: spacing.md },
  qaItem: { alignItems: 'center', gap: 7, width: 76 },
  qaIcon: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  qaLabel: { fontSize: 11, fontWeight: '600', color: c.textMuted, textAlign: 'center' },

  activityCard: { backgroundColor: c.cardDark, borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.lg, overflow: 'hidden' },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  actBorder: { borderBottomWidth: 1, borderBottomColor: c.borderColor },
  actAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actInitials: { fontSize: 12, fontWeight: '800' },
  actInfo: { flex: 1 },
  actName: { fontSize: 13, fontWeight: '600', color: c.textMain },
  actAction: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  actRight: { alignItems: 'flex-end', gap: 4 },
  scorePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  scoreText: { fontSize: 11, fontWeight: '700' },
  actTime: { fontSize: 11, color: c.textDim },

  actRowCompact: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  actBorderCompact: { borderBottomWidth: 1, borderBottomColor: c.borderColor + '40' },
  actAvatarCompact: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actInitialsCompact: { fontSize: 10, fontWeight: '800' },
  actInfoCompact: { flex: 1 },
  actNameCompact: { fontSize: 12, fontWeight: '600', color: c.textMain },
  actActionCompact: { fontSize: 10, color: c.textMuted, marginTop: 1 },
  actRightCompact: { alignItems: 'flex-end', gap: 2 },
  scorePillCompact: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  scoreTextCompact: { fontSize: 9, fontWeight: '700' },
  actTimeCompact: { fontSize: 9, color: c.textDim },

  // Modal — centered, Enchanting Forest themed
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)', padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: c.cardDark, borderRadius: radius.lg,
    borderWidth: 1, borderColor: c.borderColor,
    maxHeight: '70%', width: '100%', maxWidth: 440,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: c.accentYellow + '18',
    borderBottomWidth: 1, borderBottomColor: c.borderColor,
  },
  modalStat: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  modalHeading: { fontSize: 11, fontWeight: '600', color: c.textMuted, marginTop: 1 },
  modalClose: {
    padding: 4, borderRadius: 8,
    backgroundColor: c.borderColor + '40',
  },
  modalScroll: { paddingHorizontal: 0 },
  modalEmpty: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  modalEmptyText: { fontSize: 12, color: c.textDim, textAlign: 'center' },
  modalAvatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modalAvatarText: { fontSize: 10, fontWeight: '800' },
  modalRowBorder: { borderBottomWidth: 1, borderBottomColor: c.borderColor },

  // Table layout — compact
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 6,
    backgroundColor: c.bgDark,
    borderBottomWidth: 1, borderBottomColor: c.borderColor,
  },
  tableCol: { fontSize: 9, fontWeight: '700', color: c.textDim, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: spacing.md,
  },
  tableRowAlt: { backgroundColor: c.accentYellow + '08' },
  tableCell: {},
  tableStudentName: { fontSize: 12, fontWeight: '700', color: c.textMain },
  tableStudentGrade: { fontSize: 9, color: c.textDim, marginTop: 1 },
  tableChip: {
    fontSize: 9, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 5, borderWidth: 1, alignSelf: 'flex-start',
  },
  pctPill: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, borderWidth: 1,
  },
  pctPillText: { fontSize: 10, fontWeight: '800' },
});
