import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ReportClasses, ReportClassRef } from '../services/studentReportApi';
import type { StudentReportStyles } from '../styles';

const same = (a: ReportClassRef | null, b: ReportClassRef) => !!a && a.grade === b.grade && a.section === b.section;

/**
 * Only the teacher's own classes: "Home Class" first (if they are a homeroom
 * teacher), then each grade they teach; picking a grade shows only the
 * sections they teach in it.
 */
export default function ClassSelector({ classes, selected, grade, onPickGrade, onPickHomeClass, onPickSection, styles, colors }: {
  classes: ReportClasses;
  selected: ReportClassRef | null;
  /** The grade picked in the grade row; null while a Home Class is selected. */
  grade: string | null;
  onPickGrade: (grade: string) => void;
  onPickHomeClass: (c: ReportClassRef) => void;
  onPickSection: (c: ReportClassRef) => void;
  styles: StudentReportStyles;
  colors: any;
}) {
  const sections = classes.grades.find((g) => g.grade === grade)?.sections || [];
  const chip = (key: string, label: string, active: boolean, onPress: () => void, icon: string, testID: string) => (
    <TouchableOpacity
      key={key}
      testID={testID}
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Feather name={icon as any} size={14} color={active ? colors.accentYellow : colors.textDim} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.selectorBlock}>
      <View style={styles.chipRow}>
        {classes.homeClasses.map((h) => chip(
          `home-${h.grade}-${h.section}`,
          classes.homeClasses.length > 1 ? `Home Class · ${h.label}` : 'Home Class',
          same(selected, h) && grade === null,
          () => onPickHomeClass({ grade: h.grade, section: h.section }),
          'home',
          `report-home-${h.grade}-${h.section}`,
        ))}
        {classes.grades.map((g) => chip(
          `grade-${g.grade}`, g.grade, grade === g.grade, () => onPickGrade(g.grade), 'book-open', `report-grade-${g.grade}`,
        ))}
      </View>
      {grade !== null && sections.length > 0 && (
        <View style={styles.chipRow}>
          {sections.map((s) => chip(
            `sec-${grade}-${s.section}`,
            s.section ? `Section ${s.section}` : 'No section',
            same(selected, { grade, section: s.section }),
            () => onPickSection({ grade, section: s.section }),
            'users',
            `report-section-${grade}-${s.section}`,
          ))}
        </View>
      )}
    </View>
  );
}
