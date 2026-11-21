import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import StoryEditor from './StoryEditor';
import { Button, LoadState, Segment } from './ui';
import { bulkStoryStatus, listStories } from '../services/currentAffairsAdminService';
import { useLoad } from '../hooks/useLoad';
import { dayName, indiaToday, publicationLabel } from '../utils/dates';
import type { ContentStatus, StorySummary } from '../types';
import type { CaStyles } from '../styles';

const FILTERS: { value: ContentStatus; label: string }[] = [
  { value: 'review', label: 'To review' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'rejected', label: 'Rejected' },
];

/** Stories grouped by publish date, newest day first (the list arrives in that order). */
function byDate(stories: StorySummary[]): { date: string; stories: StorySummary[] }[] {
  const groups: { date: string; stories: StorySummary[] }[] = [];
  for (const s of stories) {
    const last = groups[groups.length - 1];
    if (last && last.date === s.publish_date) last.stories.push(s);
    else groups.push({ date: s.publish_date, stories: [s] });
  }
  return groups;
}

/** The review queue and every other story, by status; opens the editor. */
export default function StoriesPanel({ styles, accent }: { styles: CaStyles; accent: string }) {
  const [status, setStatus] = useState<ContentStatus>('review');
  const [open, setOpen] = useState<string | null>(null);
  const fetchStories = useCallback(() => listStories(status), [status]);
  const { data, loading, error, reload } = useLoad(fetchStories, 'Could not load stories');
  const stories = data || [];
  const today = indiaToday();

  // "Approve all" for one day's digest: asks once, then approves every story of that day.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkProblem, setBulkProblem] = useState('');

  async function approveDay(date: string, ids: string[]) {
    setApproving(date); setBulkMessage(''); setBulkProblem('');
    try {
      const results = await bulkStoryStatus(ids, 'published');
      const done = results.filter((r) => r.ok).length;
      const failed = results.filter((r) => !r.ok);
      const when = publicationLabel(date, today).kind === 'scheduled' ? `scheduled for ${dayName(date, today).toLowerCase() === 'tomorrow' ? 'tomorrow' : dayName(date, today)}` : 'live now';
      setBulkMessage(`Approved ${done} ${done === 1 ? 'story' : 'stories'} for ${date} (${when}).`);
      if (failed.length) setBulkProblem(`${failed.length} not approved: ${failed.map((f) => f.reason).filter(Boolean).join('; ')}`);
      reload();
    } catch (e: any) {
      setBulkProblem(e?.message || 'Could not approve the stories. Please try again.');
    } finally {
      setApproving(null); setConfirming(null);
    }
  }

  const row = (s: StorySummary) => {
    const pub = status === 'published' ? publicationLabel(s.publish_date, today) : null;
    return (
      <TouchableOpacity key={s.id} testID={`ca-story-row-${s.id}`} style={[styles.listRow, open === s.id && styles.listRowOn]} onPress={() => setOpen(s.id)}>
        <View style={styles.row}>
          <Text style={styles.chip}>{s.category}</Text>
          {pub ? <Text style={styles.chip} testID={`ca-story-when-${s.id}`}>{pub.label}</Text> : null}
          <Text style={styles.listMeta}>{s.publish_date} · {s.source}{s.reviewed_by === 'auto' ? ' · published automatically' : ''}</Text>
        </View>
        <Text style={styles.listTitle}>{s.title_kid}</Text>
        <Text style={styles.listMeta} numberOfLines={2}>{s.summary_kid}</Text>
        {s.review_notes && status === 'review' ? <Text style={styles.notes} numberOfLines={3}>{s.review_notes}</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.toolbar}>
        <Segment styles={styles} testID="ca-stories-filter" options={FILTERS} value={status}
          onChange={(v) => { setStatus(v); setOpen(null); setConfirming(null); setBulkMessage(''); setBulkProblem(''); }} />
        <Text style={styles.toolbarText}>{loading ? '' : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}</Text>
        <Button styles={styles} label="New story" icon="plus" kind="primary" onPress={() => setOpen('new')} testID="ca-story-new" />
      </View>

      {bulkMessage ? <Text style={styles.message} testID="ca-bulk-message">{bulkMessage}</Text> : null}
      {bulkProblem ? <Text style={styles.error} testID="ca-bulk-error">{bulkProblem}</Text> : null}

      {open ? <StoryEditor key={open} id={open} styles={styles} accent={accent} onChanged={reload} onClose={() => setOpen(null)} /> : null}

      <View style={styles.card}>
        <LoadState styles={styles} loading={loading && !data} error={error} onRetry={reload} color={accent} />
        {!loading && !error && !stories.length ? (
          <Text style={styles.emptyText} testID="ca-stories-empty">
            {status === 'review' ? 'Nothing waiting for review.' : 'No stories here yet.'}
          </Text>
        ) : null}

        {status === 'review'
          ? byDate(stories).map((g) => {
            const passed = g.date < today;
            const ids = g.stories.map((s) => s.id);
            return (
              <View key={g.date} testID={`ca-day-${g.date}`} style={{ marginBottom: 10 }}>
                <View style={[styles.row, { marginBottom: 6 }]}>
                  <Text style={styles.label}>
                    {`For ${dayName(g.date, today)} · ${g.date} · ${g.stories.length} ${g.stories.length === 1 ? 'story' : 'stories'}`}
                  </Text>
                  {passed ? (
                    <Text style={styles.notes}>This day has passed: change a story&apos;s date before approving it.</Text>
                  ) : confirming === g.date ? (
                    <>
                      <Button styles={styles} kind="primary" icon="check" testID={`ca-approve-confirm-${g.date}`}
                        label={`Yes, approve ${g.stories.length} for ${g.date}`}
                        onPress={() => approveDay(g.date, ids)} disabled={approving !== null} />
                      <Button styles={styles} label="Cancel" icon="x" onPress={() => setConfirming(null)} disabled={approving !== null} />
                      {approving === g.date ? <ActivityIndicator color={accent} /> : null}
                    </>
                  ) : (
                    <Button styles={styles} icon="check-square" testID={`ca-approve-day-${g.date}`}
                      label={`Approve all ${g.stories.length}`} onPress={() => setConfirming(g.date)} disabled={approving !== null} />
                  )}
                </View>
                {g.stories.map(row)}
              </View>
            );
          })
          : stories.map(row)}
      </View>
    </View>
  );
}
