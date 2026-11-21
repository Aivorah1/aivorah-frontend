/**
 * Teacher Portal > Assignments > + New > Prepare Worksheet.
 *   History: New Document, every document the teacher saved (file name, last
 *            modified) with Download (.docx), Share (a teacher of the same
 *            school) and Assign (the Upload Worksheet flow, using this
 *            document instead of an upload). Back returns to Assignments.
 *   Editor:  a Word-style page; Save asks for a file name; Back returns to History.
 * A document shared with this teacher (Library > Shared to you) opens here
 * too; saving it keeps the teacher's own copy, the sharer's copy never changes.
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import ScreenLayout from '../../../../components/common/ScreenLayout';
import Header from '../../../../components/common/Header';
import { useToast } from '../../../../components/common/Toast';
import { makeWorksheetStyles } from './styles';
import { createWorksheet, listWorksheets, openWorksheet, updateWorksheet } from './services/worksheetsApi';
import type { WorksheetSummary } from './services/worksheetsApi';
import { downloadWorksheetDocx } from './utils/worksheetFiles';
import WorksheetEditor from './editor/WorksheetEditor';
import type { WorksheetEditorHandle } from './editor/WorksheetEditor';
import { SaveNameDialog } from './components/SaveNameDialog';
import { ShareWorksheetModal } from './components/ShareWorksheetModal';
import { WorksheetList } from './components/WorksheetList';

interface OpenDoc {
  id: string | null; // null = new, not saved yet
  title: string;
  html: string;
  isOwner: boolean;
  sharedBy: string | null;
}

const confirmLeave = () =>
  Platform.OS !== 'web' || typeof window === 'undefined' || window.confirm('Leave without saving? Your changes to this document will be lost.');

export default function PrepareWorksheetScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeWorksheetStyles(colors), [colors]);
  const { showToast, ToastComponent } = useToast();

  const [items, setItems] = useState<WorksheetSummary[] | null>(null);
  const [listError, setListError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [shareDoc, setShareDoc] = useState<WorksheetSummary | null>(null);

  const [doc, setDoc] = useState<OpenDoc | null>(null); // the editor is open when set
  const [editorKey, setEditorKey] = useState(0);
  const [opening, setOpening] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [askName, setAskName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const editorRef = useRef<WorksheetEditorHandle>(null);

  const loadList = useCallback(async () => {
    try {
      setItems(await listWorksheets());
      setListError('');
    } catch (e: any) {
      setListError(e?.message || 'Could not load your documents');
      setItems((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadList(); }, [loadList]));

  const startEditing = (next: OpenDoc) => {
    setDoc(next);
    setDirty(false);
    setEditorKey((k) => k + 1);
  };

  const openDoc = useCallback(async (id: string) => {
    setOpening(true);
    try {
      const w = await openWorksheet(id);
      startEditing({ id: w.id, title: w.title, html: w.html, isOwner: w.isOwner, sharedBy: w.sharedBy?.name || null });
    } catch (e: any) {
      showToast({ title: 'Could not open', subtitle: e?.message, type: 'error' });
    } finally {
      setOpening(false);
    }
  }, [showToast]);

  // Opened from Library > Shared to you.
  const openId: string | undefined = route?.params?.openId;
  const openNonce = route?.params?.nonce;
  useFocusEffect(useCallback(() => {
    if (!openId) return;
    navigation?.setParams?.({ openId: undefined, nonce: undefined });
    openDoc(openId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per Open click (nonce)
  }, [openId, openNonce]));

  const backToHistory = () => {
    if (dirty && !confirmLeave()) return;
    setDoc(null);
    setDirty(false);
    loadList();
  };

  const save = async (name: string) => {
    if (!doc) return;
    setSaving(true); setSaveError('');
    try {
      const html = editorRef.current?.getHtml() ?? '';
      // Someone else's shared document is saved as this teacher's own copy.
      const item = doc.id && doc.isOwner ? await updateWorksheet(doc.id, name, html) : await createWorksheet(name, html);
      setDoc({ ...doc, id: item.id, title: item.title, isOwner: true, sharedBy: null });
      setDirty(false);
      setAskName(false);
      showToast({ title: 'Document saved', subtitle: item.title, type: 'success' });
    } catch (e: any) {
      setSaveError(e?.message || 'Could not save this document');
    } finally {
      setSaving(false);
    }
  };

  const download = async (item: { id: string }) => {
    setBusyId(item.id);
    try {
      const name = await downloadWorksheetDocx(item.id);
      showToast({ title: 'Downloaded', subtitle: name, type: 'success' });
    } catch (e: any) {
      showToast({ title: 'Could not download', subtitle: e?.message, type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  // The Upload Worksheet flow on the Assignments page, with this document as its source.
  const assign = (item: { id: string; title: string }) => {
    navigation?.navigate?.('TeacherAssignments', { assignWorksheet: { id: item.id, title: item.title, nonce: Date.now() } });
  };

  // ── Editor ────────────────────────────────────────────────────────────
  if (doc) {
    return (
      <ScreenLayout>
        <View style={styles.screen}>
          <Header title="Prepare Worksheet" subtitle="Create and edit a worksheet" onMenuPress={() => navigation?.openDrawer?.()} />
          <View style={styles.topBar}>
            <TouchableOpacity testID="editor-back" style={styles.backBtn} onPress={backToHistory} accessibilityRole="button">
              <Feather name="arrow-left" size={15} color={colors.textMuted} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.topTitle} numberOfLines={1} testID="editor-title">
                {doc.title || 'Untitled document'}{dirty ? ' •' : ''}
              </Text>
              {doc.sharedBy && <Text style={styles.topSub}>Shared by {doc.sharedBy}. Saving keeps your own copy.</Text>}
            </View>
            <TouchableOpacity testID="editor-save" style={styles.primaryBtn} onPress={() => { setSaveError(''); setAskName(true); }} accessibilityRole="button">
              <Feather name="save" size={15} color={colors.onPrimary} />
              <Text style={styles.primaryBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={{ flexGrow: 1 }}>
            <WorksheetEditor
              key={editorKey}
              ref={editorRef}
              initialHtml={doc.html}
              onChange={() => setDirty(true)}
              colors={colors}
            />
          </ScrollView>
        </View>
        {askName && (
        <SaveNameDialog
          visible
          initialName={doc.isOwner ? doc.title : doc.title ? `Copy of ${doc.title}` : ''}
          saving={saving}
          error={saveError}
          onCancel={() => setAskName(false)}
          onSave={save}
          styles={styles}
          colors={colors}
        />
        )}
        {ToastComponent}
      </ScreenLayout>
    );
  }

  // ── History ───────────────────────────────────────────────────────────
  return (
    <ScreenLayout>
      <View style={styles.screen}>
        <Header title="Prepare Worksheet" subtitle="Create and edit a worksheet, then assign it to students" onMenuPress={() => navigation?.openDrawer?.()} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <TouchableOpacity testID="worksheet-back" style={styles.backBtn} onPress={() => navigation?.navigate?.('TeacherAssignments')} accessibilityRole="button">
              <Feather name="arrow-left" size={15} color={colors.textMuted} />
              <Text style={styles.backBtnText}>Assignments</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              testID="worksheet-new"
              style={styles.primaryBtn}
              onPress={() => startEditing({ id: null, title: '', html: '', isOwner: true, sharedBy: null })}
              accessibilityRole="button"
            >
              <Feather name="file-plus" size={15} color={colors.onPrimary} />
              <Text style={styles.primaryBtnText}>New Document</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>History</Text>
          {opening && <ActivityIndicator color={colors.accentYellow} />}
          {listError ? <Text style={styles.errorText}>{listError}</Text> : null}
          {items === null ? (
            <ActivityIndicator color={colors.accentYellow} style={{ marginTop: 24 }} />
          ) : items.length === 0 ? (
            <View style={styles.empty} testID="worksheet-history-empty">
              <Feather name="file-text" size={32} color={colors.textDim} />
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptyText}>Click “New Document” to prepare your first worksheet.</Text>
            </View>
          ) : (
            <WorksheetList
              variant="mine"
              items={items}
              busyId={busyId}
              onOpen={(it) => openDoc(it.id)}
              onDownload={download}
              onShare={(it) => setShareDoc(it as WorksheetSummary)}
              onAssign={assign}
              styles={styles}
              colors={colors}
            />
          )}
        </ScrollView>
      </View>
      {shareDoc && (
      <ShareWorksheetModal
        doc={shareDoc}
        onClose={() => setShareDoc(null)}
        onShared={(t) => { setShareDoc(null); showToast({ title: 'Document shared', subtitle: `Sent to ${t.name}`, type: 'success' }); }}
        styles={styles}
        colors={colors}
      />
      )}
      {ToastComponent}
    </ScreenLayout>
  );
}
