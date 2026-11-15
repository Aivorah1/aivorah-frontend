import { StyleSheet } from 'react-native';
import { radius, fonts, spacing } from '../../../theme';
import type { AppColors } from '../../../theme';
// Same chips, student list, search, error and empty styles as the Attendance page.
import { makeStyles as makeAttendanceStyles } from '../attendance/styles';

export function makeStyles(colors: AppColors) {
  return {
    ...makeAttendanceStyles(colors),
    ...StyleSheet.create({
      sectionLabel: { fontFamily: fonts.serif, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.textDim, textTransform: 'uppercase' },
      selectorBlock: { gap: 8 },
      roleNote: { fontFamily: fonts.serif, fontSize: 12.5, color: colors.textMuted },
      rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
      actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.borderColor,
        paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.sm, backgroundColor: colors.cardDark,
      },
      actionBtnPrimary: { backgroundColor: colors.accentYellow, borderColor: colors.accentYellow },
      actionBtnText: { fontFamily: fonts.serif, fontSize: 12, fontWeight: '600', color: colors.textMain },
      actionBtnTextPrimary: { color: '#241f16' },
      modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
      modalCard: {
        width: '100%', maxWidth: 720, maxHeight: '92%', backgroundColor: colors.cardDark, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.borderColor, overflow: 'hidden',
      },
      modalHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderColor, gap: 10 },
      modalTitle: { flex: 1, fontFamily: fonts.serif, fontSize: 16, fontWeight: '700', color: colors.textHeading },
      modalBody: { padding: spacing.lg, gap: 12 },
      modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderColor },
      fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
      fieldLabel: { flex: 1, fontFamily: fonts.serif, fontSize: 13.5, color: colors.textMain },
      marksInput: {
        width: 90, height: 38, borderWidth: 1, borderColor: colors.borderColor, borderRadius: radius.sm, paddingHorizontal: 10,
        fontFamily: fonts.serif, fontSize: 14, color: colors.textMain, backgroundColor: colors.bgDark, textAlign: 'center',
      } as any,
      outOf: { fontFamily: fonts.serif, fontSize: 12.5, color: colors.textDim, width: 44 },
      // Report card (on screen) — mirrors the PDF template.
      reportHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
      reportLogoBox: { width: 56, height: 56 },
      reportLogo: { width: 56, height: 56 },
      reportSchool: { flex: 1, textAlign: 'center', fontFamily: fonts.serif, fontSize: 18, fontWeight: '800', color: colors.textHeading },
      reportGenerated: { width: 120, alignItems: 'flex-end' },
      reportGeneratedLabel: { fontFamily: fonts.serif, fontSize: 10.5, color: colors.textDim },
      reportGeneratedValue: { fontFamily: fonts.serif, fontSize: 11.5, color: colors.textMain, textAlign: 'right' },
      reportRule: { height: 2, backgroundColor: colors.accentYellow, marginVertical: 4 },
      reportTitle: { textAlign: 'center', fontFamily: fonts.serif, fontSize: 15, fontWeight: '700', color: colors.accentYellow },
      reportSub: { textAlign: 'center', fontFamily: fonts.serif, fontSize: 12, color: colors.textMuted },
      reportStudentLine: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
      reportStudentText: { fontFamily: fonts.serif, fontSize: 13, color: colors.textMain },
      table: { borderWidth: 1, borderColor: colors.accentYellow, borderRadius: radius.sm, overflow: 'hidden' },
      tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderColor },
      trHead: { backgroundColor: colors.accentYellow },
      trTotal: { backgroundColor: `${colors.accentYellow}18`, borderBottomWidth: 0 },
      th: { fontFamily: fonts.serif, fontSize: 12.5, fontWeight: '700', color: '#241f16', paddingVertical: 8, paddingHorizontal: 8 },
      td: { fontFamily: fonts.serif, fontSize: 13, color: colors.textMain, paddingVertical: 8, paddingHorizontal: 8 },
      tdBold: { fontWeight: '700' },
      cSno: { width: 52, textAlign: 'center' },
      cSubject: { flex: 1 },
      cMarks: { width: 96, textAlign: 'center' },
      cResult: { width: 96, textAlign: 'center' },
      ratingTitle: { fontFamily: fonts.serif, fontSize: 14, fontWeight: '700', color: colors.accentYellow },
      ratingText: { fontFamily: fonts.serif, fontSize: 13, color: colors.textMain, lineHeight: 19 },
      pendingNote: { fontFamily: fonts.serif, fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
    }),
  };
}

export type StudentReportStyles = ReturnType<typeof makeStyles>;
