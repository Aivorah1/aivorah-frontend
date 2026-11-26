import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Icon from '../../../../components/common/Icon';
import type { AppColors } from '../../../../theme';
import { studentShapeColors } from '../../../../theme';
import { formatStudyTime } from '../utils/dashboardHelpers';

// Class Progress (Website Redesign, Phase 4): three coloured bars — Learning
// Path, Assignments, Challenges — with their real percentages first, then the
// class's study time (overall, lowest / typical / highest) underneath.
export default function ClassProgressCard({
  colors, isDark = false, totalStudents,
  classProgressPct, medianCombinedMins, minCombinedMins, maxCombinedMins,
  avgProgress, totalAssignmentsSubmitted, totalAssignmentsAssigned, assignSubmitPct,
  totalChallengesCompleted, totalChallengesAssigned, challCompletePct,
  styles, onOpen,
}: {
  colors: AppColors;
  isDark?: boolean;
  gold?: string;
  ringTrack?: string;
  totalStudents: number;
  classProgressPct: number;
  medianCombinedMins: number;
  minCombinedMins: number;
  maxCombinedMins: number;
  avgProgress: number;
  totalAssignmentsSubmitted: number;
  totalAssignmentsAssigned: number;
  assignSubmitPct: number;
  totalChallengesCompleted: number;
  totalChallengesAssigned: number;
  challCompletePct: number;
  styles: any;
  /** Opens Student Progress (the chevron in the card header). */
  onOpen?: () => void;
}) {
  const shapes = isDark ? studentShapeColors.dark : studentShapeColors.light;
  const bars = [
    { icon: 'map', label: 'Learning Path', value: `${avgProgress}%`, pct: avgProgress, color: shapes.green },
    { icon: 'clipboard-check', label: 'Assignments', value: `${totalAssignmentsSubmitted}/${totalAssignmentsAssigned} · ${assignSubmitPct}%`, pct: assignSubmitPct, color: shapes.blue },
    { icon: 'target', label: 'Challenges', value: `${totalChallengesCompleted}/${totalChallengesAssigned} · ${challCompletePct}%`, pct: challCompletePct, color: shapes.orange },
  ];
  const motion = Platform.OS === 'web' ? ({ transitionProperty: 'width', transitionDuration: '500ms' } as any) : null;

  return (
    <View style={[styles.card, styles.topCard ?? styles.flex1]}>
      <TouchableOpacity style={styles.cardHeader} onPress={onOpen} disabled={!onOpen} activeOpacity={0.75}
        accessibilityRole={onOpen ? 'button' : undefined} accessibilityLabel={onOpen ? 'Class Progress, open Student Progress' : undefined}>
        <Icon name="chart-no-axes-column" size={20} color={colors.accentOrange} />
        <Text style={styles.cardTitle}>Class Progress</Text>
        {onOpen && <Icon name="chevron-right" size={20} color={colors.textMuted} />}
      </TouchableOpacity>

      <View style={{ gap: 14 }}>
        {bars.map((b) => (
          <View key={b.label} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={b.icon} size={15} color={colors.textMuted} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.textMain }}>{b.label}</Text>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.textHeading }}>{b.value}</Text>
            </View>
            <View style={{ height: 10, borderRadius: 999, backgroundColor: colors.borderColor, overflow: 'hidden' }}
              accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: b.pct }}>
              <View style={[{ height: '100%', borderRadius: 999, width: `${Math.max(b.pct, 2)}%` as any, backgroundColor: b.color }, motion]} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderColor, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textHeading }}>{classProgressPct}%</Text>
          <Text style={{ fontSize: 12.5, color: colors.textMuted }}>overall</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textHeading, marginLeft: 10 }}>{formatStudyTime(medianCombinedMins)}</Text>
          <Text style={{ fontSize: 12.5, color: colors.textMuted }}>Typical Study Time</Text>
        </View>
        {totalStudents > 1 && (
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.accentRed }}>{formatStudyTime(minCombinedMins)}</Text>
              <Text style={{ fontSize: 11, color: colors.textDim, fontWeight: '600', marginTop: 1 }}>Lowest</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.borderColor }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textHeading }}>{formatStudyTime(medianCombinedMins)}</Text>
              <Text style={{ fontSize: 11, color: colors.textDim, fontWeight: '600', marginTop: 1 }}>Typical</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.accentGreen }}>{formatStudyTime(maxCombinedMins)}</Text>
              <Text style={{ fontSize: 11, color: colors.textDim, fontWeight: '600', marginTop: 1 }}>Highest</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
