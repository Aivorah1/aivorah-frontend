import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import SERVER_URL from '../../../../config/serverUrl';
import type { Challenge } from '../types';
import { DIFF_COLORS } from '../constants';

interface Props {
  ch: Challenge;
  onStart: (ch: Challenge) => void;
  styles: any;
  colors: AppColors;
}

function rankBadgeConfig(score: number) {
  if (score >= 80)      return { label: 'Top 1%',  emoji: '🥇', bg: '#3FB8A8', border: '#3FB8A8', text: '#0F4C45' };
  if (score >= 60)      return { label: 'Top 5%',  emoji: '🥈', bg: '#DCEFEB', border: '#24877B', text: '#0F4C45' };
  if (score >= 40)      return { label: 'Top 10%', emoji: '🥉', bg: '#24877B', border: '#24877B', text: '#0F4C45' };
  if (score >= 20)      return { label: 'Top 25%', emoji: '⭐', bg: '#C8DCCC', border: '#9FB2A4', text: '#2A3530' };
  return null;
}

export default function ChallengeCard({ ch, onStart, styles, colors }: Props) {
  const diffColor = DIFF_COLORS[ch.difficulty] ?? colors.accentYellow;
  const rawImg = (ch as any).thumbnailUrl ?? ch.imageUrl ?? null;
  const imgUrl = rawImg ? (rawImg.startsWith('http') ? rawImg : `${SERVER_URL}${rawImg}`) : null;
  const rankCfg = ch.status === 'completed' && ch.score != null ? rankBadgeConfig(ch.score) : null;
  const isGold = ch.score != null && ch.score >= 95;
  // Without a cover image the card stays a neutral surface (no tinted block),
  // so the overlay text switches from on-image white to theme text colours.
  const noImg = !imgUrl;

  return (
    <View style={styles.challengeCard}>
      {/* Full-height image with title + badges overlaid */}
      <View style={styles.cardImageWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: colors.cardHover, alignItems: 'center', justifyContent: 'center' }]}>
            <Feather name="target" size={28} color={colors.textMuted} style={{ marginBottom: 40 }} />
          </View>
        )}
        {!noImg && <View style={styles.cardScrim} />}
        {/* Difficulty pill — top right */}
        <View style={[styles.diffPill, { backgroundColor: colors.cardDark, borderWidth: 1, borderColor: colors.borderColor, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: diffColor }} />
          <Text style={[styles.diffPillText, { color: colors.textHeading }]}>{ch.difficulty}</Text>
        </View>
        {/* Ranking band badge — top left, only for completed */}
        {rankCfg && (
          <View style={[styles.rankBadgeWrap, {
            backgroundColor: isGold ? '#3FB8A8' : rankCfg.bg,
            borderColor: rankCfg.border,
            shadowColor: rankCfg.border,
          }]}>
            {isGold && <View style={styles.rankBadgeShine} />}
            <Text style={styles.rankBadgeEmoji}>{rankCfg.emoji}</Text>
            <View>
              <Text style={[styles.rankBadgeLabel, { color: isGold ? '#0F4C45' : '#fff' }]}>{rankCfg.label}</Text>
              <Text style={[styles.rankBadgeSub, { color: isGold ? '#0F4C45' : 'rgba(255,255,255,0.8)' }]}>Performer</Text>
            </View>
          </View>
        )}
        {/* Title + XP overlaid at bottom of image */}
        <View style={styles.cardOverlay}>
          <Text style={[styles.cardOverlayTitle, noImg && { color: colors.textHeading }]} numberOfLines={2}>{ch.title}</Text>
          <View style={styles.cardOverlayMeta}>
            <Feather name="award" size={14} color={noImg ? colors.accentOrange : '#3FB8A8'} />
            <Text style={[styles.cardOverlayXP, noImg && { color: colors.textMain }]}>{ch.xpReward} XP</Text>
            <Text style={[styles.cardOverlayDot, noImg && { color: colors.textMuted }]}>·</Text>
            <Feather name="clock" size={14} color={noImg ? colors.textMuted : 'rgba(255,255,255,0.85)'} />
            <Text style={[styles.cardOverlayTime, noImg && { color: colors.textMain }]}>{ch.timeLimitMinutes} min</Text>
          </View>
        </View>
      </View>

      {/* Action row */}
      {ch.status === 'completed' ? (
        <View style={styles.completedRow}>
          <Feather name="check-circle" size={13} color={colors.accentGreen} />
          <Text style={[styles.completedText, { color: colors.accentGreen }]}>{ch.score}% · +{ch.xpAwarded} XP</Text>
        </View>
      ) : (ch as any).closed ? (
        <View style={[styles.completedRow, { opacity: 0.7 }]}>
          <Feather name="lock" size={13} color={colors.textDim} />
          <Text style={[styles.completedText, { color: colors.textDim }]}>Closed</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: ch.status === 'assigned' ? colors.accentGreen : colors.accentYellow }]}
          onPress={() => onStart(ch)}
          activeOpacity={0.85}
        >
          <Feather name="play" size={14} color={colors.onPrimary} />
          <Text style={styles.startBtnText}>
            {ch.status === 'assigned' ? 'Start Now' : 'Start Challenge'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
