/**
 * Teacher Portal > Resources > Student Report, for the current academic year.
 * The class selector lists only the teacher's own classes (Home Class first,
 * then grades → sections they teach). In their home class the teacher can
 * view the full report (all subjects), Download it as PDF and Share it with
 * the student and linked parents; in any class they upload marks and view
 * marks only for their own subject(s). The API (aivorah-attendance-service
 * /reports) enforces all of this; the buttons below just follow its answer.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import ScreenLayout from '../../../components/common/ScreenLayout';
import Header from '../../../components/common/Header';
import { useToast } from '../../../components/common/Toast';
import { makeStyles } from './styles';
import { fetchClassReportInfo, fetchReportClasses } from './services/studentReportApi';
import type { ClassReportInfo, ReportClassRef, ReportClasses, ReportStudent } from './services/studentReportApi';
import ClassSelector from './components/ClassSelector';
import UploadMarksModal from './components/UploadMarksModal';
import ViewReportModal from './components/ViewReportModal';
import { downloadReport, shareReport } from './utils/reportActions';
import { downloadLearningReport } from '../../shared/learning-report/learningReport';

export default function StudentReportScreen({ navigation, route }: any) {
  // Opened from My Classes → a class: start on that class.
  const wanted = route?.params?.grade && route?.params?.section ? { grade: String(route.params.grade), section: String(route.params.section) } : null;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { showToast, ToastComponent } = useToast();

  const [classes, setClasses] = useState<ReportClasses | null>(null);
  const [classesError, setClassesError] = useState('');
  const [grade, setGrade] = useState<string | null>(null); // null = a Home Class is selected
  const [selected, setSelected] = useState<ReportClassRef | null>(null);
  // The last class loaded, tagged with its grade|section, so a newly picked class shows as loading.
  const [loaded, setLoaded] = useState<{ key: string; info?: ClassReportInfo; error?: string } | null>(null);
  const [search, setSearch] = useState('');
  const [uploadFor, setUploadFor] = useState<ReportStudent | null>(null);
  const [viewFor, setViewFor] = useState<ReportStudent | null>(null);
  const [shareFor, setShareFor] = useState<ReportStudent | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchReportClasses()
      .then((c) => {
        if (!alive) return;
        setClasses(c);
        const homeMatch = wanted && c.homeClasses.find((h) => h.grade === wanted.grade && h.section === wanted.section);
        const taughtMatch = wanted && c.grades.find((g) => g.grade === wanted.grade && g.sections.some((s) => s.section === wanted.section));
        if (homeMatch) {
          setSelected({ grade: homeMatch.grade, section: homeMatch.section });
        } else if (taughtMatch) {
          setGrade(taughtMatch.grade);
          setSelected({ grade: wanted!.grade, section: wanted!.section });
        } else if (c.homeClasses[0]) {
          setSelected({ grade: c.homeClasses[0].grade, section: c.homeClasses[0].section });
        } else if (c.grades[0]) {
          setGrade(c.grades[0].grade);
          const first = c.grades[0].sections[0];
          if (first) setSelected({ grade: c.grades[0].grade, section: first.section });
        }
      })
      .catch((e) => alive && setClassesError(e?.message || 'Could not load your classes'));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when another class is requested
  }, [wanted?.grade, wanted?.section]);

  const selectedKey = selected ? `${selected.grade}|${selected.section}` : '';
  useEffect(() => {
    if (!selected) return;
    let alive = true;
    fetchClassReportInfo(selected)
      .then((i) => { if (alive) setLoaded({ key: selectedKey, info: i }); })
      .catch((e) => { if (alive) setLoaded({ key: selectedKey, error: e?.message || 'Could not load this class' }); });
    return () => { alive = false; };
  }, [selected, selectedKey]);
  const current = selected && loaded?.key === selectedKey ? loaded : null;
  const info = current?.info ?? null;
  const infoError = current?.error ?? '';
  const infoLoading = !!selected && !current;

  const pickGrade = (g: string) => {
    setGrade(g);
    const sections = classes?.grades.find((x) => x.grade === g)?.sections || [];
    setSelected(sections.length === 1 ? { grade: g, section: sections[0].section } : null);
  };
  const pickHomeClass = (c: ReportClassRef) => { setGrade(null); setSelected(c); };

  const shown = useMemo(
    () => (info?.students || []).filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase())),
    [info, search],
  );
  const classRef = useMemo(() => (info ? { grade: info.grade, section: info.section } : null), [info]);

  // Practice tests + follow-up practice (any teacher linked to the student; the server checks).
  const onLearningReport = useCallback(async (s: ReportStudent) => {
    setBusy(true);
    try {
      const name = await downloadLearningReport(s.id);
      showToast({ title: 'Learning report downloaded', subtitle: name, type: 'success' });
    } catch (e: any) {
      showToast({ title: 'Could not download', subtitle: /authoris/i.test(e?.message || '') ? 'You can download learning reports only for students linked to you.' : e?.message, type: 'error' });
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  const onDownload = useCallback(async (s: ReportStudent) => {
    setBusy(true);
    try {
      const name = await downloadReport(s.id);
      showToast({ title: 'Report downloaded', subtitle: name, type: 'success' });
    } catch (e: any) {
      showToast({ title: 'Could not download', subtitle: e?.message, type: 'error' });
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  const confirmShare = useCallback(async () => {
    const s = shareFor;
    if (!s) return;
    setBusy(true);
    try {
      const res = await shareReport(s.id);
      const parents = res.sentTo.filter((r) => r.role === 'parent').length;
      const student = res.sentTo.some((r) => r.role === 'student');
      const to = [student ? s.name : null, parents ? `${parents} linked parent${parents > 1 ? 's' : ''}` : null].filter(Boolean).join(' and ');
      showToast({ title: 'Report shared', subtitle: `Sent to ${to} in Messages`, type: 'success' });
      setShareFor(null);
    } catch (e: any) {
      showToast({ title: 'Could not share', subtitle: e?.message, type: 'error' });
    } finally {
      setBusy(false);
    }
  }, [shareFor, showToast]);

  const noClasses = !!classes && classes.homeClasses.length === 0 && classes.grades.length === 0;

  return (
    <ScreenLayout>
      <Header
        title="Student Report"
        subtitle={classes?.academicYear ? `Marks and report cards · ${classes.academicYear}` : 'Marks and report cards'}
        onMenuPress={() => navigation?.openDrawer?.()}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!classes && !classesError ? (
          <ActivityIndicator size="large" color={colors.accentYellow} style={{ marginTop: 40 }} />
        ) : classesError ? (
          <View testID="report-error" style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color={colors.accentRed} />
            <Text style={styles.errorText}>{classesError}</Text>
          </View>
        ) : noClasses ? (
          <View testID="report-empty" style={styles.emptyContainer}>
            <Feather name="layers" size={32} color={colors.textDim} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>No classes assigned</Text>
            <Text style={styles.emptyText}>You will see a class here once you are its class teacher or teach it on the timetable.</Text>
          </View>
        ) : (
          <>
            <ClassSelector
              classes={classes!}
              selected={selected}
              grade={grade}
              onPickGrade={pickGrade}
              onPickHomeClass={pickHomeClass}
              onPickSection={setSelected}
              styles={styles}
              colors={colors}
            />

            {!selected ? (
              <Text style={styles.roleNote}>Choose a section.</Text>
            ) : infoLoading ? (
              <ActivityIndicator size="large" color={colors.accentYellow} style={{ marginTop: 40 }} />
            ) : infoError ? (
              <View testID="report-class-error" style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.accentRed} />
                <Text style={styles.errorText}>{infoError}</Text>
              </View>
            ) : info && (
              <>
                <Text style={styles.roleNote} testID="report-role-note">
                  {info.isHomeClass
                    ? `Your home class. View, download and share each student's full report${info.mySubjects.length ? `; upload marks for ${info.mySubjects.join(', ')}` : ''}.`
                    : `You teach ${info.mySubjects.join(', ')} here. Upload and view marks for ${info.mySubjects.length > 1 ? 'these subjects' : 'this subject'}.`}
                </Text>
                <View style={styles.actionsBar}>
                  <View style={styles.searchContainer}>
                    <Feather name="search" size={16} color={colors.textDim} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search student..."
                      placeholderTextColor={colors.textDim}
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>
                </View>

                {shown.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Feather name="users" size={32} color={colors.textDim} style={{ marginBottom: 10 }} />
                    <Text style={styles.emptyText}>No students found in this class.</Text>
                  </View>
                ) : (
                  <View style={styles.studentsListCard}>
                    {shown.map((s, i) => (
                      <View
                        key={s.id}
                        testID={`report-student-${s.id}`}
                        style={[styles.studentRow, i < shown.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderColor }]}
                      >
                        <View style={styles.studentInfoCol}>
                          <View style={styles.studentAvatar}>
                            <Text style={styles.studentAvatarText}>{s.name.charAt(0).toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentNameText}>{s.name}</Text>
                            {!!s.admissionNumber && <Text style={styles.studentEmailText}>{s.admissionNumber}</Text>}
                          </View>
                        </View>
                        <View style={styles.rowActions}>
                          {info.mySubjects.length > 0 && (
                            <TouchableOpacity testID={`upload-${s.id}`} style={styles.actionBtn} onPress={() => setUploadFor(s)} accessibilityRole="button">
                              <Feather name="edit-3" size={13} color={colors.textMain} />
                              <Text style={styles.actionBtnText}>Upload Marks</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity testID={`view-${s.id}`} style={styles.actionBtn} onPress={() => setViewFor(s)} accessibilityRole="button">
                            <Feather name="eye" size={13} color={colors.textMain} />
                            <Text style={styles.actionBtnText}>View Report</Text>
                          </TouchableOpacity>
                          {info.canDownload && (
                            <TouchableOpacity testID={`download-${s.id}`} style={styles.actionBtn} onPress={() => onDownload(s)} disabled={busy} accessibilityRole="button">
                              <Feather name="download" size={13} color={colors.textMain} />
                              <Text style={styles.actionBtnText}>Download</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity testID={`learning-${s.id}`} style={styles.actionBtn} onPress={() => onLearningReport(s)} disabled={busy} accessibilityRole="button">
                            <Feather name="trending-up" size={13} color={colors.textMain} />
                            <Text style={styles.actionBtnText}>Learning Report</Text>
                          </TouchableOpacity>
                          {info.canShare && (
                            <TouchableOpacity testID={`share-${s.id}`} style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => setShareFor(s)} disabled={busy} accessibilityRole="button">
                              <Feather name="send" size={13} color="#241f16" />
                              <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Share</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {classRef && info && (
        <UploadMarksModal
          student={uploadFor}
          classRef={classRef}
          subjects={info.mySubjects}
          onClose={() => setUploadFor(null)}
          onSaved={(msg) => { setUploadFor(null); showToast({ title: msg, type: 'success' }); }}
          styles={styles}
          colors={colors}
        />
      )}
      <ViewReportModal
        student={viewFor}
        onClose={() => setViewFor(null)}
        onDownload={onDownload}
        onShare={(s) => setShareFor(s)}
        busy={busy}
        styles={styles}
        colors={colors}
      />
      <Modal visible={!!shareFor} transparent animationType="fade" onRequestClose={() => setShareFor(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxWidth: 420 }]} testID="share-confirm">
            <View style={styles.modalHeader}>
              <Feather name="send" size={18} color={colors.accentYellow} />
              <Text style={styles.modalTitle}>Share report</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.ratingText}>
                Send {shareFor?.name}&apos;s full report card (PDF) to {shareFor?.name} and their linked parents in Messages?
              </Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShareFor(null)} disabled={busy} accessibilityRole="button">
                <Text style={styles.actionBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="share-send" style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={confirmShare} disabled={busy} accessibilityRole="button">
                {busy ? <ActivityIndicator size="small" color="#241f16" /> : <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {ToastComponent}
    </ScreenLayout>
  );
}
