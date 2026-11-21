import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../../../../theme';
import type { AppColors } from '../../../../theme';

interface SupportCardsProps {
  colors: AppColors;
  isDark: boolean;
  onOpenChat: () => void;
  onOpenTicket: () => void;
}

// Both cards share one layout: 40px tinted icon tile, title, description and
// the arrow action pinned to the bottom, so titles and actions line up.
export default function SupportCards({ colors, isDark, onOpenChat, onOpenTicket }: SupportCardsProps) {
  const styles = makeStyles(colors, isDark);

  return (
    <View style={styles.supportRow}>
      <TouchableOpacity style={styles.supportCard} onPress={onOpenChat} activeOpacity={0.75}>
        <View style={styles.iconTile}>
          <Feather name="message-circle" size={20} color={colors.primary} />
          <Feather name="star" size={9} color={colors.primary} style={styles.sparkle} />
        </View>
        <Text style={styles.supportCardTitle}>Chat with Aivorah 24/7</Text>
        <Text style={styles.supportCardSub}>Get instant answers about{'\n'}XP, streaks, badges,{'\n'}learning paths & more.</Text>
        <View style={styles.supportArrowBtn}>
          <Feather name="arrow-right" size={18} color={colors.onPrimary} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.supportCard} onPress={onOpenTicket} activeOpacity={0.75}>
        <View style={styles.iconTile}>
          <Feather name="mail" size={20} color={colors.primary} />
        </View>
        <Text style={styles.supportCardTitle}>Submit a Ticket</Text>
        <Text style={styles.supportCardSub}>We&apos;ll reply within 24h</Text>
        <View style={styles.supportArrowBtn}>
          <Feather name="arrow-right" size={18} color={colors.onPrimary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: AppColors, _isDark: boolean) => StyleSheet.create({
  supportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  supportCard: {
    flexGrow: 1, flexBasis: 240, borderRadius: radius.md, padding: spacing.xl, minHeight: 180,
    backgroundColor: c.cardDark, borderWidth: 1, borderColor: c.borderColor, gap: 8,
  },
  iconTile: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: c.primaryGlow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  sparkle: { position: 'absolute', top: 6, right: 6 },
  supportCardTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: c.textHeading, fontFamily: fonts.title },
  supportCardSub: { fontSize: 14, color: c.textMuted, lineHeight: 21, flexGrow: 1 },
  supportArrowBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, alignSelf: 'flex-start', backgroundColor: c.primary,
  },
});
