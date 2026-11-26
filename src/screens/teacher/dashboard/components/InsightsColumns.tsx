import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../../../../theme';
import type { InsightTile } from '../types';

export default function InsightsColumns({
  gold, learningPathTiles, assignmentTiles, challengeTiles, onTilePress, styles,
}: {
  gold: string;
  learningPathTiles: InsightTile[];
  assignmentTiles: InsightTile[];
  challengeTiles: InsightTile[];
  onTilePress: (tileIndex: number) => void;
  styles: any;
}) {
  return (
    // Website Redesign, Phase 4: the "AI Teaching Insights" title now heads the
    // summary card in the top row; these columns are its full detail.
    <View testID="insight-columns" style={[styles.insightsCard, { marginBottom: spacing.xl }]}>

      <View style={styles.insightCols}>
        {/* Column 1: Learning Path */}
        <View style={styles.insightCol}>
          <View style={styles.colHeader}>
            <Feather name="map" size={11} color={gold} />
            <Text style={[styles.colHeaderText, { color: gold }]}>Learning Path</Text>
          </View>
          {learningPathTiles.map((tile, i) => (
            <TouchableOpacity key={`lp-${i}`} activeOpacity={0.7}
              style={[styles.colRow, i < learningPathTiles.length - 1 && styles.colRowBorder]}
              onPress={() => onTilePress(i)}>
              <View style={[styles.colRowIcon, { backgroundColor: tile.color + '15' }]}>
                <Feather name={tile.icon} size={11} color={tile.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.colRowTitle} numberOfLines={1}>{tile.title}</Text>
                <Text style={styles.colRowSub} numberOfLines={1}>{tile.body}</Text>
              </View>
              <Text style={[styles.colRowStat, { color: tile.color }]}>{tile.stat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Column 2: Assignments */}
        <View style={[styles.insightCol, styles.insightColBorder]}>
          <View style={styles.colHeader}>
            <Feather name="edit-3" size={11} color={gold} />
            <Text style={[styles.colHeaderText, { color: gold }]}>Assignments</Text>
          </View>
          {assignmentTiles.map((tile, i) => {
            const idx = learningPathTiles.length + i;
            return (
              <TouchableOpacity key={`as-${i}`} activeOpacity={0.7}
                style={[styles.colRow, i < assignmentTiles.length - 1 && styles.colRowBorder]}
                onPress={() => onTilePress(idx)}>
                <View style={[styles.colRowIcon, { backgroundColor: tile.color + '15' }]}>
                  <Feather name={tile.icon} size={11} color={tile.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.colRowTitle} numberOfLines={1}>{tile.title}</Text>
                  <Text style={styles.colRowSub} numberOfLines={1}>{tile.body}</Text>
                </View>
                <Text style={[styles.colRowStat, { color: tile.color }]}>{tile.stat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Column 3: Challenges */}
        <View style={[styles.insightCol, styles.insightColBorder]}>
          <View style={styles.colHeader}>
            <Feather name="target" size={11} color="#C49098" />
            <Text style={[styles.colHeaderText, { color: '#C49098' }]}>Challenges</Text>
          </View>
          {challengeTiles.map((tile, i) => {
            const idx = learningPathTiles.length + assignmentTiles.length + i;
            return (
              <TouchableOpacity key={`ch-${i}`} activeOpacity={0.7}
                style={[styles.colRow, i < challengeTiles.length - 1 && styles.colRowBorder]}
                onPress={() => onTilePress(idx)}>
                <View style={[styles.colRowIcon, { backgroundColor: tile.color + '15' }]}>
                  <Feather name={tile.icon} size={11} color={tile.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.colRowTitle} numberOfLines={1}>{tile.title}</Text>
                  <Text style={styles.colRowSub} numberOfLines={1}>{tile.body}</Text>
                </View>
                <Text style={[styles.colRowStat, { color: tile.color }]}>{tile.stat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
