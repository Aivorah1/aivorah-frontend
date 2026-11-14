/**
 * Teacher sidebar > Resources > Portfolio. No portfolio of its own: it opens
 * the existing class Portfolio (ClassDetailScreen) of the teacher's home class,
 * exactly as tapping that class in My Classes does. With no home class, or
 * more than one, it opens My Classes so the teacher can choose.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useTheme } from '../../../context/ThemeContext';
import { fonts, radius } from '../../../theme';
import type { AppColors } from '../../../theme';
import { fetchMyClasses } from '../api/classesApi';

export default function TeacherPortfolioScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [error, setError] = useState('');

  const open = useCallback(async () => {
    setError('');
    try {
      const classes = await fetchMyClasses();
      if (classes.length === 1) {
        const c = classes[0];
        navigation?.navigate?.('ClassDetail', {
          grade: c.grade, section: c.section, label: c.label, code: c.code, classTeacherEmail: c.classTeacherEmail,
        });
      } else {
        navigation?.navigate?.('MyClasses');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load your class');
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => { open(); }, [open]));

  return (
    <ScreenLayout>
      <View style={styles.screen}>
        <Header title="Portfolio" subtitle="Your class portfolio" onMenuPress={() => navigation?.openDrawer?.()} />
        <View style={styles.center}>
          {error ? (
            <>
              <Feather name="alert-circle" size={28} color={colors.textDim} />
              <Text style={styles.text}>{error}</Text>
              <TouchableOpacity onPress={open} style={styles.retryBtn} accessibilityRole="button">
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ActivityIndicator color={colors.accentYellow} testID="portfolio-loading" />
          )}
        </View>
      </View>
    </ScreenLayout>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgDark },
    center: { alignItems: 'center', paddingTop: 56, gap: 10 },
    text: { fontFamily: fonts.serif, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
    retryBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderColor },
    retryText: { fontFamily: fonts.serif, fontSize: 12.5, fontWeight: '700', color: colors.accentYellow },
  });
}
