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
import PortalThemeSwitch from '../../../../components/common/PortalThemeSwitch';
import Icon from '../../../../components/common/Icon';
import { themeWorksheetHtml, setWorksheetTheme, openWorksheetInTab } from '../utils/worksheetTheme';
import {
  taskPicture, questionPicture, setPicture, movePicture, setQuestionField, setAnswer, setOption, markCorrectOption,
  pictureSlots, sameSlot, type PictureSlot,
} from '../utils/quizEditing';

// The unified Interactive Quiz Preview/Edit-Answers modal — server-rendered
// HTML preview + a full editable form for every question type (plain,
// table, venn diagram) — extracted verbatim (no behavior change) from
// TeacherAssignmentsScreen.tsx, fifteenth step of its hooks/components
// decomposition (2026-08-25).
//
// Reused for both the single-worksheet upload wizard AND bulk-upload items
// (see editingBulkItemId in the screen) — the SAME modal works for both
// flows, not a duplicate, which is why it only takes a generic quiz/setQuiz
// pair rather than anything upload- or bulk-specific.
export function InteractiveQuizPreviewModal({ quiz, setQuiz, onClose, trail }: {
  quiz: any;
  setQuiz: (v: any) => void;
  onClose: () => void;
  /** Where the teacher came from, e.g. ['Assignments', 'New', 'Upload Worksheet'] (breadcrumb). */
  trail?: string[];
}) {
  // Teacher Portal theme tokens (light/dark). The worksheet preview is
  // server-rendered HTML; worksheetTheme rewrites its colours so it follows the
  // same theme, and flips it in place when the teacher switches (Website
  // Redesign, Phase 4) - no reload, so scroll position and answers stay.
  const { colors: t, isDark } = useTheme();
  const wsTheme = isDark ? 'dark' as const : 'light' as const;
  // Board colours (Website Redesign, Phase 4): the active view tab is a warm
  // yellow, Approve & Save green, Open in Tab blue — with readable text in both themes.
  const TAB_ON = isDark ? { bg: '#FFD58A', fg: '#101827', border: '#FFD58A' } : { bg: '#FCEBD2', fg: '#5C3704', border: '#E0A812' };
  const APPROVE = isDark ? { bg: '#7BD389', fg: '#101827' } : { bg: '#23803A', fg: '#FFFFFF' };
  const OPEN_TAB = isDark ? { bg: '#8DD1FF', fg: '#101827' } : { bg: '#1D5DB5', fg: '#FFFFFF' };
  const frameRef = React.useRef<HTMLIFrameElement | null>(null);
  const frameTheme = React.useRef(wsTheme);
  React.useEffect(() => {
    frameTheme.current = wsTheme;
    const f = frameRef.current;
    if (!f) return;
    setWorksheetTheme(f.contentDocument, wsTheme);
    f.style.background = t.bgDark;
  }, [wsTheme, t.bgDark]);
  // The worksheet sits below the toolbar (+ review banner); the toolbar wraps
  // on narrow screens, so its real height is measured rather than assumed.
  const [toolbarHeight, setToolbarHeight] = React.useState(56);
  // Active review tab: a brief colour slide on selection (web).
  const TAB_MOTION = (Platform.OS === 'web' ? { transitionProperty: 'background-color, border-color', transitionDuration: '180ms' } : {}) as any;
  const BTN = { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, borderWidth: 1 };
  const interactiveQuiz = quiz;
  const setInteractiveQuiz = setQuiz;
  const conversionReport = (interactiveQuiz as any).conversionReport;
  const needsReviewBanner = !!conversionReport && conversionReport.overallStatus !== 'COMPLETE';
  const nonPreservedCount = needsReviewBanner ? conversionReport.items.filter((i: any) => i.status !== 'PRESERVED').length : 0;
  const [reviewBannerHeight, setReviewBannerHeight] = React.useState(0);
  const editMode = !!(interactiveQuiz as any)._editMode;

  // Edits apply to the quiz as they are typed (nothing else to save), and the
  // Preview is rebuilt in the background a moment after the last edit, so it
  // already shows them when the teacher switches back.
  const latestQuiz = React.useRef(interactiveQuiz);
  React.useEffect(() => { latestQuiz.current = interactiveQuiz; }, [interactiveQuiz]);
  const [unrendered, setUnrendered] = React.useState<any>(null); // a quiz the preview could not be built for
  const needsPreview = editMode && !(interactiveQuiz as any)._previewHTML;
  const savingPreview = needsPreview && unrendered !== interactiveQuiz;
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
        if (latestQuiz.current === sent) setUnrendered(sent); // Preview fetches it on switch
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [needsPreview, interactiveQuiz, setInteractiveQuiz]);
  const update = (next: any) => setInteractiveQuiz(next);

  // Refresh: rebuild the Preview from the quiz as it is now (every edit made
  // in Edit), and redraw it. The frame is redrawn by changing its key.
  const [refreshing, setRefreshing] = React.useState(false);
  const [frameKey, setFrameKey] = React.useState(0);
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
      if (res.ok) {
        setInteractiveQuiz({ ...current, _previewHTML: html, _editMode: false });
        setFrameKey(k => k + 1);
      }
    } catch { /* keep the current preview */ }
    setRefreshing(false);
  };

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bgDark, position: 'relative' } as any}>
        {/* Top bar with tabs */}
        <View
          testID="quiz-review-toolbar"
          onLayout={(e) => setToolbarHeight(Math.round(e.nativeEvent.layout.height))}
          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', rowGap: 10, columnGap: 16, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: t.cardDark, borderBottomWidth: 1, borderBottomColor: t.borderColor }}
        >
          {/* Breadcrumb: where this review sits in the workflow. */}
          <Text testID="quiz-review-trail" style={{ flexGrow: 1, flexBasis: 240, fontSize: 13.5, color: t.textMuted }} numberOfLines={1}>
            {[...(trail ?? ['Assignments']), editMode ? 'Edit' : 'Review'].join('  ›  ')}
          </Text>
          {/* View group: Preview · Edit · Refresh (or save status while editing) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', flexShrink: 1, maxWidth: '100%' }}>
            <TouchableOpacity
              testID="quiz-review-tab-preview"
              style={{ ...BTN, borderRadius: 999, backgroundColor: !editMode ? TAB_ON.bg : t.cardDark, borderColor: !editMode ? TAB_ON.border : t.borderColor, ...TAB_MOTION }}
              accessibilityRole="tab"
              accessibilityState={{ selected: !editMode }}
              onPress={async () => {
                // Fast path: we already hold the rendered HTML and nothing was edited
                // since (edits null out _previewHTML on every keystroke), so switch back
                // to Preview instantly instead of re-fetching from the server — this is
                // what removes the lag when toggling Edit Answers → Preview.
                if ((interactiveQuiz as any)._previewHTML) {
                  setInteractiveQuiz({ ...interactiveQuiz, _editMode: false });
                  return;
                }
                const updated = { ...interactiveQuiz, _editMode: false };
                // Fetch server-rendered HTML for preview (strip internal props)
                const cleanQ = stripInternalQuizFields(interactiveQuiz);
                try {
                  const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/quiz/render-preview`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quiz: cleanQ }),
                  });
                  (updated as any)._previewHTML = await res.text();
                } catch {}
                setInteractiveQuiz(updated);
              }}
            >
              <Icon name="eye" size={17} color={!editMode ? TAB_ON.fg : t.textMain} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: !editMode ? TAB_ON.fg : t.textMain }}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="quiz-review-tab-edit"
              style={{ ...BTN, borderRadius: 999, backgroundColor: editMode ? TAB_ON.bg : t.cardDark, borderColor: editMode ? TAB_ON.border : t.borderColor, ...TAB_MOTION }}
              accessibilityRole="tab"
              accessibilityState={{ selected: editMode }}
              onPress={async () => {
                // Edit Answers must show the same shape Preview does (e.g. a riddle
                // task collapsed into a No./Riddle/Answer table) — that transform only
                // happens server-side, so fetch it once and cache it on the quiz object.
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
              }}
            >
              <Icon name="pencil" size={17} color={editMode ? TAB_ON.fg : t.textMain} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: editMode ? TAB_ON.fg : t.textMain }}>Edit</Text>
            </TouchableOpacity>
            {!editMode && (
              <TouchableOpacity
                testID="quiz-preview-refresh"
                style={{ ...BTN, backgroundColor: t.cardDark, borderColor: t.borderColor, opacity: refreshing ? 0.7 : 1 }}
                onPress={refreshPreview}
                disabled={refreshing}
              >
                {refreshing ? <ActivityIndicator size="small" color={t.textMain} /> : <Icon name="rotate-ccw" size={17} color={t.textMain} />}
                <Text style={{ fontSize: 15, fontWeight: '700', color: t.textMain }}>{refreshing ? 'Refreshing…' : 'Refresh'}</Text>
              </TouchableOpacity>
            )}
            {editMode && (
              <View testID="quiz-edit-saved" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 12, backgroundColor: t.tintMint }}>
                {savingPreview
                  ? <ActivityIndicator size="small" color={t.textMuted} />
                  : <Icon name="circle-check" size={17} color={t.accentGreen} />}
                <Text style={{ fontSize: 14, color: t.textMuted }}>{savingPreview ? 'Saving…' : 'All changes saved'}</Text>
              </View>
            )}
          </View>
          {/* Action group: Open in Tab · Approve & Save · Close */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', flexShrink: 1, maxWidth: '100%' }}>
            <TouchableOpacity
              testID="quiz-review-approve"
              style={{ ...BTN, backgroundColor: APPROVE.bg, borderColor: APPROVE.bg }}
              accessibilityRole="button"
              onPress={() => {
                if (needsReviewBanner) {
                  const msg = `${nonPreservedCount} task${nonPreservedCount === 1 ? '' : 's'} could not be fully verified against the source document (see the banner above). Save anyway?`;
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
              }}
            >
              <Icon name="circle-check" size={17} color={APPROVE.fg} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: APPROVE.fg }}>Approve & Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="quiz-review-open-tab"
              style={{ ...BTN, backgroundColor: OPEN_TAB.bg, borderColor: OPEN_TAB.bg }}
              accessibilityRole="button"
              onPress={async () => {
                // If we already have the server-rendered HTML, open it directly
                if ((interactiveQuiz as any)._previewHTML) {
                  openWorksheetInTab((interactiveQuiz as any)._previewHTML, wsTheme);
                  return;
                }
                // Otherwise fetch from server (strip internal props)
                const cleanQuiz = stripInternalQuizFields(interactiveQuiz);
                try {
                  const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/quiz/render-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quiz: cleanQuiz }) });
                  openWorksheetInTab(await res.text(), wsTheme);
                } catch {
                  openWorksheetInTab(generateQuizHTMLPreview(cleanQuiz), wsTheme);
                }
              }}
            >
              <Icon name="external-link" size={17} color={OPEN_TAB.fg} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: OPEN_TAB.fg }}>Open in Tab</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quiz-review-close" onPress={onClose} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel="Close" style={{ ...BTN, width: 44, paddingHorizontal: 0, backgroundColor: t.cardDark, borderColor: t.borderColor }}>
              <Icon name="x" size={20} color={t.textMain} />
            </TouchableOpacity>
            <PortalThemeSwitch />
          </View>
          {/* Page title (board): "Preview Worksheet" in Preview, the worksheet's own title in Edit. */}
          <View style={{ width: '100%' }}>
            {(!editMode || !!(interactiveQuiz as any).title) && (
              <Text accessibilityRole="header" style={{ fontSize: 24, lineHeight: 30, fontWeight: '600', color: t.textHeading, fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined }} numberOfLines={2}>
                {editMode ? (interactiveQuiz as any).title : 'Preview Worksheet'}
              </Text>
            )}
            {!editMode && (
              <Text style={{ fontSize: 14, color: t.textMuted, marginTop: 2 }}>Review the uploaded worksheet, click the cards to try the questions.</Text>
            )}
          </View>
        </View>

        {/* Conversion status banner — surfaces quiz.conversionReport so a teacher
            never has to trust "generation succeeded" at face value. Only shown
            when something needs eyes on it (REVIEW_REQUIRED/FAILED); a fully
            PRESERVED/COMPLETE report is silent by design (no noise on the happy path). */}
        {needsReviewBanner && (
          <View
            onLayout={(e) => setReviewBannerHeight(e.nativeEvent.layout.height)}
            style={{ backgroundColor: conversionReport.overallStatus === 'FAILED' ? t.tintPeach : t.tintPeach, borderBottomWidth: 1, borderBottomColor: t.borderColor, padding: 12 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="alert-triangle" size={15} color={conversionReport.overallStatus === 'FAILED' ? t.accentRed : t.accentOrange} />
              <Text style={{ color: t.textHeading, fontWeight: '700', fontSize: 15 }}>
                {conversionReport.overallStatus === 'FAILED' ? 'Conversion failed'
                  : nonPreservedCount > 0 ? `${nonPreservedCount} task${nonPreservedCount === 1 ? '' : 's'} need your review before publishing`
                  : 'This conversion needs your review before publishing'}
              </Text>
            </View>
            {(interactiveQuiz as any).visualUnderstandingAvailable === false && (
              <Text testID="quiz-preview-text-only-note" style={{ color: t.textMain, fontSize: 12, marginTop: 6, marginLeft: 23 }}>
                Read from the worksheet’s text only (no vision AI available right now) — pictures are included, but answers to picture-based questions need you in Edit.
              </Text>
            )}
            {conversionReport.taskCountWarning && (
              <Text style={{ color: t.accentRed, fontSize: 12, marginTop: 6, marginLeft: 23, fontWeight: '700' }}>
                ⚠ {conversionReport.taskCountWarning}
              </Text>
            )}
            {conversionReport.missingContentWarning && (
              <Text style={{ color: t.accentRed, fontSize: 12, marginTop: 6, marginLeft: 23, fontWeight: '700' }}>
                ⚠ {conversionReport.missingContentWarning}
              </Text>
            )}
            {conversionReport.items
              .filter((i: any) => i.status !== 'PRESERVED')
              .map((i: any, idx: number) => (
                <Text key={idx} style={{ color: t.textMain, fontSize: 12, marginTop: 6, marginLeft: 23 }}>
                  <Text style={{ fontWeight: '700' }}>{i.status === 'FAILED' ? '✕ ' : '⚠ '}{i.title || `Task ${idx + 1}`}:</Text> {i.reason || 'No content could be extracted or generated for this task.'}
                </Text>
              ))}
          </View>
        )}

        {/* Preview Mode — server-rendered HTML embedded */}
        {!(interactiveQuiz as any)._editMode && (interactiveQuiz as any)._previewHTML && Platform.OS === 'web' && (
          <div
            key={frameKey}
            ref={(el: any) => {
              if (el && !(el as any)._done) {
                (el as any)._done = true;
                const html = themeWorksheetHtml((interactiveQuiz as any)._previewHTML, frameTheme.current);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const f = document.createElement('iframe');
                f.src = url;
                f.style.cssText = `width:100%;border:none;background:${t.bgDark};display:block;height:100%;`;
                f.title = 'Quiz Preview';
                f.setAttribute('data-testid', 'quiz-preview-frame');
                frameRef.current = f;
                f.onload = () => {
                  try {
                    // The theme may have changed while the frame was loading.
                    setWorksheetTheme(f.contentDocument, frameTheme.current);
                    const h = f.contentDocument?.documentElement?.scrollHeight;
                    if (h && h > 100) f.style.height = h + 'px';
                  } catch {}
                  URL.revokeObjectURL(url);
                };
                el.appendChild(f);
              }
            }}
            style={{ position: 'fixed', top: toolbarHeight + (needsReviewBanner ? reviewBannerHeight : 0), left: 0, right: 0, bottom: 0, overflow: 'auto', background: t.bgDark, zIndex: 9999 } as any}
          />
        )}
        {!(interactiveQuiz as any)._editMode && !(interactiveQuiz as any)._previewHTML && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={t.primary} />
            <Text style={{ color: t.textMuted, marginTop: 12, fontSize: 14 }}>Loading preview...</Text>
            <TouchableOpacity
              style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: t.primary }}
              onPress={async () => {
                try {
                  const res = await fetch(`${ASSIGNMENTS_SERVER_URL}/quiz/render-preview`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quiz: interactiveQuiz }) });
                  const html = await res.text();
                  setInteractiveQuiz({ ...interactiveQuiz, _previewHTML: html, _editMode: false });
                } catch {}
              }}
            >
              <Text style={{ color: t.bgDark, fontWeight: '700', fontSize: 13 }}>Load Preview</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Edit Mode — editable answer/hint/solution fields */}
        {(interactiveQuiz as any)._editMode && (
          <ScrollView style={{ flex: 1, backgroundColor: t.bgDark }} contentContainerStyle={{ alignItems: 'center', padding: 16 }}>
            {/* Preview's HTML caps content at 960px and centers it (.container { max-width:
                960px; margin:0 auto }) — without this, inputs with flex:1 stretch edge to
                edge across the whole modal instead of staying a readable card width. */}
            <View style={{ width: '100%', maxWidth: 960 }}>
            {(() => {
              let globalQNum = 0;
              return interactiveQuiz.tasks?.map((task: any, ti: number) => {
                const tierPalette: Record<string, { border: string; bg: string; label: string; labelBg: string }> = {
                // Same tier accents as the themed Preview (Website Redesign, Phase 4).
                'MUST DO':   { border: t.primary, bg: t.tintPeach, label: t.primary, labelBg: t.cardDark },
                'COULD DO':  { border: t.accentBlue, bg: t.tintBlue,  label: t.accentBlue, labelBg: t.cardDark },
                'ENRICHMENT':{ border: t.accentGreen, bg: t.tintMint, label: t.accentGreen, labelBg: t.cardDark },
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
                                        placeholderTextColor={t.textDim}
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
                          placeholderTextColor={t.textDim}
                          multiline
                        />
                      </View>
                    );
                    const hintSolution = (
                      <>
                        <View style={{ marginBottom: 10, backgroundColor: t.tintBlue, padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: t.primary }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: t.primary, marginBottom: 4 }}>Hint:</Text>
                          <TextInput testID={`edit-q-${ti}-${qi}-hint`} style={{ borderWidth: 1, borderColor: t.borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: t.textMain, backgroundColor: t.surfaceSubtle }} value={q.hint || ''} onChangeText={(val) => update(setQuestionField(interactiveQuiz, ti, qi, 'hint', val))} placeholder="Hint" placeholderTextColor={t.textDim} multiline />
                        </View>
                        <View style={{ backgroundColor: t.tintLilac, padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: t.primary }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: t.primary, marginBottom: 4 }}>Solution:</Text>
                          <TextInput testID={`edit-q-${ti}-${qi}-solution`} style={{ borderWidth: 1, borderColor: t.borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: t.textMain, backgroundColor: t.surfaceSubtle }} value={q.solution || ''} onChangeText={(val) => update(setQuestionField(interactiveQuiz, ti, qi, 'solution', val))} placeholder="Solution" placeholderTextColor={t.textDim} multiline numberOfLines={3} />
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
                            <TextInput multiline value={asText(ans.left)} onChangeText={(v) => setRegion('left', v)} placeholder={`${leftLabel} only`} placeholderTextColor={t.textDim} style={{ ...regionStyle, left: '2%', top: 92, width: '27%', height: 132 }} />
                            <TextInput multiline value={asText(ans.center)} onChangeText={(v) => setRegion('center', v)} placeholder="Both" placeholderTextColor={t.textDim} style={{ ...regionStyle, left: '37%', top: 100, width: '26%', height: 118 }} />
                            <TextInput multiline value={asText(ans.right)} onChangeText={(v) => setRegion('right', v)} placeholder={`${rightLabel} only`} placeholderTextColor={t.textDim} style={{ ...regionStyle, right: '2%', top: 92, width: '27%', height: 132 }} />
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
                                  placeholderTextColor={t.textDim}
                                />
                              </View>
                            );
                          })}
                        </View>
                      )}
                      <View style={{ flexDirection: answerIsLong ? 'column' : 'row', alignItems: answerIsLong ? 'stretch' : 'center', gap: 8, marginBottom: 10, backgroundColor: t.tintLilac, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: t.borderColor }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: t.primary }}>{/^-?\d+(\.\d+)?$/.test(answerText.trim()) || q.type === 'numeric' ? 'Answer =' : 'Answer:'}</Text>
                        <TextInput style={{ flex: answerIsLong ? undefined : 1, borderWidth: 1.5, borderColor: t.borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: t.textMain, backgroundColor: t.surfaceSubtle, fontWeight: '600', minHeight: answerIsLong ? 72 : undefined, textAlignVertical: answerIsLong ? 'top' : 'center' }} testID={`edit-q-${ti}-${qi}-answer`} value={answerText} onChangeText={(val) => update(setAnswer(interactiveQuiz, ti, qi, val))} placeholder="Answer" placeholderTextColor={t.textDim} multiline={answerIsLong} />
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
