import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from '../../../../components/common/Icon';
import { spacing } from '../../../../theme';
import { useTheme } from '../../../../context/ThemeContext';

export default function AISuggestedActionCard({
  title, body, hasNeedsAttention, avgProgress, styles, navigation,
}: {
  title: string;
  body: string;
  hasNeedsAttention: boolean;
  avgProgress: number;
  styles: any;
  navigation: any;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.aiCard, { marginBottom: spacing.xl }]}>
      <View style={styles.aiTop}>
        <View style={styles.aiIconWrap}>
          <Icon name="sparkles" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiTag}>AI SUGGESTED ACTION</Text>
          <Text style={styles.aiTitle}>{title}</Text>
          <Text style={styles.aiSub}>{body}</Text>
        </View>
      </View>
      <View style={styles.aiBtnRow}>
        {hasNeedsAttention ? (
          <>
            <TouchableOpacity style={styles.aiBtn} activeOpacity={0.85} accessibilityRole="button" onPress={() => navigation.navigate('TeacherSchedule' as any)}>
              <Icon name="calendar-plus" size={17} color={colors.onPrimary} />
              <Text style={styles.aiBtnText}>Schedule Study Hour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.aiBtn, styles.aiBtnSecondary]}
              activeOpacity={0.85}
              accessibilityRole="button"
              onPress={() => navigation.navigate('TeacherAssignments' as any)}
            >
              <Icon name="circle-plus" size={17} color={colors.textHeading} />
              <Text style={[styles.aiBtnText, styles.aiBtnSecondaryText]}>Assign Practice Task</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.aiBtn} activeOpacity={0.85} accessibilityRole="button" onPress={() => navigation.navigate('TeacherAssignments' as any)}>
            <Icon name="circle-plus" size={17} color={colors.onPrimary} />
            <Text style={styles.aiBtnText}>
              {avgProgress > 0 ? 'Assign Task / Quiz' : 'Create First Assignment'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
