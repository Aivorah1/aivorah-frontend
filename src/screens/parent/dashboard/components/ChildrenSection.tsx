import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import type { ChildData } from '../types';
import ChildCard from './ChildCard';

export default function ChildrenSection({
  childrenList, childrenLoading, selectedChild, onSelectChild, onViewCreds, onAddChild,
  isWide, colors, s,
}: {
  childrenList: ChildData[]; childrenLoading: boolean; selectedChild: ChildData;
  onSelectChild: (c: ChildData) => void; onViewCreds: (c: ChildData) => void;
  onAddChild: () => void; isWide: boolean; colors: AppColors; s: any;
}) {
  const child = selectedChild;

  return (
    <View style={[s.childSection, isWide && { flex: 1 }]}>
      <Text style={s.sectionTitle}>My Children</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.childScroll}>
        {childrenLoading ? (
          <ActivityIndicator color={colors.accentYellow} style={{ marginTop: 40, marginLeft: 8 }} />
        ) : childrenList.length === 0 ? (
          <View testID="parent-no-children" style={{ minWidth: 260, maxWidth: 420, alignItems: 'center', gap: 8, paddingVertical: 20, paddingHorizontal: 16 }}>
            <Feather name="book-open" size={34} color={colors.primary} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textHeading, textAlign: 'center' }}>No children linked yet</Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center' }}>
              Add a child to track learning, tasks, attendance and progress.
            </Text>
            <TouchableOpacity onPress={onAddChild} activeOpacity={0.8} accessibilityRole="button"
              style={{ marginTop: 6, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.primary }}>
              <Feather name="plus" size={18} color={colors.onPrimary} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.onPrimary }}>Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {childrenList.map(ch => (
              <ChildCard
                key={ch.id} child={ch}
                isSelected={selectedChild.id === ch.id}
                onPress={() => onSelectChild(ch)}
                onViewCreds={onViewCreds}
                colors={colors} s={s}
              />
            ))}
            <TouchableOpacity style={s.addChildBtn} onPress={onAddChild} activeOpacity={0.7}>
              <Feather name="plus" size={20} color={colors.textDim} />
              <Text style={s.addChildText}>Add Child</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Child interest insights ── */}
      {child.id ? (() => {
        const mins = child.studyTimeMinutes ?? 0;
        const streak = child.currentStreak ?? 0;
        const topics = child.completedTopics ?? [];
        const lastLesson = child.lastLesson || '';

        const subjectCounts: Record<string, number> = {};
        topics.forEach((t: string) => {
          const sub = t.split('|')[0] || t;
          subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
        });
        const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
          || (lastLesson ? lastLesson.split('·')[0]?.trim() : null)
          || 'Learning';

        const learnerType = streak >= 5 ? 'Consistent Learner' : mins >= 120 ? 'Deep Explorer' : child.assignmentsDone >= 3 ? 'Assignment Star' : 'Getting Started';
        const learnerIcon: any = streak >= 5 ? 'award' : mins >= 120 ? 'compass' : child.assignmentsDone >= 3 ? 'check-circle' : 'sunrise';

        const studyHint = mins >= 60
          ? `${Math.round(mins / 60)}h logged this month`
          : mins > 0 ? `${mins}m logged so far` : 'No sessions yet';

        return (
          <View style={s.insightChipsCol}>
            <View style={s.insightChip}>
              <View style={s.insightChipIcon}><Feather name="book-open" size={13} color={colors.accentYellow} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.insightChipTitle}>Top Interest</Text>
                <Text style={s.insightChipBody}>{topSubject}</Text>
              </View>
            </View>
            <View style={s.insightChip}>
              <View style={s.insightChipIcon}><Feather name={learnerIcon} size={13} color={colors.accentYellow} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.insightChipTitle}>Learning Style</Text>
                <Text style={s.insightChipBody}>{learnerType}</Text>
              </View>
            </View>
            <View style={s.insightChip}>
              <View style={s.insightChipIcon}><Feather name="clock" size={13} color={colors.accentYellow} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.insightChipTitle}>Study Time</Text>
                <Text style={s.insightChipBody}>{studyHint}</Text>
              </View>
            </View>
          </View>
        );
      })() : null}
    </View>
  );
}
