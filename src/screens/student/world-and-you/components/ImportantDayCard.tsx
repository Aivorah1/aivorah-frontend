/**
 * ImportantDayCard.tsx
 * The World & You → GK tab: explains, point by point, the important day the
 * GK fact is about — What is it? Why is it special? How is it celebrated?
 * The story, Did you know?, a quote — from the GK book (all events that day).
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import { TEAL } from '../constants';
import type { ImportantDayEvent } from '../types';

interface Props {
  events: ImportantDayEvent[] | null;
  loading: boolean;
  /** The event the GK fact names — shown first. */
  mainEventName?: string;
  /** false when the GK fact is about the next important day ("Coming up on …"). */
  isToday: boolean;
  styles: any;
  colors: AppColors;
}

const POINTS: { key: 'description' | 'why_special' | 'how_celebrated' | 'story'; label: string; icon: string }[] = [
  { key: 'description', label: 'What is it?', icon: 'info' },
  { key: 'why_special', label: 'Why is it special?', icon: 'star' },
  { key: 'how_celebrated', label: 'How is it celebrated?', icon: 'gift' },
  { key: 'story', label: 'The story', icon: 'book-open' },
];

export function orderEvents(events: ImportantDayEvent[], mainEventName?: string) {
  const main = events.filter((e) => e.event_name === mainEventName);
  return [...main, ...events.filter((e) => e.event_name !== mainEventName)];
}

function Point({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <View style={s.point}>
      <View style={s.pointHead}>
        <Feather name={icon as any} size={12} color={TEAL} />
        <Text style={[s.pointLabel, { color: TEAL }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ImportantDayCard({ events, loading, mainEventName, isToday, styles, colors }: Props) {
  if (!loading && !events?.length) return null;
  const list = orderEvents(events || [], mainEventName);
  const first = list[0];
  const when = first ? `${first.day} ${first.month}` : '';

  return (
    <View style={styles.card} testID="important-day-card">
      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: TEAL + '20' }]}>
          <Feather name="calendar" size={15} color={TEAL} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: TEAL }]}>
            {isToday ? 'About Today’s Important Day' : 'About the Next Important Day'}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>{when || 'Important days of India & the world'}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: TEAL + '25' }]} />

      {loading && !list.length ? (
        <ActivityIndicator size="small" color={TEAL} />
      ) : list.map((event, i) => (
        <View key={`${event.date}-${event.event_name}`} style={[s.event, i > 0 && { borderTopWidth: 1, borderTopColor: TEAL + '25', paddingTop: 14 }]}>
          <Text style={[s.eventName, { color: colors.textMain }]}>{event.event_name}</Text>

          {POINTS.filter((p) => event[p.key]).map((p) => (
            <Point key={p.key} icon={p.icon} label={p.label}>
              <Text style={[s.pointText, { color: colors.textMain }]}>{event[p.key]}</Text>
            </Point>
          ))}

          {event.facts?.length > 0 && (
            <Point icon="zap" label="Did you know?">
              {event.facts.map((f, j) => (
                <View key={j} style={s.bulletRow}>
                  <Text style={[s.bullet, { color: TEAL }]}>•</Text>
                  <Text style={[s.pointText, { color: colors.textMain, flex: 1 }]}>{f}</Text>
                </View>
              ))}
            </Point>
          )}

          {!!event.quote && (
            <Point icon="message-circle" label="Famous quote">
              <Text style={[s.pointText, s.quote, { color: colors.textMain }]}>{event.quote}</Text>
            </Point>
          )}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  event:      { gap: 12 },
  eventName:  { fontSize: 15, fontWeight: '800' },
  point:      { gap: 4 },
  pointHead:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pointLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  pointText:  { fontSize: 14, lineHeight: 21 },
  bulletRow:  { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet:     { fontSize: 14, lineHeight: 21, fontWeight: '800' },
  quote:      { fontStyle: 'italic' },
});
