import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../../../../theme';
import { RingProgress } from './RingProgress';
import { formatStudyTime } from '../../../../context/StudentDataContext';
import { useTheme } from '../../../../context/ThemeContext';

export function ProgressHero({
  styles, overallPct, completedCount, completedChapters, totalChapters, currentStreak, level, xpPoints,
  studyTimeMinutes, xpCurrent, xpNeeded, xpProgress,
}: {
  styles: any;
  overallPct: number | null;
  completedCount: number;
  completedChapters: number;
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
          <RingProgress progress={(overallPct ?? 0) / 100} color="#C8551C" size={100} strokeWidth={9} />
          <View style={StyleSheet.absoluteFill as any} pointerEvents="none">
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.heroPct}>{overallPct === null ? '—' : `${overallPct}%`}</Text>
              <Text style={styles.heroCircleLabel}>TOPICS</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.heroText}>
        <Text style={styles.heroTitle}>
          {completedCount === 0 && studyTimeMinutes === 0
            ? 'Ready to start learning!'
            : overallPct === null || overallPct < 50
            ? 'Great start, keep going!'
            : overallPct < 80
            ? 'Amazing progress!'
            : 'Outstanding work!'}
        </Text>
        <Text style={styles.heroSub}>
          {totalChapters > 0 ? `${completedChapters} of ${totalChapters} chapters complete · ` : ''}{currentStreak}-day streak · Level {level}
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
          { val: formatStudyTime(studyTimeMinutes), label: 'All-time Study', color: colors.primary },
          { val: xpPoints.toLocaleString(),          label: 'All-time XP',    color: colors.accentOrange },
          { val: String(currentStreak),              label: 'Day Streak',  color: colors.accentOrange },
          { val: String(completedCount),             label: 'All-time Topics', color: colors.accentGreen },
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
