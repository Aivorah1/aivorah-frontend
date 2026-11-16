/**
 * WorldAndYouScreen.tsx
 * "The World & You" — GK facts, On This Day, Current Affairs
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { spacing, radius } from '../../../theme';
import type { AppColors } from '../../../theme';

import { useWorldData } from './hooks/useWorldData';
import DailyTidbitCard from './components/DailyTidbitCard';
import OnThisDayCard from './components/OnThisDayCard';
import ImportantDayCard from './components/ImportantDayCard';
import { useImportantDay } from './hooks/useImportantDay';
import type { GKFact } from './types';
import BrainTeaserCard from './components/BrainTeaserCard';
import { TEAL } from './constants';
import CurrentAffairsTab from '../../shared/current-affairs/components/CurrentAffairsTab';

export default function WorldAndYouScreen({ navigation, route }: any) {
  const { colors, isDark } = useTheme();
  const { user }           = useAuth();
  const styles             = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const grade = user?.grade || 'Grade 3';
  const [activeTab, setActiveTab] = useState<'world' | 'news'>(
    (route?.params?.tab as 'world' | 'news') || 'world'
  );

  const { fact, puzzle, loading: worldLoading } = useWorldData(grade);
  const { importantDay, loading: dayLoading }   = useImportantDay();

  // If opened directly (no history) default to Current Affairs tab when the
  // route param says so; otherwise stay on the World tab.
  useEffect(() => {
    if (route?.params?.tab === 'news') setActiveTab('news');
  }, [route?.params?.tab]);

  if (worldLoading && !fact) {
    return (
      <ScreenLayout>
        <View style={styles.center}>
          <ActivityIndicator color={TEAL} size="large" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Header title="The World & You" navigation={navigation} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.pad}>
        {/* Tabs */}
        <View style={styles.tabRow}>
          <TabButton label="World" active={activeTab === 'world'} onPress={() => setActiveTab('world')} colors={colors} />
          <TabButton label="Current Affairs" active={activeTab === 'news'} onPress={() => setActiveTab('news')} colors={colors} />
        </View>

        {activeTab === 'world' ? (
          <>
            {fact && <DailyTidbitCard fact={fact} />}
            {importantDay && <ImportantDayCard day={importantDay} />}
            <OnThisDayCard date={new Date()} colors={colors} />
            {puzzle && <BrainTeaserCard puzzle={puzzle} />}
          </>
        ) : (
          <CurrentAffairsTab navigation={navigation} />
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

function TabButton({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: AppColors }) {
  return (
    <View
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.tab,
        { backgroundColor: active ? TEAL : colors.cardDark, borderColor: colors.borderColor },
      ]}
    >
      <Text style={{ color: active ? '#fff' : colors.textMuted, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: AppColors, isDark: boolean) {
  return StyleSheet.create({
    scroll: { flex: 1 },
    pad:    { padding: spacing.md, paddingBottom: spacing.xl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tabRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center',
      borderWidth: 1,
    },
  });
}
