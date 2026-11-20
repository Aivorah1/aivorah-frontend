/**
 * Class detail — the Class Portfolio feed for one grade+section. Announcements
 * and Assignments already have their own dedicated nav entries/screens
 * elsewhere in the app, so this screen doesn't duplicate them — Portfolio is
 * the one thing that's genuinely new and specific to a class.
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useTheme } from '../../../context/ThemeContext';
import type { AppColors } from '../../../theme';
import PortfolioFeed from '../../class-portfolio/components/PortfolioFeed';

export default function ClassDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { grade, section, label, code, classTeacherEmail, postId } = route?.params || {};
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  return (
    <ScreenLayout>
      <View style={styles.screen}>
        <Header title={label || 'Class'} subtitle={code || ''} onMenuPress={() => navigation?.openDrawer?.()} />
        {isTeacher && !!grade && !!section && (
          // My Classes → class → its students' reports (marks + learning report downloads).
          <TouchableOpacity
            onPress={() => navigation?.navigate?.('TeacherStudentReport', { grade, section, nonce: Date.now() })}
            accessibilityRole="button" testID="class-student-reports" style={styles.reportsBtn}>
            <Feather name="file-text" size={14} color={colors.accentYellow} />
            <Text style={[styles.reportsText, { color: colors.accentYellow }]}>Student Reports</Text>
          </TouchableOpacity>
        )}
        <PortfolioFeed grade={grade} section={section} classTeacherEmail={classTeacherEmail} initialOpenPostId={postId} />
      </View>
    </ScreenLayout>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgDark },
    reportsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderColor: colors.accentYellow, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    reportsText: { fontSize: 13, fontWeight: '800' },
  });
}
