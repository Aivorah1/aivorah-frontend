import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../hooks/useResponsive';
import { useSyllabusChapters } from '../../student/learning-paths/subject-syllabus/hooks/useSyllabusChapters';
import { applySubjectEdits, setLesson, resetLesson } from '../../student/learning-paths/subject-syllabus/subjectEdits';
import { useSubjectEditsDraft } from './hooks/useSubjectEditsDraft';
import SubjectOutline from './components/SubjectOutline';
import TopicCanvas from './components/TopicCanvas';
import Toast, { type ToastMessage } from './components/Toast';

function when(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// The teacher's own version of a subject's Learning Path: same chapters and lessons students see, every part editable.
export default function TeacherSubjectEditorScreen({ route, navigation }: any) {
  const curriculum = (route?.params?.curriculum ?? 'CBSE') as string;
  const grade = (route?.params?.grade ?? 'Grade 6') as string;
  const subject = (route?.params?.subject ?? 'Mathematics') as string;
  const { colors } = useTheme();
  const { isMobile } = useResponsive();

  const { chapters: base, loadingDb } = useSyllabusChapters(curriculum, grade, subject);
  const scope = useMemo(() => ({ curriculum, grade, subject }), [curriculum, grade, subject]);
  const draft = useSubjectEditsDraft(scope, base as any[]);
  const chapters = useMemo(() => applySubjectEdits(base as any, draft.edits, { keepHidden: true }), [base, draft.edits]);

  const [picked, setSelected] = useState<{ chapterKey: string; topicKey: string } | null>(null);
  // On a wide screen the first topic is open to begin with.
  const firstChapter = chapters.find((c) => c.topics.length);
  const selected = picked ?? (!isMobile && firstChapter ? { chapterKey: firstChapter.editKey, topicKey: firstChapter.topics[0].editKey } : null);

  const chapter = chapters.find((c) => c.editKey === selected?.chapterKey);
  const topic = chapter?.topics.find((t) => t.editKey === selected?.topicKey);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [publishing, setPublishing] = useState(false);
  async function publish() {
    const wasPublished = draft.status?.status === 'published';
    setPublishing(true);
    const ok = await draft.publish();
    setPublishing(false);
    setToast(ok
      ? { kind: 'success', title: wasPublished ? 'Updates published' : 'Published to students', detail: `Your ${grade} students now see your ${subject}.` }
      : { kind: 'error', title: 'Could not publish', detail: 'Please try again.' });
  }

  const s = draft.status;
  const statusText = draft.saving ? 'Saving…'
    : draft.dirty ? 'Unsaved changes'
      : s?.status === 'published' ? (s.hasUnpublishedChanges ? `Saved ${when(s.updatedAt)} · not yet published` : `Published ${when(s.publishedAt)} · students see this`)
        : s?.status === 'draft' ? `Draft saved ${when(s.updatedAt)} · only you can see it`
          : 'Standard path · make any change to start your version';
  const canPublish = draft.dirty || s?.status === 'draft' || !!s?.hasUnpublishedChanges;
  const liveClean = s?.status === 'published' && !s.hasUnpublishedChanges && !draft.dirty;

  const outline = (
    <SubjectOutline
      chapters={chapters}
      selectedKey={selected?.topicKey || null}
      colors={colors}
      apply={draft.apply}
      onSelect={(chapterKey, topicKey) => setSelected({ chapterKey, topicKey })}
    />
  );
  const canvas = topic && chapter ? (
    <TopicCanvas
      key={topic.editKey}
      topic={topic}
      chapterTitle={chapter.title}
      curriculum={curriculum}
      grade={grade}
      subject={subject}
      colors={colors}
      onChangeLesson={(lesson) => draft.apply(setLesson(topic.editKey, lesson))}
      onResetLesson={() => draft.apply(resetLesson(topic.editKey))}
    />
  ) : (
    <View style={{ alignItems: 'center', paddingTop: 80, gap: 10 }}>
      <Feather name="mouse-pointer" size={28} color={colors.textMuted} />
      <Text style={{ color: colors.textMuted }}>Choose a topic on the left to see and edit its lesson.</Text>
    </View>
  );

  return (
    <ScreenLayout>
      <Header title={subject} subtitle={`${curriculum} · ${grade} · your class version`} showBack onMenuPress={() => navigation?.openDrawer?.()} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderColor, backgroundColor: colors.cardDark, flexWrap: 'wrap' }}>
        {/* Status pill: icon + text + colour (mint = live, lilac = saved draft / pending, peach = unsaved). */}
        <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: liveClean ? colors.tintMint : draft.dirty ? colors.tintPeach : colors.tintLilac }}>
          <Feather name={draft.saving ? 'loader' : liveClean ? 'check-circle' : draft.dirty ? 'edit-3' : 'check'} size={15} color={liveClean ? colors.accentGreen : draft.dirty ? colors.accentOrange : colors.primary} />
          <Text testID="edits-status" style={{ flexShrink: 1, fontSize: 14, fontWeight: '600', color: colors.textMain }}>{statusText}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {!!draft.error && <Text style={{ fontSize: 14, color: colors.accentRed }}>{draft.error}</Text>}
        <TouchableOpacity testID="publish-subject" disabled={!canPublish || publishing} onPress={publish}
          accessibilityRole="button" accessibilityState={{ disabled: !canPublish || publishing }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: canPublish ? colors.primary : colors.borderColor, backgroundColor: canPublish ? colors.primary : colors.cardHover }}>
          <Feather name="upload-cloud" size={16} color={canPublish ? colors.onPrimary : colors.textMuted} />
          <Text style={{ color: canPublish ? colors.onPrimary : colors.textMuted, fontWeight: '700', fontSize: 15 }}>{publishing ? 'Publishing…' : s?.status === 'published' ? 'Publish updates' : 'Publish to students'}</Text>
        </TouchableOpacity>
      </View>

      {loadingDb || draft.loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : isMobile ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {topic ? (
            <>
              <TouchableOpacity onPress={() => setSelected(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="chevron-left" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '700' }}>All chapters</Text>
              </TouchableOpacity>
              {canvas}
            </>
          ) : outline}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <ScrollView style={{ width: 360, maxWidth: 360, borderRightWidth: 1, borderRightColor: colors.borderColor, backgroundColor: colors.cardDark }} contentContainerStyle={{ padding: 14 }}>
            {outline}
          </ScrollView>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, maxWidth: 980, width: '100%', alignSelf: 'center' }}>
            {canvas}
          </ScrollView>
        </View>
      )}
      <Toast toast={toast} colors={colors} onClose={() => setToast(null)} />
    </ScreenLayout>
  );
}
