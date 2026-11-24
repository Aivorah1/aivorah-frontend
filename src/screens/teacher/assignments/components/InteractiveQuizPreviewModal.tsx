import { useTheme } from '../../../../context/ThemeContext';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Modal, Platform, Alert } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import { answerToEditText } from '../utils/validation';
import { generateQuizHTMLPreview, stripInternalQuizFields } from '../utils/quizHtml';
import SERVER_URL from '../../../../config/serverUrl';
import ASSIGNMENTS_SERVER_URL from '../../../../config/assignmentsServerUrl';
import { EditablePicture } from './EditablePicture';
import {
  taskPicture, questionPicture, setPicture, movePicture, setQuestionField, setAnswer, setOption, markCorrectOption,
  pictureSlots, sameSlot, type PictureSlot,
} from '../utils/quizEditing';
import { useReviewLayout } from './review/useReviewLayout';
import { ReviewTopBar } from './review/ReviewTopBar';
import { QuizReviewStepper, PillButton } from './review/QuizReviewStepper';
import { cleanTitle, gradeLabel } from './review/reviewItems';

// Assignment Review (before publishing) — the screen a teacher sees after
// "Generate Quiz": Preview tries the quiz one question per card (stepper,
// Check / Hint, Previous / Next); Edit is the full editable form for every
// question type (plain, table, venn diagram). Responsive (mobile, tablet,
// laptop, TV) and themed (light/dark) from the Teacher Portal tokens.
//
// Reused for both the single-worksheet upload wizard AND bulk-upload items
// (see editingBulkItemId in the screen) — the SAME modal works for both
// flows, not a duplicate, which is why it only takes a generic quiz/setQuiz
// pair rather than anything upload- or bulk-specific.
export function InteractiveQuizPreviewModal({ quiz, setQuiz, onClose, onRegenerate, meta }: {
  quiz: any;
  setQuiz: (v: any) => void;
  onClose: () => void;
  // Generate the quiz again from the same worksheet (offered when parts are missing).
  onRegenerate?: () => void;
  // Shown under the title: school · grade · subject (falls back to the quiz's own fields).
  meta?: { school?: string; grade?: string; subject?: string };
}) {
  const { colors: t } = useTheme();
  const layout = useReviewLayout();
  const interactiveQuiz = quiz;
  const setInteractiveQuiz = setQuiz;
  const conversionReport = (interactiveQuiz as any).conversionReport;
  const needsReviewBanner = !!conversionReport && conversionReport.overallStatus !== 'COMPLETE';
  const nonPreservedCount = needsReviewBanner ? (conversionReport.items || []).filter((i: any) => i.status !== 'PRESERVED').length : 0;
  const editMode = !!(interactiveQuiz as any)._editMode;

  // Edits apply to the quiz as they are typed (nothing else to save), and the
  // student page (Open in Tab, saved with the assignment) is rebuilt in the
  // background a moment after the last edit.
  const latestQuiz = React.useRef(interactiveQuiz);
  React.useEffect(() => { latestQuiz.current = interactiveQuiz; }, [interactiveQuiz]);
  const [unrendered, setUnrendered] = React.useState<any>(null); // a quiz the page could not be built for
  const needsPreview = !(interactiveQuiz as any)._previewHTML;
  const savingPreview = editMode && needsPreview && unrendered !== interactiveQuiz;
  React.useEffect(() => {
    if (!needsPreview) return undefined;
    const sent = interactiveQuiz;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/quiz/render-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quiz: stripInternalQuizFields(sent) }),
        });
        const html = await res.text();
        // Only if nothing changed meanwhile; a newer edit schedules its own.
        if (latestQuiz.current !== sent) return;
        if (res.ok) setInteractiveQuiz({ ...sent, _previewHTML: html });
        else setUnrendered(sent);
      } catch {
        if (latestQuiz.current === sent) setUnrendered(sent);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [needsPreview, interactiveQuiz, setInteractiveQuiz]);
  const update = (next: any) => setInteractiveQuiz(next);

  // Refresh: rebuild the student page from the quiz as it is now (every edit
  // made in Edit) and restart the preview from question 1.
  const [refreshing, setRefreshing] = React.useState(false);
  const [previewKey, setPreviewKey] = React.useState(0);
  const refreshPreview = async () => {
    const current = latestQuiz.current;
    setRefreshing(true);
    try {
      const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/quiz/render-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: stripInternalQuizFields(current) }),
      });
      const html = await res.text();
      if (res.ok) setInteractiveQuiz({ ...current, _previewHTML: html, _editMode: false });
    } catch { /* keep the current preview */ }
    setPreviewKey(k => k + 1);
    setRefreshing(false);
  };

  const showPreview = () => {
    if (!editMode) return;
    setInteractiveQuiz({ ...interactiveQuiz, _editMode: false });
  };

  const showEdit = async () => {
    if (editMode) return;
    // Edit must show the same shape the student page does (e.g. a riddle task
    // collapsed into a No./Riddle/Answer table) — that transform only happens
    // server-side, so fetch it once and cache it on the quiz object.
    if ((interactiveQuiz as any)._normalized) {
      setInteractiveQuiz({ ...interactiveQuiz, _editMode: true });
      return;
    }
    const _previewHTML = (interactiveQuiz as any)._previewHTML;
    const cleanQ = stripInternalQuizFields(interactiveQuiz);
    try {
      const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/quiz/normalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz: cleanQ }),
      });
      const data = await res.json();
      setInteractiveQuiz({ ...(data.quiz || cleanQ), _previewHTML, _editMode: true, _normalized: true });
    } catch {
      setInteractiveQuiz({ ...interactiveQuiz, _editMode: true, _normalized: true });
    }
  };

  // The real student page, in a new browser tab (website only).
  const openInTab = Platform.OS === 'web' && typeof window !== 'undefined' ? async () => {
    if ((interactiveQuiz as any)._previewHTML) {
      const blob = new Blob([(interactiveQuiz as any)._previewHTML], { type: 'text/html' });
      window.open(URL.createObjectURL(blob), '_blank');
      return;
    }
    const cleanQuiz = stripInternalQuizFields(interactiveQuiz);
    try {
      const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/quiz/render-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quiz: cleanQuiz }) });
      const html = await res.text();
      window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
    } catch {
      const htmlContent = generateQuizHTMLPreview(cleanQuiz);
      window.open(URL.createObjectURL(new Blob([htmlContent], { type: 'text/html' })), '_blank');
    }
  } : undefined;

  const approve = () => {
    if (needsReviewBanner) {
      const msg = `${nonPreservedCount} task${nonPreservedCount === 1 ? '' : 's'} could not be fully verified against the source document (see the review notes). Save anyway?`;
      // Alert.alert with buttons is a no-op on react-native-web.
      if (Platform.OS === 'web') {
        if (window.confirm(msg)) onClose();
        return;
      }
      Alert.alert('Review needed before saving', msg,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Save anyway', onPress: () => { onClose(); Alert.alert('Saved', 'Interactive quiz is ready for publishing.'); } }]
      );
      return;
    }
    onClose();
    if (Platform.OS !== 'web') Alert.alert('Saved', 'Interactive quiz is ready for publishing.');
  };

  const title = cleanTitle((interactiveQuiz as any).title || (interactiveQuiz as any).chapter) || 'Interactive Quiz';
  const metaLine = [
    meta?.school || (interactiveQuiz as any).school,
    gradeLabel(meta?.grade || (interactiveQuiz as any).grade),
    meta?.subject || (interactiveQuiz as any).subject,
  ].map(v => String(v ?? '').trim()).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' · ');

  const [notesOpen, setNotesOpen] = React.useState<boolean | null>(null);
  const issueItems = needsReviewBanner ? (conversionReport.items || []).filter((i: any) => i.status !== 'PRESERVED') : [];
  const notesExpanded = notesOpen ?? (!layout.isMobile && issueItems.length <= 3);
  const textOnly = (interactiveQuiz as any).visualUnderstandingAvailable === false;
  const visionNote: string = conversionReport?.visionNote || (interactiveQuiz as any).visionUnavailableReason || '';

  const header = (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <Text testID="review-title" accessibilityRole="header" style={{ flex: 1, fontSize: layout.fs(layout.isMobile ? 21 : 26), fontWeight: '800', color: t.textHeading, lineHeight: layout.fs(layout.isMobile ? 27 : 33) }}>
          {title}
        </Text>
        {editMode && (
          <View testID="quiz-edit-saved" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingHorizontal: 12, borderRadius: 999, backgroundColor: t.tintMint }}>
            {savingPreview
              ? <ActivityIndicator size="small" color={t.textMuted} />
              : <Feather name="check" size={15} color={t.accentGreen} />}
            <Text style={{ fontSize: layout.fs(13), color: t.textMuted }}>{savingPreview ? 'Saving…' : 'All changes saved'}</Text>
          </View>
        )}
      </View>
      {!!metaLine && <Text testID="review-meta" style={{ fontSize: layout.fs(14), color: t.textMuted, fontWeight: '600' }}>{metaLine}</Text>}
    </View>
  );

  // Review notes — surfaces quiz.conversionReport so a teacher never has to
  // trust "generation succeeded" at face value. Silent when everything was
  // PRESERVED/COMPLETE (no noise on the happy path).
  const notes = needsReviewBanner ? (
    <View testID="review-notes" style={{ borderRadius: 14, borderWidth: 1, borderColor: conversionReport.overallStatus === 'FAILED' ? t.accentRed : t.accentOrange, backgroundColor: t.tintPeach || t.surfaceSubtle, padding: layout.isMobile ? 12 : 16, gap: 8 }}>
      <TouchableOpacity
        testID="review-notes-toggle"
        onPress={() => setNotesOpen(!notesExpanded)}
        accessibilityRole="button"
        accessibilityState={{ expanded: notesExpanded }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Feather name="alert-triangle" size={layout.fs(16)} color={conversionReport.overallStatus === 'FAILED' ? t.accentRed : t.accentOrange} />
        <Text style={{ flex: 1, color: t.textHeading, fontWeight: '700', fontSize: layout.fs(15) }}>
          {conversionReport.overallStatus === 'FAILED' ? 'Conversion failed'
            : nonPreservedCount > 0 ? `${nonPreservedCount} task${nonPreservedCount === 1 ? '' : 's'} need your review before publishing`
            : 'This conversion needs your review before publishing'}
        </Text>
        <Feather name={notesExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={t.textMuted} />
      </TouchableOpacity>
      {textOnly && (
        <View style={{ flexDirection: layout.isMobile ? 'column' : 'row', alignItems: layout.isMobile ? 'flex-start' : 'center', gap: 10, marginLeft: layout.isMobile ? 0 : 24 }}>
          <Text testID="quiz-preview-text-only-note" style={{ flex: layout.isMobile ? undefined : 1, color: t.textMain, fontSize: layout.fs(13), lineHeight: layout.fs(19) }}>
            {visionNote || 'Read from the worksheet’s text only (the picture-reading AI was not available) — pictures are included, but answers to picture-based questions need you in Edit.'}
          </Text>
          {onRegenerate && <PillButton t={t} layout={layout} icon="refresh-cw" label="Retry" onPress={onRegenerate} primary testID="review-notes-retry" />}
        </View>
      )}
      {notesExpanded && (
        <View style={{ gap: 6, marginLeft: layout.isMobile ? 0 : 24 }}>
          {conversionReport.taskCountWarning && (
            <Text style={{ color: t.accentRed, fontSize: layout.fs(13), fontWeight: '700' }}>{conversionReport.taskCountWarning}</Text>
          )}
          {conversionReport.missingContentWarning && (
            <Text style={{ color: t.accentRed, fontSize: layout.fs(13), fontWeight: '700' }}>{conversionReport.missingContentWarning}</Text>
          )}
          {issueItems.map((i: any, idx: number) => (
            <Text key={idx} style={{ color: t.textMain, fontSize: layout.fs(13), lineHeight: layout.fs(19) }}>
              <Text style={{ fontWeight: '700' }}>{i.status === 'FAILED' ? '✕ ' : '• '}{cleanTitle(i.title) || `Task ${idx + 1}`}:</Text> {i.reason || 'No content could be extracted or generated for this task.'}
            </Text>
          ))}
        </View>
      )}
    </View>
  ) : null;

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bgDark }}>
        <ReviewTopBar
          t={t as any}
          layout={layout}
          mode={editMode ? 'edit' : 'preview'}
          onPreview={showPreview}
          onEdit={showEdit}
          onRefresh={!editMode ? refreshPreview : undefined}
          refreshing={refreshing}
          onOpenInTab={openInTab}
          onApprove={approve}
          onClose={onClose}
        />

        {/* Preview — one question per card */}
        {!editMode && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: layout.gutter, paddingVertical: layout.isMobile ? 16 : 28 }}>
            <View style={{ width: '100%', maxWidth: layout.maxWidth, gap: layout.isMobile ? 14 : 20 }}>
              {header}
              {notes}
              <QuizReviewStepper
                key={previewKey}
                quiz={interactiveQuiz}
                t={t as any}
                layout={layout}
                onEdit={showEdit}
                onRegenerate={onRegenerate}
              />
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
        {/* Edit Mode — editable answer/hint/solution fields */}
        {(interactiveQuiz as any)._editMode && (
          <ScrollView style={{ flex: 1, backgroundColor: t.bgDark }} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: layout.gutter, paddingVertical: layout.isMobile ? 16 : 28 }}>
            {/* Preview's HTML caps content at 960px and centers it (.container { max-width:
                960px; margin:0 auto }) — without this, inputs with flex:1 stretch edge to
                edge across the whole modal instead of staying a readable card width. */}
            <View style={{ width: '100%', maxWidth: layout.maxWidth }}>
            <View style={{ gap: 14, marginBottom: 20 }}>{header}{notes}</View>
            {(() => {
              let globalQNum = 0;
              return interactiveQuiz.tasks?.map((task: any, ti: number) => {
                const tierPalette: Record<string, { border: string; bg: string; label: string; labelBg: string }> = {
                'MUST DO':   { border: t.primary, bg: t.tintLilac, label: t.primary, labelBg: t.tintLilac },
                'COULD DO':  { border: t.accentBlue, bg: t.tintBlue,  label: t.accentBlue, labelBg: t.tintBlue },
                'ENRICHMENT':{ border: t.accentOrange, bg: t.tintPeach, label: t.accentOrange, labelBg: t.tintPeach },
              };
              const tp = tierPalette[task.tier] || tierPalette['MUST DO'];
              return (
                <View key={ti} style={{ marginBottom: 20, borderLeftWidth: 5, borderLeftColor: tp.border, borderRadius: 12, backgroundColor: tp.bg, padding: 18 }}>
                  <View style={{ backgroundColor: tp.labelBg, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 4, marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: tp.label, textTransform: 'uppercase', letterSpacing: 1.5 }}>{task.tier}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: tp.label, marginBottom: 4 }}>{(task.title || '').replace(/\*\*/g, '')}</Text>
                  {(() => {
                    // The task picture (shown once above the questions in Preview) is
                    // editable: move it to a question, replace or remove it, or add one.
                    // A fill-in diagram (inputs drawn on the picture) stays as it is.
                    // A reading passage task also carries task.pageImageUrl (the raw scanned
                    // page, kept only as an internal fallback source) - shown read-only, as before.
                    const slotLabel = (qi: number) => { const qq = task.questions?.[qi]; return qq?.id ? `Question ${qq.id})` : `Question ${qi + 1}`; };
                    const fromTask: PictureSlot = { kind: 'task' };
                    const picture = taskPicture(task);
                    if (!task.diagramFillImageUrl) {
                      const anyQuestionNeedsImage = (task.questions || []).some((q: any) => q.hasImage && !q.imageUrl);
                      const scan = !picture && ((task.sharedImage && task.pageImageUrl) || (anyQuestionNeedsImage && task.pageImageUrl));
                      return (
                        <>
                          {scan ? (
                            <View style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: t.borderColor, backgroundColor: '#fff', padding: 8 }}>
                              <Image source={{ uri: scan.startsWith('http') || scan.startsWith('data:') ? scan : `${SERVER_URL}${scan}` }} style={{ width: '100%', height: 200, resizeMode: 'contain' }} />
                            </View>
                          ) : null}
                          <EditablePicture
                            testID={`edit-task-${ti}-picture`}
                            url={picture}
                            height={200}
                            addLabel="Add task picture"
                            moveTargets={pictureSlots(task, slotLabel).filter(t => !sameSlot(t.slot, fromTask))}
                            onSet={(url) => update(setPicture(interactiveQuiz, ti, fromTask, url))}
                            onMove={(to) => update(movePicture(interactiveQuiz, ti, fromTask, to))}
                          />
                          {Array.isArray(task.pyramids) && task.pyramids.length ? (
                            <View style={{ marginBottom: 12, backgroundColor: t.surfaceSubtle, borderWidth: 1, borderColor: t.borderColor, borderRadius: 8, padding: 10 }}>
                              <Text style={{ fontSize: 12, color: t.textMuted }}>Diagram: number pyramid — see Preview tab to view the rendered diagram.</Text>
                            </View>
                          ) : task.chart && Array.isArray(task.chart.bars) && task.chart.bars.length ? (
                            <View style={{ marginBottom: 12, backgroundColor: t.surfaceSubtle, borderWidth: 1, borderColor: t.borderColor, borderRadius: 8, padding: 10 }}>
                              <Text style={{ fontSize: 12, color: t.textMuted }}>Diagram: bar chart — see Preview tab to view the rendered diagram.</Text>
                            </View>
                          ) : null}
                        </>
                      );
                    }
                    const taskDiagramUrl = task.diagramFillImageUrl;
                    return (
                      <View style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: t.borderColor, backgroundColor: '#fff', padding: 8 }}>
                        <Image source={{ uri: taskDiagramUrl.startsWith('http') || taskDiagramUrl.startsWith('data:') ? taskDiagramUrl : `${SERVER_URL}${taskDiagramUrl}` }} style={{ width: '100%', height: 200, resizeMode: 'contain' }} />
                      </View>
                    );
                  })()}
                  {task.passage && (
                    <View style={{ marginBottom: 12, padding: 12, backgroundColor: t.surfaceSubtle, borderWidth: 1, borderColor: t.borderColor, borderRadius: 8 }}>
                      <Text style={{ fontSize: 13, color: t.textMain, lineHeight: 20 }}>{task.passage}</Text>
                    </View>
                  )}

                  {/* Table tasks: render every table (task.table AND task.tables[]) with its
                      real headers/columns, and make answer cells editable INSIDE the table
                      grid — the same structure the worksheet and Preview show. */}
                  {(() => {
                    const tables: { tbl: any; kind: 'table' | 'tables'; idx: number }[] = [];
                    if (task.table?.rows?.length) tables.push({ tbl: task.table, kind: 'table', idx: -1 });
                    (task.tables || []).forEach((t: any, k: number) => { if (t?.rows?.length) tables.push({ tbl: t, kind: 'tables', idx: k }); });
                    if (!tables.length) return null;
                    return tables.map((entry, tIdx) => {
                      const { tbl, kind, idx } = entry;
                      const headers: string[] = tbl.headers || [];
                      const ncols = Math.max(headers.length, ...tbl.rows.map((r: any[]) => r.length));
                      // Column widths: input columns and short/number columns stay narrow;
                      // long text columns get more room so riddle/question text stays readable.
                      const colFlex: number[] = [];
                      for (let c = 0; c < ncols; c++) {
                        const anyInput = tbl.rows.some((r: any[]) => r[c]?.input);
                        const avgLen = tbl.rows.reduce((s: number, r: any[]) => s + String(r[c]?.text ?? '').length, 0) / tbl.rows.length;
                        colFlex[c] = anyInput ? 1 : (avgLen > 14 ? 1.8 : 0.55);
                      }
                      return (
                        <View key={`tbl${tIdx}`} style={{ borderWidth: 1, borderColor: t.borderColor, borderRadius: 8, overflow: 'hidden', marginTop: 10 }}>
                          {headers.length > 0 && (
                            <View style={{ flexDirection: 'row', backgroundColor: t.borderColor }}>
                              {headers.map((h: string, hi: number) => (
                                <Text key={hi} style={{ flex: colFlex[hi] || 1, fontSize: 12, fontWeight: '700', color: t.textMain, padding: 10, textAlign: 'center' }}>{String(h)}</Text>
                              ))}
                            </View>
                          )}
                          {tbl.rows.map((row: any[], ri: number) => (
                            <View key={ri} style={{ flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1, borderTopColor: t.borderColor }}>
                              {Array.from({ length: ncols }).map((_, ci) => {
                                const cell = row[ci] || {};
                                return (
                                  <View key={ci} style={{ flex: colFlex[ci] || 1, padding: 6, justifyContent: 'center' }}>
                                    {cell.input ? (
                                      <TextInput
                                        style={{ borderWidth: 1.5, borderColor: t.borderColor, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, color: t.textMain, backgroundColor: t.surfaceSubtle, fontWeight: '600', textAlign: 'center' }}
                                        value={String(cell.answer ?? '')}
                                        onChangeText={(val) => {
                                          const u = { ...interactiveQuiz };
                                          if (kind === 'table') u.tasks[ti].table.rows[ri][ci].answer = val;
                                          else u.tasks[ti].tables[idx].rows[ri][ci].answer = val;
                                          u._previewHTML = null;
                                          setInteractiveQuiz(u);
                                        }}
                                        placeholder="?"
                                        placeholderTextColor="#6E736B"
                                      />
                                    ) : (
                                      <Text style={{ fontSize: 13, color: ci === 0 ? t.textMuted : t.textMain, padding: 4, textAlign: colFlex[ci] > 1 ? 'left' : 'center' }}>{String(cell.text ?? cell.answer ?? '')}</Text>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      );
                    });
                  })()}

                  {task.questions?.map((q: any, qi: number) => {
                    globalQNum++;
                    const questionLabel = q.id ? `${q.id})` : `Q${globalQNum}.`;
                    // Activity/open-ended questions can carry a STRUCTURED answer (e.g. a
                    // { table: [...] } object for "organise the data" tasks). String(obj)
                    // renders "[object Object]", which looked like an empty/broken answer
                    // (the "Task 3 has no answers" report). Flatten any structured answer
                    // to readable, editable text so every task shows its real answer.
                    const answerText = answerToEditText(q.answer);
                    const answerIsLong = answerText.length > 48 || answerText.includes('\n');
                    const questionInput = (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 10 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: t.textMain, lineHeight: 22, paddingTop: 7 }}>{questionLabel}</Text>
                        <TextInput
                          testID={`edit-q-${ti}-${qi}-question`}
                          style={{ flex: 1, borderWidth: 1, borderColor: t.borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, fontWeight: '600', color: t.textMain, backgroundColor: t.surfaceSubtle, lineHeight: 22 }}
                          value={String(q.question ?? '')}
                          onChangeText={(val) => update(setQuestionField(interactiveQuiz, ti, qi, 'question', val))}
                          placeholder="Question"
                          placeholderTextColor="#6E736B"
                          multiline
                        />
                      </View>
                    );
                    const hintSolution = (
                      <>
                        <View style={{ marginBottom: 10, backgroundColor: t.tintBlue, padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: t.primary }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: t.primary, marginBottom: 4 }}>Hint:</Text>
                          <TextInput testID={`edit-q-${ti}-${qi}-hint`} style={{ borderWidth: 1, borderColor: t.borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: t.textMain, backgroundColor: t.surfaceSubtle }} value={q.hint || ''} onChangeText={(val) => update(setQuestionField(interactiveQuiz, ti, qi, 'hint', val))} placeholder="Hint" placeholderTextColor="#6E736B" multiline />
                        </View>
                        <View style={{ backgroundColor: t.tintLilac, padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: t.primary }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: t.primary, marginBottom: 4 }}>Solution:</Text>
                          <TextInput testID={`edit-q-${ti}-${qi}-solution`} style={{ borderWidth: 1, borderColor: t.borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: t.textMain, backgroundColor: t.surfaceSubtle }} value={q.solution || ''} onChangeText={(val) => update(setQuestionField(interactiveQuiz, ti, qi, 'solution', val))} placeholder="Solution" placeholderTextColor="#6E736B" multiline numberOfLines={3} />
                        </View>
                      </>
                    );

                    // ── VENN DIAGRAM: edit the answer INSIDE the diagram. Two overlapping
                    //    circles with three editable regions (left-only / both / right-only),
                    //    bound to q.answers.{left,center,right}. Mirrors the Preview layout. ──
                    if (q.type === 'venn') {
                      const leftLabel = q.leftLabel || 'Group A';
                      const rightLabel = q.rightLabel || 'Group B';
                      const ans = q.answers || { left: [], center: [], right: [] };
                      const asText = (arr: any) => Array.isArray(arr) ? arr.join(', ') : String(arr ?? '');
                      const setRegion = (region: 'left' | 'center' | 'right', val: string) => {
                        const u = { ...interactiveQuiz };
                        const qq = u.tasks[ti].questions[qi];
                        if (!qq.answers) qq.answers = { left: [], center: [], right: [] };
                        qq.answers[region] = val.split(',').map((s: string) => s.trim()).filter(Boolean);
                        u._previewHTML = null;
                        setInteractiveQuiz(u);
                      };
                      const regionStyle: any = { position: 'absolute', borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.borderColor, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', color: t.textMain, fontSize: 13, padding: 6, textAlign: 'center', textAlignVertical: 'top' };
                      return (
                        <View key={qi} style={{ backgroundColor: t.cardDark, padding: 16, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: t.borderColor }}>
                          {questionInput}
                          <Text style={{ fontSize: 12, color: t.textMuted, marginBottom: 8 }}>Type answer items separated by commas — shared items go in the middle overlap.</Text>
                          <View style={{ position: 'relative', width: '100%', maxWidth: 540, height: 300, alignSelf: 'center', marginBottom: 8 }}>
                            {/* two overlapping circles */}
                            <View style={{ position: 'absolute', left: 0, top: 26, width: '60%', height: 248, borderRadius: 9999, borderWidth: 2.5, borderColor: t.primary, backgroundColor: t.tintLilac }} />
                            <View style={{ position: 'absolute', right: 0, top: 26, width: '60%', height: 248, borderRadius: 9999, borderWidth: 2.5, borderColor: t.primary, backgroundColor: t.tintBlue }} />
                            {/* circle labels */}
                            <Text style={{ position: 'absolute', left: '10%', top: 0, fontSize: 15, fontWeight: '700', color: t.primary }}>{leftLabel}</Text>
                            <Text style={{ position: 'absolute', right: '10%', top: 0, fontSize: 15, fontWeight: '700', color: t.primary }}>{rightLabel}</Text>
                            {/* three editable regions */}
                            <TextInput multiline value={asText(ans.left)} onChangeText={(v) => setRegion('left', v)} placeholder={`${leftLabel} only`} placeholderTextColor="#6E736B" style={{ ...regionStyle, left: '2%', top: 92, width: '27%', height: 132 }} />
                            <TextInput multiline value={asText(ans.center)} onChangeText={(v) => setRegion('center', v)} placeholder="Both" placeholderTextColor="#6E736B" style={{ ...regionStyle, left: '37%', top: 100, width: '26%', height: 118 }} />
                            <TextInput multiline value={asText(ans.right)} onChangeText={(v) => setRegion('right', v)} placeholder={`${rightLabel} only`} placeholderTextColor="#6E736B" style={{ ...regionStyle, right: '2%', top: 92, width: '27%', height: 132 }} />
                          </View>
                          {hintSolution}
                        </View>
                      );
                    }

                    return (
                      <View key={qi} style={{ backgroundColor: t.cardDark, padding: 16, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: t.borderColor }}>
                        {questionInput}
                      {/* A task with a structured chart shows the chart once at the top in
                          Preview (see renderBarChart), not the raw scan under each question. */}
                      {!(task.chart && Array.isArray(task.chart.bars) && task.chart.bars.length) && (() => {
                        const here: PictureSlot = { kind: 'question', qi };
                        const slotLabel = (k: number) => { const qq = task.questions?.[k]; return qq?.id ? `Question ${qq.id})` : `Question ${k + 1}`; };
                        return (
                          <EditablePicture
                            testID={`edit-q-${ti}-${qi}-picture`}
                            url={questionPicture(task, qi)}
                            height={160}
                            addLabel="Add picture"
                            moveTargets={pictureSlots(task, slotLabel).filter(t => !sameSlot(t.slot, here))}
                            onSet={(url) => update(setPicture(interactiveQuiz, ti, here, url))}
                            onMove={(to) => update(movePicture(interactiveQuiz, ti, here, to))}
                          />
                        );
                      })()}
                      {/* Multiple choice: edit each option; tap the circle to mark the correct one.
                          (Matching tasks share one pool of answers - edit those through Answer.) */}
                      {q.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0 && !task._matchTask && (
                        <View style={{ marginBottom: 10, gap: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: t.textMuted }}>Options:</Text>
                          {q.options.map((o: any, oi: number) => {
                            const label = typeof o === 'string' ? o : String(o?.label ?? '');
                            const correct = typeof o === 'object' && o && 'correct' in o ? !!o.correct : label.trim() === String(q.answer ?? '').trim();
                            return (
                              <View key={oi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TouchableOpacity testID={`edit-q-${ti}-${qi}-option-${oi}-correct`} onPress={() => update(markCorrectOption(interactiveQuiz, ti, qi, oi))} activeOpacity={0.75}>
                                  <Feather name={correct ? 'check-circle' : 'circle'} size={18} color={correct ? t.accentGreen : t.textMuted} />
                                </TouchableOpacity>
                                <TextInput
                                  testID={`edit-q-${ti}-${qi}-option-${oi}`}
                                  style={{ flex: 1, borderWidth: 1, borderColor: correct ? t.accentGreen : t.borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: t.textMain, backgroundColor: t.surfaceSubtle }}
                                  value={label}
                                  onChangeText={(val) => update(setOption(interactiveQuiz, ti, qi, oi, val))}
                                  placeholder={`Option ${oi + 1}`}
                                  placeholderTextColor="#6E736B"
                                />
                              </View>
                            );
                          })}
                        </View>
                      )}
                      <View style={{ flexDirection: answerIsLong ? 'column' : 'row', alignItems: answerIsLong ? 'stretch' : 'center', gap: 8, marginBottom: 10, backgroundColor: t.tintLilac, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: t.borderColor }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: t.primary }}>{/^-?\d+(\.\d+)?$/.test(answerText.trim()) || q.type === 'numeric' ? 'Answer =' : 'Answer:'}</Text>
                        <TextInput style={{ flex: answerIsLong ? undefined : 1, borderWidth: 1.5, borderColor: t.borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: t.textMain, backgroundColor: t.surfaceSubtle, fontWeight: '600', minHeight: answerIsLong ? 72 : undefined, textAlignVertical: answerIsLong ? 'top' : 'center' }} testID={`edit-q-${ti}-${qi}-answer`} value={answerText} onChangeText={(val) => update(setAnswer(interactiveQuiz, ti, qi, val))} placeholder="Answer" placeholderTextColor="#6E736B" multiline={answerIsLong} />
                        {q.unit && <Text style={{ fontSize: 13, color: t.textMuted, fontWeight: '500' }}>{q.unit}</Text>}
                      </View>
                      {hintSolution}
                      </View>
                    );
                  })}
                </View>
              );
            });
            })()}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
