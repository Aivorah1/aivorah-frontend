/**
 * The Word-style page for Prepare Worksheet (web). Mounts Jodit inside this
 * view; the parent reads the document with ref.getHtml() when saving.
 * initialHtml is read once: give the component a new `key` to load another document.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import { loadJodit } from './loadJodit';
import { worksheetEditorConfig, worksheetPageCss } from './joditConfig';

export interface WorksheetEditorHandle {
  getHtml: () => string;
}

interface Props {
  initialHtml: string;
  onChange: () => void;
  colors: AppColors;
}

const WorksheetEditor = forwardRef<WorksheetEditorHandle, Props>(function WorksheetEditor({ initialHtml, onChange, colors }, ref) {
  const hostRef = useRef<View>(null);
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialRef = useRef(initialHtml);
  const bg = colors.bgDark;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'unsupported'>(Platform.OS === 'web' ? 'loading' : 'unsupported');

  useImperativeHandle(ref, () => ({ getHtml: () => String(editorRef.current?.value ?? '') }), []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    let alive = true;
    let editor: any = null;
    let styleEl: HTMLStyleElement | null = null;
    (async () => {
      const Jodit = await loadJodit();
      if (!alive) return;
      if (!Jodit) { setStatus('unsupported'); return; }
      styleEl = document.createElement('style');
      styleEl.setAttribute('data-aivorah', 'worksheet-editor');
      styleEl.textContent = worksheetPageCss(bg);
      document.head.appendChild(styleEl);
      const host = hostRef.current as unknown as HTMLElement;
      const area = document.createElement('div');
      host.appendChild(area);
      editor = Jodit.make(area, worksheetEditorConfig());
      editor.value = initialRef.current || '';
      editor.events.on('change', () => onChangeRef.current());
      editorRef.current = editor;
      setStatus('ready');
      editor.selection?.focus?.();
    })().catch(() => { if (alive) setStatus('error'); });
    return () => {
      alive = false;
      try { editor?.destruct(); } catch { /* already gone */ }
      editorRef.current = null;
      styleEl?.remove();
    };
  }, [bg]);

  if (status === 'unsupported') {
    return (
      <View style={{ alignItems: 'center', gap: 8, padding: 40 }} testID="worksheet-editor-unsupported">
        <Feather name="monitor" size={28} color={colors.textDim} />
        <Text style={{ fontSize: 13, color: colors.textDim, textAlign: 'center' }}>
          Prepare Worksheet opens on the Aivorah web app on a laptop or desktop.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, minHeight: 600 }} testID="worksheet-editor">
      {status === 'loading' && <ActivityIndicator color={colors.accentYellow} style={{ marginTop: 40 }} />}
      {status === 'error' && (
        <Text style={{ fontSize: 13, color: colors.accentRed, textAlign: 'center', marginTop: 40 }}>
          The editor could not load. Check your connection and try again.
        </Text>
      )}
      <View ref={hostRef} style={{ flex: 1 }} />
    </View>
  );
});

export default WorksheetEditor;
