/**
 * Assignments > Library > Shared to you: documents other teachers of the same
 * school shared with this teacher (file name, who shared it, date shared).
 * Open (in the worksheet editor), Download (.docx) and Assign, as for the
 * teacher's own documents.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import { makeWorksheetStyles } from '../styles';
import { listSharedWorksheets } from '../services/worksheetsApi';
import type { SharedWorksheet } from '../services/worksheetsApi';
import { downloadWorksheetDocx } from '../utils/worksheetFiles';
import { WorksheetList } from './WorksheetList';

export function SharedToYou({ active, colors, onOpen, onAssign, onNotify }: {
  active: boolean;
  colors: AppColors;
  onOpen: (doc: SharedWorksheet) => void;
  onAssign: (doc: SharedWorksheet) => void;
  onNotify: (title: string, subtitle: string, type: 'success' | 'error') => void;
}) {
  const styles = useMemo(() => makeWorksheetStyles(colors), [colors]);
  const [items, setItems] = useState<SharedWorksheet[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    listSharedWorksheets()
      .then((list) => { if (alive) { setItems(list); setError(''); } })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || 'Could not load documents shared with you');
        setItems((prev) => prev ?? []);
      });
    return () => { alive = false; };
  }, [active]);

  const download = async (doc: { id: string }) => {
    setBusyId(doc.id);
    try {
      onNotify('Downloaded', await downloadWorksheetDocx(doc.id), 'success');
    } catch (e: any) {
      onNotify('Could not download', e?.message || '', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={{ gap: 10 }} testID="shared-to-you">
      <Text style={{ fontSize: 12, color: colors.textMuted }}>
        Documents shared with you by other teachers of your school.
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {items === null ? (
        <ActivityIndicator color={colors.accentYellow} style={{ marginTop: 32 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty} testID="shared-to-you-empty">
          <Feather name="inbox" size={32} color={colors.textDim} />
          <Text style={styles.emptyTitle}>Nothing shared with you yet</Text>
          <Text style={styles.emptyText}>When a teacher of your school shares a prepared worksheet with you, it appears here.</Text>
        </View>
      ) : (
        <WorksheetList
          variant="shared"
          items={items}
          busyId={busyId}
          onOpen={(d) => onOpen(d as SharedWorksheet)}
          onDownload={download}
          onAssign={(d) => onAssign(d as SharedWorksheet)}
          styles={styles}
          colors={colors}
        />
      )}
    </View>
  );
}
