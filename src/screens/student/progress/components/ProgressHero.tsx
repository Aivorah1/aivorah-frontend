import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../../../../theme';
import { RingProgress } from './RingProgress';
import { formatStudyTime } from '../../../../context/StudentDataContext';
import { useTheme } from '../../../../context/ThemeContext';

export function ProgressHero({
  styles, overallPct, completedCount, masteredChapters, totalChapters, currentStreak, level, xpPoints,
  studyTimeMinutes, xpCurrent, xpNeeded, xpProgress,
}: {
  styles: any;
  overallPct: number;
  completedCount: number;
  masteredChapters: number;
  totalChapters: number;
  currentStreak: number;
  level: number;
  xpPoints: number;
  studyTimeMinutes: number;
  xpCurrent: number;
  xpNeeded: number;
  xpProgress: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.heroBanner}>
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <RingProgress progress={overallPct / 100} color="#C8551C" size={100} strokeWidth={9} />
          <View style={StyleSheet.absoluteFill as any} pointerEvents="none">
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.heroPct}>{overallPct}%</Text>
              <Text style={styles.heroCircleLabel}>OVERALL</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.heroText}>
        <Text style={styles.heroTitle}>
          {/* overallPct (mastery %) can be 0 even with real progress (completed
              topics, study time) — a mastered chapter needs every topic in it,
              so base the greeting on whether the student has actually done
              anything yet, not just on mastery reaching 0%. */}
          {completedCount === 0 && studyTimeMinutes === 0
            ? 'Ready to start learning!'
            : overallPct < 50
            ? 'Great start, keep going!'
            : overallPct < 80
            ? 'Amazing progress this week!'
            : 'Outstanding work!'}
        </Text>
        <Text style={styles.heroSub}>
          {totalChapters > 0 ? `${masteredChapters} of ${totalChapters} chapters mastered · ` : ''}{currentStreak}-day streak · Level {level}
        </Text>
      </View>
      {/* XP bar */}
      <View style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={styles.xpLabel}>XP to Level {level + 1}</Text>
          <Text style={[styles.xpLabel, { color: colors.accentOrange }]}>{xpCurrent} / {xpNeeded}</Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${xpProgress * 100}%` as any }]} />
        </View>
      </View>
      <View style={styles.heroStats}>
        {[
          { val: formatStudyTime(studyTimeMinutes), label: 'Study Time',   color: colors.primary },
          { val: xpPoints.toLocaleString(),          label: 'XP Points',   color: colors.accentOrange },
          { val: String(currentStreak),              label: 'Day Streak',  color: colors.accentOrange },
          { val: String(completedCount),             label: 'Topics Done', color: colors.accentGreen },
          { val: String(Math.floor(xpPoints / 100)), label: 'Credits',     color: colors.primary },
        ].map((s) => (
          <View key={s.label} style={styles.heroStat}>
            <Text style={[styles.heroStatVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.heroStatLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
