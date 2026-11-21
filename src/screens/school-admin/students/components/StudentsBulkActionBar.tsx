import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing, radius, fonts } from '../../../../theme';
import type { AppColors } from '../../../../theme';

interface StudentsBulkActionBarProps {
  count: number;
  colors: AppColors;
  onPromote: () => void;
  onMarkActive: () => void;
  onMarkInactive: () => void;
  onArchive: () => void;
  onClear: () => void;
}

export function StudentsBulkActionBar({ count, colors, onPromote, onMarkActive, onMarkInactive, onArchive, onClear }: StudentsBulkActionBarProps) {
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.bulkBar}>
      <Text style={styles.bulkBarText}>{count} selected</Text>
      <View style={styles.bulkBarActions}>
        <TouchableOpacity style={styles.bulkBtnPrimary} onPress={onPromote}>
          <Feather name="arrow-up-circle" size={12.5} color={colors.onPrimary} />
          <Text style={styles.bulkBtnPrimaryText}>Promote Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtn} onPress={onMarkActive}>
          <Text style={styles.bulkBtnText}>Mark Active</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtn} onPress={onMarkInactive}>
          <Text style={styles.bulkBtnText}>Mark Inactive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtnDanger} onPress={onArchive}>
          <Text style={styles.bulkBtnDangerText}>Archive</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtnGhost} onPress={onClear}>
          <Text style={styles.bulkBtnGhostText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    bulkBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: `${colors.accentYellow}14`, borderWidth: 1, borderColor: `${colors.accentYellow}40`,
      borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 10, marginBottom: spacing.md,
    },
    bulkBarText: { fontFamily: fonts.serif, fontSize: 14, fontWeight: '700', color: colors.textHeading },
    bulkBarActions: { flexDirection: 'row', gap: 8 },
    bulkBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderColor, backgroundColor: colors.cardDark },
    bulkBtnText: { minHeight: 44, justifyContent: 'center', fontFamily: fonts.serif, fontSize: 14, fontWeight: '700', color: colors.textMuted },
    bulkBtnDanger: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: `${colors.accentRed}55`, backgroundColor: `${colors.accentRed}14` },
    bulkBtnDangerText: { minHeight: 44, justifyContent: 'center', fontFamily: fonts.serif, fontSize: 14, fontWeight: '700', color: colors.accentRed },
    bulkBtnGhost: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 7 },
    bulkBtnGhostText: { minHeight: 44, justifyContent: 'center', fontFamily: fonts.serif, fontSize: 14, fontWeight: '600', color: colors.textDim },
    bulkBtnPrimary: { minHeight: 44, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm, backgroundColor: colors.accentYellow },
    bulkBtnPrimaryText: { minHeight: 44, justifyContent: 'center', fontFamily: fonts.serif, fontSize: 14, fontWeight: '700', color: colors.onPrimary },
  });
}
