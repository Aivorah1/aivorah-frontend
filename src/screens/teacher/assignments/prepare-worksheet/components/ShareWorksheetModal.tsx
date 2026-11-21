/**
 * Share box: search the teachers of the teacher's own school (the server
 * lists only those, and checks again when sharing), pick one, then Share.
 * Mounted only while a document is being shared, so it always starts empty.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import ActivityIndicator from '../../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import type { WorksheetStyles } from '../styles';
import { listSchoolTeachers, shareWorksheet } from '../services/worksheetsApi';
import type { SchoolTeacher, WorksheetSummary } from '../services/worksheetsApi';

export function ShareWorksheetModal({ doc, onClose, onShared, styles, colors }: {
  doc: WorksheetSummary | null;
  onClose: () => void;
  onShared: (teacher: SchoolTeacher) => void;
  styles: WorksheetStyles;
  colors: AppColors;
}) {
  const [teachers, setTeachers] = useState<SchoolTeacher[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SchoolTeacher | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doc) return undefined;
    let alive = true;
    listSchoolTeachers()
      .then((t) => { if (alive) setTeachers(t); })
      .catch((e) => { if (alive) setLoadError(e?.message || 'Could not load the teachers of your school'); });
    return () => { alive = false; };
  }, [doc]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (teachers || []).filter((t) => !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
  }, [teachers, search]);

  const share = async () => {
    if (!doc || !selected) return;
    setSharing(true); setError('');
    try {
      const to = await shareWorksheet(doc.id, selected.id);
      onShared(to);
    } catch (e: any) {
      setError(e?.message || 'Could not share this document');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal visible={!!doc} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox} testID="share-worksheet-modal">
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Share</Text>
              <Text style={styles.fileMeta} numberOfLines={1}>{doc?.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={[styles.modalBody, { flexShrink: 1 }]}>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color={colors.textDim} />
              <TextInput
                testID="share-search"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search teachers by name or email"
                placeholderTextColor={colors.textDim}
              />
            </View>
            {teachers === null && !loadError ? (
              <ActivityIndicator color={colors.accentYellow} style={{ marginVertical: 24 }} />
            ) : loadError ? (
              <Text style={styles.errorText}>{loadError}</Text>
            ) : shown.length === 0 ? (
              <Text style={[styles.emptyText, { paddingVertical: 16 }]}>
                {teachers && teachers.length === 0 ? 'No other teachers in your school yet.' : 'No teacher matches your search.'}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 8 }}>
                {shown.map((t) => {
                  const active = selected?.id === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      testID={`share-teacher-${t.id}`}
                      style={[styles.teacherRow, active && styles.teacherRowActive]}
                      onPress={() => setSelected(active ? null : t)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <View style={styles.avatar}><Text style={styles.avatarText}>{t.name.charAt(0).toUpperCase()}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileName}>{t.name}</Text>
                        <Text style={styles.fileMeta}>{t.email}</Text>
                      </View>
                      {active && <Feather name="check-circle" size={18} color={colors.accentYellow} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
          {selected && (
            <View style={styles.modalFooter}>
              <TouchableOpacity testID="share-confirm" style={styles.primaryBtn} onPress={share} disabled={sharing} accessibilityRole="button">
                {sharing ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Feather name="send" size={15} color={colors.onPrimary} />}
                <Text style={styles.primaryBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
