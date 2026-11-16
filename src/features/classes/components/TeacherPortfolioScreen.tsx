/**
 * Teacher sidebar > Resources > Portfolio. Its own page; there is no Portfolio
 * feature yet, so it is just the page shell with a "Portfolio" heading. (It
 * used to forward to the class Portfolio or My Classes, which made the
 * sidebar item land on My Classes.)
 */
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useTheme } from '../../../context/ThemeContext';
import type { AppColors } from '../../../theme';

export default function TeacherPortfolioScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScreenLayout>
      <View style={styles.screen} testID="teacher-portfolio">
        <Header title="Portfolio" onMenuPress={() => navigation?.openDrawer?.()} />
      </View>
    </ScreenLayout>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgDark },
  });
}
