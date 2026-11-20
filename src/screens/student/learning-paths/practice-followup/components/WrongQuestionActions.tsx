/**
 * Under each wrong question of a Test Report:
 *   [Explain This Question]  [Practise This Skill]
 * and, once there is saved activity, a "What you worked on" box built only
 * from the saved follow-up records for this exact test and question.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { AppColors } from '../../../../../theme';
import type { WorkedOn } from '../services/practiceFollowupApi';

export const EXPLAIN_THIS_QUESTION = 'Explain This Question';
export const PRACTISE_THIS_SKILL = 'Practise This Skill';

export default function WrongQuestionActions({ index, ready, saving, workedOn, onExplain, onPractise, colors }: {
  index: number;
  ready: boolean;          // the test is saved, so its attempt can be opened
  saving?: boolean;
  workedOn?: WorkedOn | null;
  onExplain: (index: number) => void;
  onPractise: (index: number) => void;
  colors: AppColors;
}) {
  const gold = colors.accentYellow;
  return (
    <View style={styles.wrap} testID={`wrong-actions-${index}`}>
      <View style={styles.row}>
        <TouchableOpacity disabled={!ready} onPress={() => onExplain(index)} accessibilityRole="button" accessibilityLabel={`${EXPLAIN_THIS_QUESTION} ${index + 1}`}
          style={[styles.btn, { backgroundColor: gold }, !ready && styles.off]} testID={`explain-question-${index}`}>
          <Text style={[styles.btnText, { color: '#FFFFFF' }]}>{EXPLAIN_THIS_QUESTION}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!ready} onPress={() => onPractise(index)} accessibilityRole="button" accessibilityLabel={`${PRACTISE_THIS_SKILL} ${index + 1}`}
          style={[styles.btn, { borderWidth: 1.5, borderColor: gold }, !ready && styles.off]} testID={`practise-skill-${index}`}>
          <Text style={[styles.btnText, { color: gold }]}>{PRACTISE_THIS_SKILL}</Text>
        </TouchableOpacity>
      </View>
      {!ready && saving && <Text style={[styles.muted, { color: colors.textMuted }]}>Saving your test…</Text>}
      {!!workedOn?.hasActivity && (
        <View style={[styles.box, { backgroundColor: colors.accentGreen + '14', borderColor: colors.accentGreen + '40' }]} testID={`worked-on-${index}`}>
          <Text style={[styles.boxTitle, { color: colors.textMain }]}>What you worked on</Text>
          {workedOn.lines.map((l, i) => <Text key={i} style={[styles.line, { color: colors.textMain }]}>{l}</Text>)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  btn: { flexGrow: 1, flexBasis: 180, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '800' },
  off: { opacity: 0.5 },
  muted: { fontSize: 12.5 },
  box: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  boxTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  line: { fontSize: 14, lineHeight: 20 },
});
