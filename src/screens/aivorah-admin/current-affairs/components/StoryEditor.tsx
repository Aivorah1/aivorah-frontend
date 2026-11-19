import React, { useCallback, useState } from 'react';
import { View, Text, Linking, ActivityIndicator } from 'react-native';
import { Button, Field, Segment } from './ui';
import { createStory, getStory, getStoryHistory, regenerateStory, setStoryStatus, updateStory, updateStoryOptimistic } from '../services/currentAffairsAdminService';
import { useLoad } from '../hooks/useLoad';
import { indiaToday, publicationLabel } from '../utils/dates';
import { CA_CATEGORIES, type CaCategory, type ContentStatus, type HistoryEntry, type Story } from '../types';
import type { CaStyles } from '../styles';

const AGES = [
  { key: 'kid', label: '7–12' },
  { key: 'teen', label: '13–15' },
] as const;
const PARTS = [
  { key: 'title', label: 'Title', multiline: false },
  { key: 'summary', label: 'Summary (one sentence for the card)', multiline: true },
  { key: 'what_happened', label: 'What happened', multiline: true },
  { key: 'why_important', label: 'Why it matters', multiline: true },
] as const;
const SHARED = [
  'did_you_know', 'think_about_it', 'new_word_1', 'def_1', 'new_word_2', 'def_2', 'new_word_3', 'def_3',
  'source', 'source_url', 'publish_date',
] as const;

type Form = Record<string, string>;

// The digest day is India's date (the service's time zone), not UTC.
const today = () => indiaToday();

// The editor's message after approving: students see it now, or on its day.
function approvedMessage(saved: Story): string {
  const when = publicationLabel(saved.publish_date);
  if (when.kind === 'scheduled') return `Approved. ${when.label} (${saved.publish_date}).`;
  return 'Published: students can read it now.';
}

const ACTIONS: Record<string, string> = {
  'story.collected': 'Collected by the news pipeline',
  'story.create': 'Written',
  'story.create_published': 'Written and approved',
  'story.edit': 'Edited',
  'story.regenerate': 'Rewritten from the source by the AI',
  'story.published': 'Approved',
  'story.review': 'Moved back to review',
  'story.rejected': 'Rejected',
  'story.draft': 'Moved to drafts',
  'story.archived': 'Archived',
};

function toForm(story: Story | null): Form {
  const form: Form = { category: story?.category || 'india', priority: String(story?.priority ?? 0) };
  for (const a of AGES) for (const p of PARTS) form[`${p.key}_${a.key}`] = String((story as any)?.[`${p.key}_${a.key}`] ?? '');
  for (const f of SHARED) form[f] = String((story as any)?.[f] ?? '');
  if (!form.publish_date) form.publish_date = today();
  return form;
}

function toFields(form: Form): Partial<Story> {
  const out: Record<string, unknown> = { ...form, priority: Number(form.priority) || 0 };
  return out as Partial<Story>;
}

/** Edit a story (or write a new one when id is 'new'); publish or reject it. */
export default function StoryEditor({ id, styles, accent, onChanged, onClose }: {
  id: string; styles: CaStyles; accent: string; onChanged: () => void; onClose: () => void;
}) {
  const isNew = id === 'new';
  const fetchStory = useCallback(() => (isNew ? Promise.resolve(null) : getStory(id)), [id, isNew]);
  const { data: story, setData: setStory, loading, error } = useLoad<Story | null>(fetchStory, 'Could not load the story');
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [problem, setProblem] = useState('');
  const [history, setHistory] = useState<{ available: boolean; entries: HistoryEntry[] } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyProblem, setHistoryProblem] = useState('');

  async function loadHistory() {
    setHistoryProblem('');
    try { setHistory(await getStoryHistory(id)); } catch (e: any) { setHistoryProblem(e?.message || 'Could not load the history'); }
  }
  const toggleHistory = () => { const next = !historyOpen; setHistoryOpen(next); if (next) loadHistory(); };

  // The form starts from the loaded story (or blank) and keeps the editor's changes.
  const current = form || (loading ? null : toForm(story));
  const set = (key: string, value: string) => setForm({ ...(current as Form), [key]: value });

  async function run(action: () => Promise<Story>, done: string | ((saved: Story) => string), optimistic = false) {
    setBusy(true); setMessage(''); setProblem('');
    try {
      const saved = await action();
      setStory(saved);
      setForm(toForm(saved));
      setMessage(typeof done === 'function' ? done(saved) : done);
      onChanged();
      if (historyOpen) loadHistory();
    } catch (e: any) {
      // Optimistic concurrency conflict (HTTP 409): someone else edited it first.
      if (optimistic && (e?.message || '').includes('edited by someone else')) {
        setProblem('This story was edited by someone else. Reload to see their changes, then try again.');
      } else {
        setProblem(e?.message || 'Could not save. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  const save = () => run(() => isNew
    ? createStory(toFields(current as Form))
    : updateStoryOptimistic(id, { ...toFields(current as Form), updated_at: story?.updated_at ?? undefined }),
    'Saved.', !isNew);
  const publish = () => run(async () => {
    if (isNew) return createStory({ ...toFields(current as Form), publish: true });
    await updateStoryOptimistic(id, { ...toFields(current as Form), updated_at: story?.updated_at ?? undefined });
    return setStoryStatus(id, 'published');
  }, approvedMessage, true);
  const changeStatus = (status: ContentStatus, done: string) => run(() => setStoryStatus(id, status), done);

  // "Rewrite from source": the AI rewrites both versions from the source page.
  // Unsaved edits would be replaced, so they must be saved (or undone) first.
  const [rewriteRequest, setRewriteRequest] = useState('');
  const canRewrite = !isNew && !!story?.source_url && (story?.status === 'review' || story?.status === 'draft');
  const hasUnsaved = !!form && !!story && JSON.stringify(form) !== JSON.stringify(toForm(story));
  const rewrite = () => {
    if (hasUnsaved) { setMessage(''); setProblem('Save your changes first: rewriting replaces the story text.'); return; }
    run(async () => {
      const saved = await regenerateStory(id, rewriteRequest.trim());
      setRewriteRequest('');
      return saved;
    }, 'Rewritten from the source. Read it and check it against the source before approving.');
  };

  if (loading || !current) return <View style={styles.card}><ActivityIndicator color={accent} /></View>;
  if (error) return <View style={styles.card}><Text style={styles.error}>{error}</Text></View>;

  return (
    <View style={styles.card} testID="ca-story-editor">
      <View style={styles.row}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={styles.cardTitle}>{isNew ? 'New story' : current.title_kid || 'Story'}</Text>
          <Text style={styles.cardSub}>
            {isNew ? 'Write both age versions (7–12 and 13–15). Save as a draft, or publish when the facts are checked.'
              : `Status: ${story?.status}${story?.status === 'published' && story.publish_date ? ` · ${publicationLabel(story.publish_date).label}` : ''}${story?.reviewed_by ? ` · last reviewed by ${story.reviewed_by}` : ''}`}
          </Text>
        </View>
        <Button styles={styles} label="Close" icon="x" onPress={onClose} testID="ca-story-close" />
      </View>

      {story?.review_notes ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>Automatic check notes</Text>
          <Text style={styles.notes} testID="ca-story-notes">{story.review_notes}</Text>
        </View>
      ) : null}
      {story?.source_url ? (
        <Text style={[styles.listMeta, { marginTop: 8, textDecorationLine: 'underline' }]} onPress={() => Linking.openURL(story.source_url as string)}>
          Open the source article ({story.source})
        </Text>
      ) : null}

      <Text style={styles.label}>Category</Text>
      <Segment styles={styles} testID="ca-story-category" value={current.category as CaCategory}
        options={CA_CATEGORIES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))} onChange={(v) => set('category', v)} />

      <View style={styles.ageGrid}>
        {AGES.map((a) => (
          <View key={a.key} style={styles.ageCol}>
            <Text style={styles.ageHead}>{a.label}</Text>
            {PARTS.map((p) => (
              <Field key={p.key} styles={styles} label={p.label} multiline={p.multiline} testID={`ca-story-${p.key}_${a.key}`}
                value={current[`${p.key}_${a.key}`]} onChange={(v) => set(`${p.key}_${a.key}`, v)} />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.ageGrid}>
        <View style={styles.ageCol}>
          <Field styles={styles} label="Did you know? (check it against a source)" multiline value={current.did_you_know} onChange={(v) => set('did_you_know', v)} testID="ca-story-did_you_know" />
          <Field styles={styles} label="Think about it" multiline value={current.think_about_it} onChange={(v) => set('think_about_it', v)} />
        </View>
        <View style={styles.ageCol}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={styles.row}>
              <View style={{ flex: 1, minWidth: 120 }}><Field styles={styles} label={`New word ${n}`} value={current[`new_word_${n}`]} onChange={(v) => set(`new_word_${n}`, v)} /></View>
              <View style={{ flex: 2, minWidth: 160 }}><Field styles={styles} label="Meaning" value={current[`def_${n}`]} onChange={(v) => set(`def_${n}`, v)} /></View>
            </View>
          ))}
        </View>
        <View style={styles.ageCol}>
          <Field styles={styles} label="Source (where the facts come from)" value={current.source} onChange={(v) => set('source', v)} testID="ca-story-source" />
          <Field styles={styles} label="Source link" value={current.source_url} onChange={(v) => set('source_url', v)} />
          <Field styles={styles} label="Publish date (YYYY-MM-DD)" value={current.publish_date} onChange={(v) => set('publish_date', v)} />
          <Field styles={styles} label="Priority (higher shows first)" value={current.priority} onChange={(v) => set('priority', v)} />
        </View>
      </View>

      {canRewrite ? (
        <View style={{ marginTop: 16 }}>
          <Field styles={styles} label="Ask the AI to rewrite it from the source (optional: what should change?)" value={rewriteRequest}
            onChange={setRewriteRequest} placeholder="e.g. Simpler words for 7–12; the date in the headline is wrong" testID="ca-story-rewrite-request" />
        </View>
      ) : null}
      <View style={[styles.row, { marginTop: 16 }]}>
        <Button styles={styles} label={isNew ? 'Save as draft' : 'Save changes'} icon="save" onPress={save} disabled={busy} testID="ca-story-save" />
        {canRewrite ? (
          <Button styles={styles} label="Rewrite from source" icon="refresh-cw" onPress={rewrite} disabled={busy} testID="ca-story-rewrite" />
        ) : null}
        {story?.status === 'rejected' ? (
          // A rejected story is never published (the server refuses it too).
          <Text style={styles.notes} testID="ca-story-rejected-note">Rejected: this story can no longer be published.</Text>
        ) : (
          <Button styles={styles} label="Publish" icon="check" kind="primary" onPress={publish} disabled={busy} testID="ca-story-publish" />
        )}
        {!isNew && story?.status !== 'rejected' ? (
          <Button styles={styles} label="Reject" icon="x-circle" kind="danger" onPress={() => changeStatus('rejected', 'Rejected: it will not be shown.')} disabled={busy} testID="ca-story-reject" />
        ) : null}
        {!isNew && story?.status === 'published' ? (
          <Button styles={styles} label="Unpublish" icon="eye-off" onPress={() => changeStatus('review', 'Moved back to review.')} disabled={busy} testID="ca-story-unpublish" />
        ) : null}
        {busy ? <ActivityIndicator color={accent} /> : null}
        {message ? <Text style={styles.message} testID="ca-story-message">{message}</Text> : null}
        {problem ? <Text style={styles.error} testID="ca-story-error">{problem}</Text> : null}
      </View>

      {!isNew ? (
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.listMeta, { textDecorationLine: 'underline' }]} onPress={toggleHistory} testID="ca-story-history-toggle">
            {historyOpen ? 'Hide approval history' : 'Show approval history'}
          </Text>
          {historyOpen ? (
            <View style={{ marginTop: 8, gap: 6 }} testID="ca-story-history">
              {historyProblem ? <Text style={styles.error}>{historyProblem}</Text> : null}
              {!history && !historyProblem ? <ActivityIndicator color={accent} /> : null}
              {history && !history.available ? (
                <Text style={styles.notes}>History is not switched on yet: the ca_audit_log table (aivorah-db 0029) has not been added to the database.</Text>
              ) : null}
              {history?.available && !history.entries.length ? <Text style={styles.listMeta}>No changes recorded yet.</Text> : null}
              {history?.entries.map((h) => (
                <View key={h.id} testID={`ca-history-${h.id}`}>
                  <Text style={styles.listMeta}>
                    {new Date(h.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                    {' · '}{ACTIONS[h.action] || h.action}{' · '}{h.actor}
                  </Text>
                  {h.detail ? <Text style={styles.message}>{h.detail}</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
