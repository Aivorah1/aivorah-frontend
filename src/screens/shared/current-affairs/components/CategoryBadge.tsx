import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Category } from '../../../../services/currentAffairsApi';
import { CATEGORIES } from '../constants';
import { useTheme } from '../../../../context/ThemeContext';

// Uses the same theme-driven category chip as GK Fact.
export default function CategoryBadge({ category }: { category: Category }) {
  const cat = CATEGORIES[category];
  const { colors } = useTheme();
  const accent = colors.primary;
  return (
    <View style={[s.badge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
      <Feather name={(cat?.icon || 'radio') as any} size={11} color={accent} />
      <Text style={[s.text, { color: accent }]}>{cat?.label || category}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', flexShrink: 1, maxWidth: '100%',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  text: { fontSize: 12, lineHeight: 16, flexShrink: 1, fontWeight: '700' },
});
