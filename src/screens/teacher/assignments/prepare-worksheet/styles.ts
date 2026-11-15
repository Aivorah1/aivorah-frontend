import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../../../theme';
import type { AppColors } from '../../../../theme';

// Same tokens and shapes as the Assignments page (TeacherAssignmentsScreen makeStyles).
export const makeWorksheetStyles = (c: AppColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bgDark },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.lg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.borderColor, backgroundColor: c.bgDark,
  },
  topTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: c.textMain },
  topSub: { fontSize: 11, color: c.textDim, marginTop: 2 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.md, borderWidth: 1, borderColor: c.borderColor, backgroundColor: c.cardDark,
  },
  backBtnText: { fontSize: 13, fontWeight: '600', color: c.textMuted },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: c.accentYellow, paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.md,
  },
  primaryBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: c.accentYellow, backgroundColor: 'transparent',
  },
  outlineBtnText: { fontSize: 13, fontWeight: '700', color: c.accentYellow },

  sectionLabel: { fontSize: 12, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  listCard: { backgroundColor: c.cardDark, borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.xl, overflow: 'hidden' },
  listHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.borderColor },
  listHeadText: { fontSize: 11, fontWeight: '700', color: c.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: c.borderColor },
  colName: { flex: 1, minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: 10 },
  colDate: { width: 190 },
  colActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  fileIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.accentYellow + '18', alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 14, fontWeight: '700', color: c.textMain },
  fileMeta: { fontSize: 12, color: c.textDim },
  actionBtn: {
    height: 30, paddingHorizontal: 10, borderRadius: 8, backgroundColor: c.bgDark,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, borderWidth: 1, borderColor: c.borderColor,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: c.textMain },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: c.textMain },
  emptyText: { fontSize: 13, color: c.textDim, textAlign: 'center' },
  errorText: { fontSize: 13, color: c.accentRed, fontWeight: '600' },
  note: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.accentYellow + '18', borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: c.accentYellow + '30',
  },
  noteText: { fontSize: 12, color: c.accentYellow, flex: 1 },

  // Dialogs (same as the Assignments modals)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalBox: {
    backgroundColor: c.cardDark, borderRadius: 20, borderWidth: 1, borderColor: c.borderColor,
    overflow: 'hidden', width: '100%', maxWidth: 480, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: c.borderColor,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: c.textMain },
  modalBody: { padding: spacing.xl, gap: spacing.md },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: c.bgDark, borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, color: c.textMain, fontSize: 14,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.bgDark,
    borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.md, paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 11, color: c.textMain, fontSize: 14 },
  teacherRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: c.borderColor, backgroundColor: c.bgDark,
  },
  teacherRowActive: { borderColor: c.accentYellow, backgroundColor: c.accentYellow + '18' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.accentYellow + '25', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: c.accentYellow },
});

export type WorksheetStyles = ReturnType<typeof makeWorksheetStyles>;
