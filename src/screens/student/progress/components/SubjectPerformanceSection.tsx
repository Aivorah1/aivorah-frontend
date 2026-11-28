import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { SubjectStat } from '../types';

export function SubjectPerformanceSection({ styles, subjectStats, navigation, loading, error, onRetry }: {
  styles: any;
  subjectStats: SubjectStat[];
  navigation: any;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  return (
    <>
      <Text style={styles.sectionTitle}>Subject Performance</Text>
      {!!error && <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={styles.loadErrorBanner}>
        <Text style={styles.loadErrorText}>{error}</Text>
      </TouchableOpacity>}
      {loading && <Text style={styles.emptyText}>Loading subject progress…</Text>}
      {!loading && !error && subjectStats.length === 0 && <Text style={styles.emptyText}>No subjects are available for this profile yet.</Text>}
      {subjectStats.length > 0 && (
        <View style={styles.subjectsGrid}>
          {subjectStats.map((s) => (
            <TouchableOpacity
              key={s.name}
              style={styles.subjectCard}
              onPress={() => navigation.navigate('LearningPaths')}
              activeOpacity={0.8}
            >
              <View style={[styles.subjectIcon, { backgroundColor: s.color + '18' }]}>
                <Feather name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={styles.subjectName}>{s.name}</Text>
              {/* Pinned to the card bottom so scores line up when names wrap. */}
              <View style={styles.subjectStats}>
                <Text style={[styles.subjectScore, { color: s.color }]}>{s.pct === null ? '—' : `${s.pct}%`}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${s.pct ?? 0}%`, backgroundColor: s.color }]} />
                </View>
                {s.pct === null && !loading && !error && s.total === 0 && <Text style={styles.subjectMeta}>Topic totals unavailable</Text>}
                {s.pct !== null && <Text style={styles.subjectMeta}>{s.done} / {s.total} topics complete</Text>}
                {s.totalChapters > 0 && <Text style={styles.subjectMeta}>
                  {s.pct === null ? `${s.totalChapters} chapters` : `${s.completedChapters} / ${s.totalChapters} chapters complete`}
                </Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
}
