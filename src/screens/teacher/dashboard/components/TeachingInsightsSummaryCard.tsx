import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from '../../../../components/common/Icon';
import type { AppColors } from '../../../../theme';
import type { InsightTile } from '../types';
import { CardShape } from './common/CardShape';

// "AI Teaching Insights" summary (Website Redesign, Phase 4): the third card in
// the dashboard's top row. It lists the suggested next step and the leading
// insight from each column; each line opens the same detail as its tile in
// the full insight columns below.
export default function TeachingInsightsSummaryCard({
  colors, isDark, suggestion, learningPathTiles, assignmentTiles, challengeTiles, onTilePress, onSeeAll, styles,
}: {
  colors: AppColors;
  isDark: boolean;
  suggestion: string;
  learningPathTiles: InsightTile[];
  assignmentTiles: InsightTile[];
  challengeTiles: InsightTile[];
  onTilePress: (tileIndex: number) => void;
  onSeeAll: () => void;
  styles: any;
}) {
  const picks: { tile: InsightTile; index: number }[] = [];
  if (learningPathTiles[0]) picks.push({ tile: learningPathTiles[0], index: 0 });
  if (assignmentTiles[0]) picks.push({ tile: assignmentTiles[0], index: learningPathTiles.length });
  if (challengeTiles[0]) picks.push({ tile: challengeTiles[0], index: learningPathTiles.length + assignmentTiles.length });

  return (
    <View style={[styles.card, styles.topCard]} testID="teaching-insights-summary">
      <CardShape tone="blue" corner="bottom-right" isDark={isDark} />
      <TouchableOpacity style={styles.cardHeader} onPress={onSeeAll} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="AI Teaching Insights, see all">
        <Icon name="sparkles" size={20} color={colors.accentOrange} />
        <Text style={styles.cardTitle}>AI Teaching Insights</Text>
        <Icon name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      <View style={{ gap: 10 }}>
        <View style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.bulletText} numberOfLines={2}>{suggestion}</Text>
        </View>
        {picks.map(({ tile, index }) => (
          <TouchableOpacity key={index} style={styles.bulletRow} activeOpacity={0.7} onPress={() => onTilePress(index)}
            accessibilityRole="button" accessibilityLabel={`${tile.title}: ${tile.body}`}>
            <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.bulletText} numberOfLines={2}>{`${tile.title} · ${tile.body}`}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
