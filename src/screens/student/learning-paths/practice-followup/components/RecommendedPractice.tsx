/**
 * "Recommended practice" under a Test Report's score: one card per curriculum
 * skill the student needs help with, each with a Practise This Skill button.
 * The saved follow-up state decides the card: Practise This Skill → Continue
 * Practice (with the saved outcome) → Practice complete + View Practice Details.
 * The original score above it never changes.
 */
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import type { Recommendation } from '../types';

export const PRACTISE_THIS_SKILL = 'Practise This Skill';

export default function RecommendedPractice({
  items, loading, error, onRetry, onPractise, onDetails, colors,
}: {
  items: Recommendation[];
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  onPractise: (item: Recommendation) => void;
  onDetails: (item: Recommendation) => void;
  colors: AppColors;
}) {
  const green = colors.accentGreen;
  const gold = colors.accentYellow;

  if (loading && !items.length) {
    return (
      <View style={styles.loadingRow} testID="followup-loading">
        <ActivityIndicator size="small" color={gold} />
        <Text style={[styles.muted, { color: colors.textMuted }]}>Checking for recommended practice…</Text>
      </View>
    );
  }
  if (error && !items.length) {
    return (
      <TouchableOpacity onPress={onRetry} style={styles.loadingRow} accessibilityRole="button" testID="followup-error">
        <Feather name="refresh-cw" size={13} color={colors.textMuted} />
        <Text style={[styles.muted, { color: colors.textMuted }]}>Couldn&apos;t load recommended practice. Tap to try again.</Text>
      </TouchableOpacity>
    );
  }
  if (!items.length) return null;

  return (
    <View style={styles.wrap} testID="recommended-practice">
      {items.map((item) => {
        const done = item.status === 'completed';
        const started = item.status === 'in_progress';
        const showOutcome = started && item.outcome.code !== 'in_progress';
        return (
          <View key={item.followupId} testID={`followup-card-${item.skillId}`}
            style={[styles.card, { backgroundColor: green + '14', borderColor: green + '40' }]}>
            {done ? (
              <View style={styles.row}>
                <Feather name="check-circle" size={20} color={green} />
                <Text style={[styles.title, { color: colors.textMain }]}>Practice complete</Text>
              </View>
            ) : (
              <Text style={[styles.kicker, { color: green }]}>{started ? 'Follow-up practice' : 'Recommended practice'}</Text>
            )}
            <Text style={[styles.skill, { color: colors.textMain }]}>{item.label}</Text>
            {done && <Text style={[styles.body, { color: colors.textMuted }]}>{item.outcome.text}</Text>}
            {showOutcome && (
              <View style={[styles.pill, { borderColor: gold + '60', backgroundColor: gold + '14' }]} testID="followup-outcome">
                <Text style={[styles.pillText, { color: colors.textMain }]}>{item.outcome.label}</Text>
              </View>
            )}
            {done ? (
              <TouchableOpacity style={[styles.btn, { backgroundColor: gold }]} onPress={() => onDetails(item)} activeOpacity={0.85}
                accessibilityRole="button" testID="followup-view-details">
                <Text style={styles.btnText}>View Practice Details</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.btn, { backgroundColor: gold }]} onPress={() => onPractise(item)} activeOpacity={0.85}
                  accessibilityRole="button" accessibilityLabel={`${started ? 'Continue Practice' : PRACTISE_THIS_SKILL}: ${item.label}`} testID="followup-practise">
                  <Text style={styles.btnText}>{started ? 'Continue Practice' : PRACTISE_THIS_SKILL}</Text>
                </TouchableOpacity>
                {item.answeredCount > 0 && (
                  <TouchableOpacity onPress={() => onDetails(item)} style={styles.link} accessibilityRole="button" testID="followup-view-details">
                    <Text style={[styles.linkText, { color: gold }]}>View Practice Details</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 10, marginTop: 16 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '800' },
  skill: { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  body: { fontSize: 14, lineHeight: 20 },
  pill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  pillText: { fontSize: 12.5, fontWeight: '700' },
  btn: { marginTop: 8, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  link: { alignSelf: 'center', paddingVertical: 6 },
  linkText: { fontSize: 13.5, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  muted: { fontSize: 13 },
});
