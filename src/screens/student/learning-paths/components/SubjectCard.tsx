import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../context/ThemeContext';
import { cardStyles } from '../styles';
import { subjectMeta } from '../utils';
import type { SubjectData } from '../types';

export default function SubjectCard({
  data,
  completedSet,
  onPress,
  width,
  isBlocked,
  selected,
}: {
  data: SubjectData;
  completedSet: Set<string>;
  onPress: () => void;
  width: `${number}%` | number;
  isBlocked?: boolean;
  /** Parent view: marks the subject whose details are open. */
  selected?: boolean;
}) {
  const { isDark, portal, colors } = useTheme();
  // Student Portal: neutral card surfaces in both themes (no gold/tinted blocks).
  const neutral = portal === 'student' || portal === 'teacher' || portal === 'parent'; // Teacher (Phase 4) and Parent (Phase 5) reuse this card
  const meta = subjectMeta(data.subject);
  const done = data.topics.reduce((acc, topic) => acc + (completedSet.has(topic.topic) ? 1 : 0), 0);
  const pct = data.topicCount > 0 ? Math.round((done / data.topicCount) * 100) : 0;
  const accent = neutral ? colors.primary : isDark ? meta.accentDark : meta.accentLight;
  const ink = neutral ? colors.textHeading : '#1C2A28';
  const sub = neutral ? colors.textMuted : '#3A5A56';
  const chip = neutral ? colors.cardHover : '#ffffff50';
  // Founder feedback: a raw topic tally (e.g. "1906 topics") reads as overwhelming.
  // Show the curriculum's real chapter count (CBSE), else the unit count derived
  // from the topics (IB PYP). The server is the source of both.
  const chapterCount = data.chapterCount ?? data.chapters?.length ?? 0;
  const unitCount = data.unitCount ?? new Set(data.topics.map((t) => t.unit).filter(Boolean)).size;
  const countLabel =
    chapterCount > 0 ? `${chapterCount} ${chapterCount === 1 ? 'chapter' : 'chapters'}`
    : unitCount > 0 ? `${unitCount} ${unitCount === 1 ? 'unit' : 'units'}`
    : data.topicCount > 0 && data.topicCount <= 40 ? `${data.topicCount} topics`
    : '';

  return (
    <TouchableOpacity style={[cardStyles.touch, { width }]} activeOpacity={isBlocked ? 1 : 0.86} onPress={isBlocked ? undefined : onPress}>
      <LinearGradient
        colors={neutral ? [colors.cardDark, colors.cardDark] : [meta.bgFromDark, meta.bgToDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[cardStyles.gradient, { borderColor: neutral ? colors.borderColor : accent + '40' }, selected && { borderColor: accent, borderWidth: 2 }]}
      >
        <View style={cardStyles.topRow}>
          <View style={[cardStyles.iconWrap, { backgroundColor: chip }]}>
            <Feather name={meta.icon} size={18} color={accent} />
          </View>
          <View style={[cardStyles.pctPill, { borderColor: accent + '88', backgroundColor: chip }]}>
            <Text style={[cardStyles.pctText, { color: accent }]}>{pct}%</Text>
          </View>
        </View>
        <Text testID="subject-card-name" style={[cardStyles.subjectName, { color: ink }]} numberOfLines={3}>{data.subject}</Text>
        {!!data.books?.length && (
          <Text testID="subject-card-book" style={[cardStyles.statMini, { color: sub }]} numberOfLines={2}>{data.books.join(' · ')}</Text>
        )}
        <View style={cardStyles.statRow}>
          <Text style={[cardStyles.statMini, { color: sub }]}>{countLabel}</Text>
          <Text style={[cardStyles.statMini, { color: sub }]}>{done} completed</Text>
        </View>
        <View style={[cardStyles.track, { backgroundColor: neutral ? colors.cardHover : accent + '40' }]}>
          <View style={[cardStyles.fill, { width: `${pct}%`, backgroundColor: accent }]} />
        </View>

        {isBlocked && (
          <View style={cardStyles.blockedOverlay}>
            <View style={cardStyles.blockedBadge}>
              <Feather name="lock" size={14} color="#fff" />
              <Text style={cardStyles.blockedText}>Blocked by parent</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
