import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export function CompletedTopicsSection({ styles, colors, completedSet }: {
  styles: any;
  colors: any;
  completedSet: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);
  if (completedSet.size === 0) return null;
  return (
    <>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitle}>Completed Topics ({completedSet.size})</Text>
        {completedSet.size > 6 && <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} activeOpacity={0.7}>
          <Text style={[styles.seeAll, { color: colors.accentYellow }]}>{expanded ? 'Show less' : 'See all'}</Text>
        </TouchableOpacity>}
      </View>
      <View style={styles.topicsList}>
        {(expanded ? [...completedSet] : [...completedSet].slice(0, 6)).map(topic => (
          <View key={topic} style={styles.topicChip}>
            <Feather name="check-circle" size={13} color="#C8551C" />
            <Text style={styles.topicChipText} numberOfLines={expanded ? undefined : 1}>{topic}</Text>
          </View>
        ))}
        {!expanded && completedSet.size > 6 && (
          <View style={[styles.topicChip, { backgroundColor: colors.cardHover }]}>
            <Text style={[styles.topicChipText, { color: colors.textMuted }]}>+{completedSet.size - 6} more</Text>
          </View>
        )}
      </View>
    </>
  );
}
