import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../../theme';
import type { AppColors } from '../../../theme';
import { HOUR_HEIGHT } from './constants';

export const makeStyles = (c: AppColors, isDark = false, compact = false) => StyleSheet.create({
  screen:    { flex: 1, backgroundColor: c.bgDark },
  scroll:   { flex: 1 },
  content:  { padding: compact ? 14 : spacing.xl, paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.accentCyan + '12', borderWidth: 1,
    borderColor: c.accentCyan + '30', borderRadius: radius.md,
    padding: compact ? 8 : spacing.md, marginBottom: compact ? 10 : spacing.lg,
  },
  infoText: { fontSize: 12, color: c.accentCyan, flex: 1 },

  // Week nav
  weekControls: { gap: 12, marginBottom: spacing.lg },
  weekToolbar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  mobileWeekAction: { alignItems: 'flex-end' },
  mobileWeekNavBar: { flexBasis: '100%', maxWidth: '100%' },
  weekNavBar: {
    flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0, flexBasis: 290, flexGrow: 1, maxWidth: 485,
    backgroundColor: c.cardDark, borderWidth: 1, borderColor: c.borderColor,
    borderRadius: radius.lg, paddingHorizontal: 4,
  },
  navArrow:     { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  todayBtn:     { paddingHorizontal: 6, minHeight: 36, justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: c.borderColor },
  todayBtnText: { fontSize: 12, fontWeight: '600', color: c.textMuted },
  weekLabel:    { flex: 1, minWidth: 0, fontSize: 13, fontWeight: '700', color: c.textMain, textAlign: 'center' },
  dateStrip: { flexDirection: 'row', gap: 2, padding: 3, borderRadius: radius.lg, borderWidth: 1, borderColor: c.borderColor, backgroundColor: c.cardDark },
  dateButton: { flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 1, paddingVertical: 6, justifyContent: 'center', alignItems: 'center', borderRadius: 9, borderWidth: 1, borderColor: 'transparent' },
  dateButtonSelected: { backgroundColor: isDark ? '#244A46' : '#DCEFE8', borderColor: isDark ? '#76BFAF' : '#499788' },
  dateDay: { fontWeight: '700', fontSize: 13, color: c.textMain, textAlign: 'center' },
  dateNumber: { fontSize: 11, color: c.textMuted, textAlign: 'center' },
  dateTextSelected: { color: isDark ? '#BAEEE3' : '#155B53' },
  agenda: { gap: 8, marginBottom: spacing.lg },
  agendaHeading: { fontSize: 15, fontWeight: '700', color: c.textMain },
  agendaEmpty: { color: c.textMuted, fontSize: 14, padding: 14, borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.md, backgroundColor: c.cardDark },
  agendaEvent: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.md, backgroundColor: c.cardDark },
  agendaTime: { color: c.textMuted, fontSize: 12, flexShrink: 1 },
  agendaTitle: { flex: 1, minWidth: 0, color: c.textMain, fontWeight: '700', fontSize: 14 },

  // Layout
  mainLayout:        { flexDirection: 'row', gap: spacing.xl },
  calendarContainer: { flex: 1 },
  sideCol:           { width: 260, gap: spacing.lg },

  // Day header
  dayHeaderRow: {
    flexDirection: 'row', height: 62, borderBottomWidth: 1,
    borderBottomColor: c.borderColor, marginBottom: 0,
  },
  dayHeader:            { flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: c.borderColor + '50' },
  dayHeaderToday:       { backgroundColor: c.accentYellow + '12' },
  dayHeaderLabel:       { fontSize: 13.5, fontWeight: '700', color: c.textMuted },
  dayHeaderLabelToday:  { color: c.accentYellow },

  // All-day row (Toddle style holiday/vacation/timeline chips, above hourly grid)
  allDayRow: { flexDirection: 'row', minHeight: 32, borderBottomWidth: 1, borderBottomColor: c.borderColor },
  allDayCol: { paddingHorizontal: 3, paddingVertical: 4, gap: 3, minHeight: 32, borderLeftWidth: 1, borderLeftColor: c.borderColor + '50' },
  allDayGutter: { minHeight: 32, borderBottomWidth: 1, borderBottomColor: c.borderColor, alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 4, paddingLeft: 6 },
  allDayGutterText: { fontSize: 10.5, fontWeight: '600', color: c.textDim },
  allDayChip: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  allDayChipText: { flex: 1, fontSize: 11, fontWeight: '700' },

  // Grid
  timeColHeader: { height: 62, borderBottomWidth: 1, borderBottomColor: c.borderColor },
  dayCol: { position: 'relative', borderLeftWidth: 1, borderLeftColor: c.borderColor + '50', overflow: 'visible' },
  hourCell: {
    position: 'absolute', left: 0, right: 0, height: HOUR_HEIGHT,
    borderTopWidth: 1, borderTopColor: c.borderColor + '40',
    justifyContent: 'center',
  },
  timeLabel: { fontSize: 10, color: c.textDim, fontWeight: '600', textAlign: 'right', paddingRight: 6 },

  // Events
  eventBlock: {
    position: 'absolute', left: 2, right: 2,
    borderLeftWidth: 3, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 3,
    overflow: 'hidden',
  },
  eventTitle:   { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  eventTime:    { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  eventStudent: { fontSize: 10, fontWeight: '600', marginTop: 1, color: 'rgba(255,255,255,0.75)' },
  deleteBtn:    { position: 'absolute', top: 3, right: 3 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modal:        { width: '90%', maxWidth: 480, maxHeight: '88%', backgroundColor: c.cardDark, borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.xl, padding: spacing.xl },
  modalTitle:   { fontSize: 17, fontWeight: '700', color: c.textMain },
  modalInput:   { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.md, padding: spacing.md, color: c.textMain, fontSize: 14 },
  modalLabel:   { fontSize: 12, color: c.textMuted, fontWeight: '600' },
  chipRow:      { height: 40 },
  chipRowContent: { flexDirection: 'row', alignItems: 'center', paddingBottom: 2 },
  timeChip:     { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: c.borderColor, marginRight: 6 },
  timeChipActive: { borderColor: c.accentYellow, backgroundColor: c.accentYellow + '18' },
  timeChipText: { fontSize: 12, color: c.textMuted },
  studentPickerBox: { borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.md, overflow: 'hidden' },
  studentSearch: { backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: c.borderColor, padding: spacing.md, color: c.textMain, fontSize: 13 },
  studentList:  { maxHeight: 160 },
  noStudentsText: { fontSize: 12, color: c.textDim, textAlign: 'center', padding: spacing.lg },
  studentRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderColor + '60' },
  studentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.accentYellow + '30', alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 13, fontWeight: '700', color: c.accentYellow },
  studentRowName:    { fontSize: 13, fontWeight: '600', color: c.textMain },
  studentRowGrade:   { fontSize: 11, color: c.textDim },
  selectedStudentChip: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, backgroundColor: c.accentYellow + '14' },
  selectedStudentName:  { fontSize: 13, fontWeight: '600', color: c.textMain, flex: 1 },
  selectedStudentGrade: { fontSize: 11, color: c.textDim },
  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.accentRed + '14', borderWidth: 1, borderColor: c.accentRed + '40', borderRadius: radius.sm, padding: spacing.md },
  errorText: { fontSize: 12, color: c.accentRed, flex: 1 },
  modalBtns:        { flexDirection: 'row', gap: spacing.md },
  modalCancel:      { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: c.borderColor, alignItems: 'center' },
  modalCancelText:  { fontSize: 13, fontWeight: '600', color: c.textMuted },
  modalConfirm:     { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: c.accentYellow, alignItems: 'center' },
  modalConfirmText: { fontSize: 13, fontWeight: '700', color: c.onPrimary },
  // Sidebar
  sideCard:      { backgroundColor: c.cardDark, borderWidth: 1, borderColor: c.borderColor, borderRadius: radius.lg, padding: spacing.lg },
  sideTitle:     { fontSize: 14, fontWeight: '700', color: c.textMain },
});
