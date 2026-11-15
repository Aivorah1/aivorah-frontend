import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StoryEditor from './StoryEditor';
import { Button, LoadState, Segment } from './ui';
import { bulkSetStoryStatus, getPipelineLastRun, listStories, type BulkResult } from '../services/currentAffairsAdminService';
import { useLoad } from '../hooks/useLoad';
import { countWords } from '../utils/storyChecks';
import type { ContentStatus, StorySummary } from '../types';
import type { CaStyles } from '../styles';

const FILTERS: { value: ContentStatus; label: string }[] = [
  { value: 'review', label: 'To review' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'rejected', label: 'Rejected' },
];

const isVerified = (s: StorySummary) => s.review_notes === 'AUTO: VERIFIED';
const isAutoCheck = (s: StorySummary) => String(s.review_notes || '').startsWith('AUTO: CHECK');

function runTime(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return today ? `today ${time}` : `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${time}`;
}

function resultMessage(action: string, results: BulkResult[]) {
  const done = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  return `${action} ${done} ${done === 1 ? 'story' : 'stories'}.${failed.length ? ` ${failed.length} not changed: ${failed.map((f) => f.reason).join('; ')}.` : ''}`;
}

/** The review queue and every other story, by status; opens the editor. */
export default function StoriesPanel({ styles, accent }: { styles: CaStyles; accent: string }) {
  const [status, setStatus] = useState<ContentStatus>('review');
  const [open, setOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [problem, setProblem] = useState('');
  const fetchStories = useCallback(() => listStories(status), [status]);
  const { data, loading, error, reload } = useLoad(fetchStories, 'Could not load stories');
  const lastRun = useLoad(getPipelineLastRun, 'Could not load the last automatic run');
  const stories = data || [];
  const reviewing = status === 'review';

  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const selectVerified = () => setSelected(stories.filter(isVerified).map((s) => s.id).slice(0, 20));

  async function apply(next: 'published' | 'rejected') {
    setBusy(true); setMessage(''); setProblem(''); setConfirming(false);
    try {
      const { results } = await bulkSetStoryStatus(selected, next, next === 'published' ? 'today' : undefined);
      setMessage(resultMessage(next === 'published' ? 'Published' : 'Rejected', results));
      setSelected([]);
      reload();
    } catch (e: any) {
      setProblem(e?.message || 'Could not change the stories');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.toolbar}>
        <Segment styles={styles} testID="ca-stories-filter" options={FILTERS} value={status}
          onChange={(v) => { setStatus(v); setOpen(null); setSelected([]); setConfirming(false); setMessage(''); }} />
        <Text style={styles.toolbarText}>{loading ? '' : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}</Text>
        <Button styles={styles} label="New story" icon="plus" kind="primary" onPress={() => setOpen('new')} testID="ca-story-new" />
      </View>

      {reviewing ? (
        <Text style={styles.listMeta} testID="ca-pipeline-last-run">
          {lastRun.data
            ? `Last auto run: ${runTime(lastRun.data.at)} · ${lastRun.data.saved} saved · ${lastRun.data.verified} verified`
            : lastRun.loading ? '' : 'No automatic run yet.'}
        </Text>
      ) : null}

      {reviewing && stories.length ? (
        <View style={styles.toolbar}>
          <Button styles={styles} label="Select all verified" icon="check-square" onPress={selectVerified} disabled={busy} testID="ca-select-verified" />
          <Button styles={styles} label="Publish selected as today's digest" icon="send" kind="primary"
            onPress={() => setConfirming(true)} disabled={busy || !selected.length} testID="ca-publish-selected" />
          <Button styles={styles} label="Reject selected" icon="x-circle" kind="danger" onPress={() => apply('rejected')}
            disabled={busy || !selected.length} testID="ca-reject-selected" />
          <Text style={styles.toolbarText} testID="ca-selected-count">{selected.length} selected</Text>
          {busy ? <ActivityIndicator color={accent} /> : null}
        </View>
      ) : null}

      {confirming ? (
        <View style={styles.confirm} testID="ca-publish-confirm">
          <Text style={styles.listTitle}>
            Publish {selected.length} {selected.length === 1 ? 'story' : 'stories'} as today's digest?
          </Text>
          <Text style={styles.listMeta}>Students will see them right away. Check the facts first: each story is marked as checked by you.</Text>
          <View style={styles.row}>
            <Button styles={styles} label="Publish" icon="check" kind="primary" onPress={() => apply('published')} testID="ca-publish-confirm-yes" />
            <Button styles={styles} label="Cancel" onPress={() => setConfirming(false)} testID="ca-publish-confirm-no" />
          </View>
        </View>
      ) : null}
      {message ? <Text style={styles.message} testID="ca-bulk-message">{message}</Text> : null}
      {problem ? <Text style={styles.error} testID="ca-bulk-error">{problem}</Text> : null}

      {open ? <StoryEditor key={open} id={open} styles={styles} accent={accent} onChanged={reload} onClose={() => setOpen(null)} /> : null}

      <View style={styles.card}>
        <LoadState styles={styles} loading={loading && !data} error={error} onRetry={reload} color={accent} />
        {!loading && !error && !stories.length ? (
          <Text style={styles.emptyText} testID="ca-stories-empty">
            {reviewing ? 'Nothing waiting for review.' : 'No stories here yet.'}
          </Text>
        ) : null}
        {stories.map((s) => {
          const checked = selected.includes(s.id);
          return (
            <View key={s.id} style={[styles.listRow, open === s.id && styles.listRowOn, { flexDirection: 'row', gap: 12 }]}>
              {reviewing ? (
                <TouchableOpacity testID={`ca-story-check-${s.id}`} onPress={() => toggle(s.id)} style={[styles.checkbox, checked && styles.checkboxOn, { marginTop: 2 }]}
                  accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={`Select ${s.title_kid}`}>
                  {checked ? <Feather name="check" size={14} color="#fff" /> : null}
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity testID={`ca-story-row-${s.id}`} style={{ flex: 1, gap: 4 }} onPress={() => setOpen(s.id)} accessibilityHint="Opens the story to edit it">
                <View style={styles.row}>
                  <Text style={styles.chip}>{s.category}</Text>
                  {isVerified(s) ? <Text style={styles.badgeOk} testID={`ca-story-verified-${s.id}`}>VERIFIED</Text> : null}
                  {isAutoCheck(s) ? <Text style={styles.badgeCheck} testID={`ca-story-autocheck-${s.id}`}>CHECK</Text> : null}
                  <Text style={styles.listMeta}>{s.publish_date}{s.reviewed_by === 'auto' ? ' · published automatically' : ''}</Text>
                </View>
                <Text style={styles.listTitle}>{s.title_kid}</Text>
                <Text style={styles.listMeta} numberOfLines={2}>{s.summary_kid}</Text>
                {s.review_notes && reviewing ? (
                  <Text style={isVerified(s) ? styles.noteOk : styles.notes} numberOfLines={3}>{s.review_notes}</Text>
                ) : null}
                <View style={styles.row}>
                  <Text style={styles.listMeta} testID={`ca-story-counts-${s.id}`}>
                    7–12: {countWords(s.what_happened_kid)} words · 13–15: {countWords(s.what_happened_teen)} words · Source:
                  </Text>
                  {s.source_url ? (
                    <Text style={[styles.listMeta, { textDecorationLine: 'underline' }]} onPress={() => Linking.openURL(s.source_url as string)}
                      accessibilityRole="link" testID={`ca-story-source-${s.id}`}>{s.source} ↗</Text>
                  ) : <Text style={styles.listMeta}>{s.source}</Text>}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
