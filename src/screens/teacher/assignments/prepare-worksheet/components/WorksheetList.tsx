/**
 * A list of prepared documents with their actions.
 *   mine:   File name | Last modified | Download, Share, Assign (History)
 *   shared: File name | Shared by, date shared | Download, Assign (Library > Shared to you)
 * Tapping a file name opens it in the editor.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import type { WorksheetStyles } from '../styles';
import type { SharedWorksheet, WorksheetSummary } from '../services/worksheetsApi';
import { formatWorksheetDate } from '../utils/worksheetFiles';

type Item = WorksheetSummary | SharedWorksheet;

export function WorksheetList({ variant, items, busyId, onOpen, onDownload, onShare, onAssign, styles, colors }: {
  variant: 'mine' | 'shared';
  items: Item[];
  busyId?: string | null;
  onOpen: (item: Item) => void;
  onDownload: (item: Item) => void;
  onShare?: (item: Item) => void;
  onAssign: (item: Item) => void;
  styles: WorksheetStyles;
  colors: AppColors;
}) {
  const action = (testID: string, icon: any, label: string, onPress: () => void, disabled = false) => (
    <TouchableOpacity testID={testID} style={[styles.actionBtn, disabled && { opacity: 0.5 }]} onPress={onPress} disabled={disabled} accessibilityRole="button">
      <Feather name={icon} size={13} color={colors.accentYellow} />
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.listCard} testID={`worksheet-list-${variant}`}>
      <View style={styles.listHead}>
        <Text style={[styles.listHeadText, { flex: 1, minWidth: 180 }]}>File name</Text>
        <Text style={[styles.listHeadText, styles.colDate]}>{variant === 'mine' ? 'Last modified' : 'Shared by'}</Text>
        <Text style={[styles.listHeadText, { width: variant === 'mine' ? 270 : 190 }]}>Actions</Text>
      </View>
      {items.map((it, i) => {
        const shared = variant === 'shared' ? (it as SharedWorksheet) : null;
        const busy = busyId === it.id;
        return (
          <View key={it.id} testID={`worksheet-row-${it.id}`} style={[styles.row, i < items.length - 1 && styles.rowDivider]}>
            <TouchableOpacity style={styles.colName} onPress={() => onOpen(it)} accessibilityRole="button" testID={`worksheet-open-${it.id}`}>
              <View style={styles.fileIcon}><Feather name="file-text" size={16} color={colors.accentYellow} /></View>
              <Text style={styles.fileName} numberOfLines={2}>{it.title}</Text>
            </TouchableOpacity>
            <View style={styles.colDate}>
              {shared ? (
                <>
                  <Text style={styles.fileName} numberOfLines={1}>{shared.shared_by_name}</Text>
                  <Text style={styles.fileMeta}>{formatWorksheetDate(shared.shared_at)}</Text>
                </>
              ) : (
                <Text style={styles.fileMeta}>{formatWorksheetDate(it.updated_at)}</Text>
              )}
            </View>
            <View style={[styles.colActions, { width: variant === 'mine' ? 270 : 190 }]}>
              {busy ? <ActivityIndicator size="small" color={colors.accentYellow} /> : (
                <>
                  {action(`worksheet-download-${it.id}`, 'download', 'Download', () => onDownload(it))}
                  {variant === 'mine' && onShare && action(`worksheet-share-${it.id}`, 'share-2', 'Share', () => onShare(it))}
                  {action(`worksheet-assign-${it.id}`, 'send', 'Assign', () => onAssign(it))}
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
