import React from 'react';
import { View, Text, Image } from 'react-native';
import type { StudentReport } from '../services/studentReportApi';
import type { StudentReportStyles } from '../styles';
import { classLabel, formatGeneratedAt, formatMarks } from '../utils/reportFormat';

/** The fixed report template on screen (same layout as utils/reportPdf.ts). */
export default function ReportCard({ report, styles, colors }: { report: StudentReport; styles: StudentReportStyles; colors: any }) {
  const s = report.student;
  return (
    <View style={{ gap: 12 }} testID="report-card">
      <View style={styles.reportHeader}>
        <View style={styles.reportLogoBox}>
          {report.school.logoUrl ? (
            <Image source={{ uri: report.school.logoUrl }} style={styles.reportLogo} resizeMode="contain" accessibilityLabel="School logo" />
          ) : null}
        </View>
        <Text style={styles.reportSchool} testID="report-school-name">{report.school.name}</Text>
        <View style={styles.reportGenerated}>
          <Text style={styles.reportGeneratedLabel}>Generated</Text>
          <Text style={styles.reportGeneratedValue} testID="report-generated">{formatGeneratedAt(report.generatedAt)}</Text>
        </View>
      </View>
      <View style={styles.reportRule} />
      <Text style={styles.reportTitle}>{report.full ? 'Student Report Card' : 'Subject Marks'}</Text>
      <Text style={styles.reportSub}>Academic Year {report.academicYear}</Text>
      <View style={styles.reportStudentLine}>
        <Text style={styles.reportStudentText}><Text style={styles.tdBold}>Student: </Text>{s.name}</Text>
        <Text style={styles.reportStudentText}><Text style={styles.tdBold}>Class: </Text>{classLabel(s.grade, s.section)}</Text>
        {!!s.admissionNumber && <Text style={styles.reportStudentText}><Text style={styles.tdBold}>Admission No: </Text>{s.admissionNumber}</Text>}
      </View>

      <View style={styles.table}>
        <View style={[styles.tr, styles.trHead]}>
          <Text style={[styles.th, styles.cSno]}>S.No</Text>
          <Text style={[styles.th, styles.cSubject]}>Subject Name</Text>
          <Text style={[styles.th, styles.cMarks]}>Marks</Text>
          <Text style={[styles.th, styles.cResult]}>Pass / Fail</Text>
        </View>
        {report.rows.length === 0 ? (
          <View style={styles.tr}><Text style={[styles.td, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>No marks have been uploaded yet.</Text></View>
        ) : report.rows.map((r) => (
          <View key={r.subject} style={styles.tr} testID={`report-row-${r.subject}`}>
            <Text style={[styles.td, styles.cSno]}>{r.sno}</Text>
            <Text style={[styles.td, styles.cSubject]}>{r.subject}</Text>
            <Text style={[styles.td, styles.cMarks]}>{formatMarks(r.marks)} / {r.maxMarks}</Text>
            <Text style={[styles.td, styles.cResult, styles.tdBold, { color: r.result === 'Pass' ? colors.accentGreen : colors.accentRed }]}>{r.result}</Text>
          </View>
        ))}
        <View style={[styles.tr, styles.trTotal]}>
          <Text style={[styles.td, styles.cSno]} />
          <Text style={[styles.td, styles.cSubject, styles.tdBold]}>Total marks</Text>
          <Text style={[styles.td, styles.cMarks, styles.tdBold]} testID="report-total">{formatMarks(report.total.obtained)} / {report.total.max}</Text>
          <Text style={[styles.td, styles.cResult, styles.tdBold]}>{report.percentage !== null ? `${report.percentage}%` : ''}</Text>
        </View>
      </View>

      {report.rating && (
        <View style={{ gap: 4 }} testID="report-rating">
          <Text style={styles.ratingTitle}>Overall Rating: {report.rating.label}</Text>
          <Text style={styles.ratingText}>{report.rating.remark}</Text>
        </View>
      )}
      {report.pendingSubjects.length > 0 && (
        <Text style={styles.pendingNote} testID="report-pending">Marks not uploaded yet: {report.pendingSubjects.join(', ')}</Text>
      )}
    </View>
  );
}
