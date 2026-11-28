import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import { CAL_DAYS, MONTH_NAMES } from '../constants';

interface Props {
  calYear: number;
  calMonth: number;
  calWeeks: (number | null)[][];
  todayISO: string;
  selectedISO?: string;
  week: { iso: string; day: string; date: number }[];
  eventDates: Set<string>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (year: number, month: number, day: number) => void;
  styles: any;
  colors: AppColors;
}

export default function MiniCalendar({
  calYear, calMonth, calWeeks, todayISO, selectedISO, week, eventDates,
  onPrevMonth, onNextMonth, onSelectDate, styles, colors,
}: Props) {
  const [focusedControl, setFocusedControl] = useState<string | null>(null);
  const focusProps = (id: string) => ({
    onFocus: () => setFocusedControl(id),
    onBlur: () => setFocusedControl(null),
  });
  return (
    <View style={styles.sideCard}>
      <View style={styles.calHeader}>
        <TouchableOpacity
          onPress={onPrevMonth}
          style={[styles.monthArrow, focusedControl === 'prev' && styles.calendarFocus]}
          {...focusProps('prev')}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          testID="schedule-minical-prev-month"
        >
          <Feather name="chevron-left" size={16} color={colors.textDim} />
        </TouchableOpacity>
        <Text style={styles.calMonth} accessibilityLiveRegion="polite">{MONTH_NAMES[calMonth - 1]} {calYear}</Text>
        <TouchableOpacity
          onPress={onNextMonth}
          style={[styles.monthArrow, focusedControl === 'next' && styles.calendarFocus]}
          {...focusProps('next')}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Next month"
          testID="schedule-minical-next-month"
        >
          <Feather name="chevron-right" size={16} color={colors.textDim} />
        </TouchableOpacity>
      </View>
      <View style={styles.calDayHeaders}>
        {CAL_DAYS.map(d => <Text key={d} style={styles.calDayHeader}>{d}</Text>)}
      </View>
      {calWeeks.map((row, wi) => (
        <View key={wi} style={styles.calWeek}>
          {row.map((day, di) => {
            if (day === null) return <View key={di} style={styles.calDate} />;
            const dStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dStr === todayISO;
            const isSelected = dStr === selectedISO;
            const inWeek = week.some(w => w.iso === dStr);
            const hasEvent = eventDates.has(dStr);
            return (
              <TouchableOpacity
                key={di}
                style={[styles.calDate, inWeek && styles.calDateWeekHighlight, isToday && styles.calDateToday, isSelected && styles.calDateSelected, focusedControl === dStr && styles.calendarFocus]}
                {...focusProps(dStr)}
                onPress={() => onSelectDate(calYear, calMonth, day)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Select date ${dStr}`}
                accessibilityHint={isToday ? 'Today' : undefined}
                accessibilityState={{ selected: isSelected }}
                testID={`schedule-minical-date-${dStr}`}
              >
                <Text style={[styles.calDateText, isToday && styles.calDateTextToday, isSelected && styles.calDateTextSelected]}>{day}</Text>
                {hasEvent && <View style={[styles.calDot, { backgroundColor: isSelected ? colors.onPrimary : colors.accentYellow }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
