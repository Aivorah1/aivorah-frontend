import React, { useState } from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';

interface Props {
  week: { iso: string; day: string; date: number }[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  todaySelected?: boolean;
  onOpenCalendar?: () => void;
  calendarOpen?: boolean;
  styles: any;
  colors: AppColors;
}

export default function WeekNavBar({ week, onPrevWeek, onNextWeek, onToday, todaySelected, onOpenCalendar, calendarOpen, styles, colors }: Props) {
  const [todayHovered, setTodayHovered] = useState(false);
  const [todayFocused, setTodayFocused] = useState(false);
  return (
    <View style={styles.weekNavBar}>
      <TouchableOpacity
        style={styles.navArrow}
        onPress={onPrevWeek}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Previous week"
        testID="schedule-prev-week"
      >
        <Feather name="chevron-left" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      <Pressable
        style={({ pressed }) => [styles.todayBtn, todaySelected && styles.todayBtnActive, (todayHovered || pressed) && styles.todayBtnHovered, todayFocused && styles.todayBtnFocused]}
        onPress={onToday}
        onHoverIn={() => setTodayHovered(true)}
        onHoverOut={() => setTodayHovered(false)}
        onFocus={() => setTodayFocused(true)}
        onBlur={() => setTodayFocused(false)}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Today"
        accessibilityState={{ selected: !!todaySelected }}
        testID="schedule-today-button"
      >
        <Text style={[styles.todayBtnText, todaySelected && styles.todayBtnTextActive]}>Today</Text>
      </Pressable>
      <Text style={styles.weekLabel} testID="schedule-week-label">
        {week[0].day} {week[0].date} — {week[6].day} {week[6].date}
      </Text>
      <TouchableOpacity
        style={styles.navArrow}
        onPress={onNextWeek}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Next week"
        testID="schedule-next-week"
      >
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {!!onOpenCalendar && (
        <TouchableOpacity
          style={styles.calendarNavBtn}
          onPress={onOpenCalendar}
          accessibilityRole="button"
          accessibilityLabel="Choose a date"
          accessibilityState={{ expanded: !!calendarOpen }}
          testID="schedule-date-picker-button"
        >
          <Feather name="calendar" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
