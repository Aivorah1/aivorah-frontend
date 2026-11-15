import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fetchStudentReport } from '../services/studentReportApi';
import type { ReportStudent, StudentReport } from '../services/studentReportApi';
import type { StudentReportStyles } from '../styles';
import ReportCard from './ReportCard';

interface Props {
  student: ReportStudent | null;
  onClose: () => void;
  onDownload: (s: ReportStudent) => void;
  onShare: (s: ReportStudent) => void;
  busy: boolean;
  styles: StudentReportStyles;
  colors: any;
}

/** View Report: all subjects for the class teacher, the teacher's own subject(s) otherwise (decided by the API). */
export default function ViewReportModal(props: Props) {
  const { student, onClose, styles } = props;
  return (
    <Modal visible={!!student} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        {/* Keyed by student so each opening starts from a fresh, loading state. */}
        {student && <ReportBody key={student.id} {...props} student={student} />}
      </View>
    </Modal>
  );
}

function ReportBody({ student, onClose, onDownload, onShare, busy, styles, colors }: Props & { student: ReportStudent }) {
  const [report, setReport] = useState<StudentReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetchStudentReport(student.id)
      .then((r) => { if (alive) setReport(r); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load the report'); });
    return () => { alive = false; };
  }, [student.id]);

  return (
    <View style={styles.modalCard} testID="view-report-modal">
      <View style={styles.modalHeader}>
        <Feather name="file-text" size={18} color={colors.accentYellow} />
        <Text style={styles.modalTitle}>Report · {student.name}</Text>
        <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.modalBody}>
        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color={colors.accentRed} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !report ? (
          <ActivityIndicator color={colors.accentYellow} style={{ marginVertical: 30 }} />
        ) : (
          <ReportCard report={report} styles={styles} colors={colors} />
        )}
      </ScrollView>
      {report && (report.canDownload || report.canShare) && (
        <View style={styles.modalFooter}>
          {report.canDownload && (
            <TouchableOpacity testID="report-modal-download" style={styles.actionBtn} onPress={() => onDownload(student)} disabled={busy} accessibilityRole="button">
              <Feather name="download" size={14} color={colors.textMain} />
              <Text style={styles.actionBtnText}>Download</Text>
            </TouchableOpacity>
          )}
          {report.canShare && (
            <TouchableOpacity testID="report-modal-share" style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => onShare(student)} disabled={busy} accessibilityRole="button">
              <Feather name="send" size={14} color="#241f16" />
              <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Share</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
