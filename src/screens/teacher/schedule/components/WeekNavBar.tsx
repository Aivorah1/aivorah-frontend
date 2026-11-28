import React from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import type { WeekDay } from '../types';

interface Props {
  colors: AppColors;
  styles: any;
  week: WeekDay[];
  weekBase: Date;
  setWeekBase: (d: Date) => void;
  goToday: () => void;
  selectedISO?: string;
  onSelectDate?: (iso: string) => void;
  action?: React.ReactNode;
  compact?: boolean;
}

const rangeFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export default function WeekNavBar({ colors, styles, week, weekBase, setWeekBase, goToday, selectedISO, onSelectDate, action, compact }: Props) {
  const first = new Date(week[0].iso + 'T12:00:00');
  const last = new Date(week[6].iso + 'T12:00:00');
  const formatter = compact && first.getFullYear() === last.getFullYear() ? dateFormat : rangeFormat;
  return (
    <View style={styles.weekControls}>
      {compact && action && <View style={styles.mobileWeekAction}>{action}</View>}
      <View style={styles.weekToolbar}>
        <View style={[styles.weekNavBar, compact && styles.mobileWeekNavBar]}>
          <TouchableOpacity testID="teacher-schedule-prev-week" accessibilityRole="button" accessibilityLabel="Previous week" style={styles.navArrow} onPress={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}>
            <Feather name="chevron-left" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity testID="teacher-schedule-today-button" accessibilityRole="button" style={styles.todayBtn} onPress={goToday}>
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
          <Text testID="teacher-schedule-week-label" style={styles.weekLabel} accessibilityLabel={`${rangeFormat.format(first)} to ${rangeFormat.format(last)}`}>
            {formatter.format(first)} — {formatter.format(last)}
          </Text>
          <TouchableOpacity testID="teacher-schedule-next-week" accessibilityRole="button" accessibilityLabel="Next week" style={styles.navArrow} onPress={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {!compact && action}
      </View>
      {onSelectDate && (
        <View style={styles.dateStrip}>
          {week.map(day => {
            const date = new Date(day.iso + 'T12:00:00');
            const selected = selectedISO === day.iso;
            return (
              <TouchableOpacity key={day.iso} testID={`teacher-schedule-date-${day.iso}`}
                accessibilityRole="button" accessibilityLabel={rangeFormat.format(date)}
                accessibilityState={{ selected }} {...(Platform.OS === 'web' ? { 'aria-pressed': selected } : {})}
                onPress={() => onSelectDate(day.iso)} style={[styles.dateButton, selected && styles.dateButtonSelected]}>
                <Text style={[styles.dateDay, selected && styles.dateTextSelected]}>{day.day}</Text>
                <Text style={[styles.dateNumber, selected && styles.dateTextSelected]}>{dateFormat.format(date)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
