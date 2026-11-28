import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../../../../theme';
import { formatStudyTime } from '../../../../context/StudentDataContext';
import type { DayActivity } from '../types';


export function WeeklyActivityCard({
  styles, colors, weeklyDays, maxMinutes,
}: {
  styles: any;
  colors: any;
  weeklyDays: DayActivity[];
  maxMinutes: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const totals = weeklyDays.reduce((sum, day) => ({
    minutes: sum.minutes + day.studyMinutes,
    xp: sum.xp + day.xp,
    topics: sum.topics + day.topicsCompleted,
  }), { minutes: 0, xp: 0, topics: 0 });
  return (
    <View style={[styles.glassCard, { marginBottom: spacing.xxl }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Weekly Activity</Text>
      </View>
      {weeklyDays.every(d => d.studyMinutes === 0 && d.xp === 0 && d.topicsCompleted === 0) ? (
        <View style={styles.emptyBar}>
          <Feather name="bar-chart-2" size={28} color={colors.textDim} />
          <Text style={styles.emptyText}>No activity yet this week.{'\n'}Complete lessons to see your chart!</Text>
        </View>
      ) : (
        <View style={styles.barChart}>
          {weeklyDays.map((d) => {
            const heightPct = maxMinutes > 0 ? (d.studyMinutes / maxMinutes) * 100 : 0;
            const isToday = d.date === today;
            const active = d.studyMinutes > 0;
            return (
              <View key={d.date} style={styles.barItem}>
                <Text style={[styles.barMinute, active && { color: colors.accentOrange }]}>
                  {active ? `${d.studyMinutes}m` : ''}
                </Text>
                <View style={styles.barWrapper}>
                  {/* Yellow = studied that day; today is marked by an outline + dot, not a different fill. */}
                  <View style={[
                    styles.bar,
                    { height: `${Math.max(heightPct, 6)}%` as any, backgroundColor: active ? colors.accentYellow : colors.borderColor },
                    isToday && { borderWidth: 2, borderColor: colors.accentOrange },
                  ]} />
                </View>
                <Text style={[styles.barLabel, isToday && { color: colors.accentOrange, fontWeight: '700' }]}>{d.day}</Text>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: isToday ? colors.accentOrange : 'transparent' }} />
              </View>
            );
          })}
        </View>
      )}
      {/* Weekly totals */}
      <View style={styles.weekTotals}>
        {[
          { label: 'Total Study', val: formatStudyTime(totals.minutes), color: colors.primary },
          { label: 'XP Earned', val: `+${totals.xp}`, color: colors.accentOrange },
          { label: 'Topics This Week', val: String(totals.topics), color: colors.accentOrange },
        ].map(s => (
          <View key={s.label} style={styles.weekTotal}>
            <Text style={[styles.weekTotalVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.weekTotalLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
