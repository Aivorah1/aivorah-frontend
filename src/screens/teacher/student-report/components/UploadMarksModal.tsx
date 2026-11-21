import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import { fetchSubjectMarks, saveSubjectMarks } from '../services/studentReportApi';
import type { ReportClassRef, ReportStudent } from '../services/studentReportApi';
import type { StudentReportStyles } from '../styles';
import { formatMarks } from '../utils/reportFormat';

const MAX = 100;

export function parseMarkInput(text: string): number | null | 'invalid' {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'invalid';
  const n = Number(t);
  return n >= 0 && n <= MAX ? n : 'invalid';
}

interface Props {
  student: ReportStudent | null;
  classRef: ReportClassRef;
  subjects: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
  styles: StudentReportStyles;
  colors: any;
}

/** Upload Marks for one student, only in the subject(s) this teacher teaches in the class. */
export default function UploadMarksModal(props: Props) {
  const { student, onClose, styles } = props;
  return (
    <Modal visible={!!student} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        {/* Keyed by student so each opening starts from a fresh, loading state. */}
        {student && <MarksForm key={student.id} {...props} student={student} />}
      </View>
    </Modal>
  );
}

function MarksForm({ student, classRef, subjects, onClose, onSaved, styles, colors }: Props & { student: ReportStudent }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all(subjects.map((s) => fetchSubjectMarks(classRef, s).then((r) => [s, r.marks[student.id]] as const)))
      .then((pairs) => {
        if (!alive) return;
        const next: Record<string, string> = {};
        for (const [s, m] of pairs) next[s] = typeof m === 'number' ? formatMarks(m) : '';
        setValues(next);
      })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load marks'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [student.id, classRef, subjects]);

  const save = async () => {
    const entries = subjects.map((s) => [s, parseMarkInput(values[s] || '')] as const);
    if (entries.some(([, v]) => v === 'invalid')) { setError(`Marks must be a number from 0 to ${MAX}`); return; }
    const toSave = entries.filter(([, v]) => typeof v === 'number') as [string, number][];
    if (!toSave.length) { setError('Enter marks for at least one subject'); return; }
    setSaving(true);
    setError('');
    try {
      for (const [subject, mark] of toSave) await saveSubjectMarks(classRef, subject, { [student.id]: mark });
      onSaved(`Marks saved for ${student.name}`);
    } catch (e: any) {
      setError(e?.message || 'Could not save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.modalCard, { maxWidth: 460 }]} testID="upload-marks-modal">
      <View style={styles.modalHeader}>
        <Feather name="edit-3" size={18} color={colors.accentYellow} />
        <Text style={styles.modalTitle}>Upload Marks · {student.name}</Text>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.modalBody}>
        {loading ? (
          <ActivityIndicator color={colors.accentYellow} />
        ) : subjects.map((s) => (
          <View key={s} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{s}</Text>
            <TextInput
              testID={`marks-input-${s}`}
              style={styles.marksInput}
              value={values[s] ?? ''}
              onChangeText={(t) => setValues((v) => ({ ...v, [s]: t }))}
              keyboardType="decimal-pad"
              placeholder="0–100"
              placeholderTextColor={colors.textDim}
              accessibilityLabel={`${s} marks`}
              maxLength={6}
            />
            <Text style={styles.outOf}>/ {MAX}</Text>
          </View>
        ))}
        {!!error && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color={colors.accentRed} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.actionBtn} onPress={onClose} accessibilityRole="button">
          <Text style={styles.actionBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="marks-save"
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={save}
          disabled={saving || loading}
          accessibilityRole="button"
        >
          {saving ? <ActivityIndicator size="small" color="#1C2B37" /> : <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Save Marks</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
