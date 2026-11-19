/**
 * "Why did you choose this?" — the box under each question where a student
 * explains their answer (typed, or spoken with the mic). Used in the
 * learning-path practice test and in quiz assignments, and (read-only, via
 * ReasoningDisplay) where teachers review answers and students see results.
 *
 * Design: light-blue section (#EEF3FF), 14px radius, 12/14 padding; Inter 16px
 * semi-bold navy heading; white input with a #D5DCE8 border and the mic
 * inside it on the right. No length limit.
 */
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../theme';

export const REASONING_COLORS = {
  heading: '#25324B',
  section: '#EEF3FF',
  input: '#FFFFFF',
  border: '#D5DCE8',
  text: '#64748B',
  listening: '#DC2626',
  required: '#B45309',
};

type Tone = 'blue' | 'amber';
const SECTION_BG: Record<Tone, string> = { blue: REASONING_COLORS.section, amber: '#FFF6E5' };

function useBoxColors(tone: Tone) {
  const { colors, isDark } = useTheme();
  return isDark
    ? { heading: colors.textMain, section: tone === 'amber' ? 'rgba(245,180,80,0.10)' : 'rgba(120,150,255,0.10)', input: colors.bgDark, border: colors.borderColor, text: colors.textMain, muted: colors.textMuted }
    : { heading: REASONING_COLORS.heading, section: SECTION_BG[tone], input: REASONING_COLORS.input, border: REASONING_COLORS.border, text: REASONING_COLORS.text, muted: REASONING_COLORS.text };
}

export interface ReasoningBoxProps {
  value: string;
  onChangeText: (text: string) => void;
  /** Starts / stops speech-to-text. Without it no mic is shown. */
  onToggleMic?: () => void;
  listening?: boolean;
  label?: string;
  /** 'required' shows a Required tag; 'optional' an Optional tag; omit for none. */
  requirement?: 'optional' | 'required';
  placeholder?: string;
  tone?: Tone;
  testID?: string;
}

export function reasoningLabel(questionType?: string): string {
  return questionType === 'fill_blank' || questionType === 'fill'
    ? 'Why did you write this answer?'
    : 'Why did you choose this?';
}

export default function ReasoningBox({
  value, onChangeText, onToggleMic, listening = false, label = 'Why did you choose this?',
  requirement, placeholder, tone = 'blue', testID = 'reasoning-box',
}: ReasoningBoxProps) {
  const c = useBoxColors(tone);
  const required = requirement === 'required';
  const hint = listening
    ? 'Listening… speak now'
    : placeholder || `${required ? 'Required' : 'Optional'}: explain your thinking${onToggleMic ? ' or tap the mic to speak' : ''}…`;

  return (
    <View style={[styles.section, { backgroundColor: c.section }]} testID={testID}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: c.heading }]}>{label}</Text>
        {requirement ? (
          <Text
            style={[styles.tag, required
              ? { color: REASONING_COLORS.required, backgroundColor: '#FEF3C7' }
              : { color: c.muted, backgroundColor: 'rgba(100,116,139,0.12)' }]}
            testID={`${testID}-${requirement}`}
          >
            {required ? 'Required' : 'Optional'}
          </Text>
        ) : null}
      </View>
      <View style={[styles.inputWrap, { backgroundColor: c.input, borderColor: listening ? REASONING_COLORS.listening : c.border }]}>
        <TextInput
          style={[styles.input, { color: c.text, paddingRight: onToggleMic ? 44 : 12 }]}
          placeholder={hint}
          placeholderTextColor={listening ? REASONING_COLORS.listening : c.muted}
          value={value}
          onChangeText={onChangeText}
          multiline
          accessibilityLabel={label}
          testID={`${testID}-input`}
        />
        {onToggleMic ? (
          <TouchableOpacity
            onPress={onToggleMic}
            style={[styles.mic, listening && { backgroundColor: '#FEE2E2' }]}
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Stop voice typing' : 'Speak your answer'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID={`${testID}-mic`}
          >
            <Feather name={listening ? 'mic-off' : 'mic'} size={18} color={listening ? REASONING_COLORS.listening : c.heading} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

/** Read-only version: a student's reasoning or a teacher's comment, in the same style. */
export function ReasoningDisplay({ label, text, tone = 'blue', testID }: { label: string; text: string; tone?: Tone; testID?: string }) {
  const c = useBoxColors(tone);
  if (!text || !text.trim()) return null;
  return (
    <View style={[styles.section, { backgroundColor: c.section }]} testID={testID}>
      <Text style={[styles.heading, styles.headingSmall, { color: c.heading }]}>{label}</Text>
      <View style={[styles.inputWrap, styles.readOnly, { backgroundColor: c.input, borderColor: c.border }]}>
        <Text style={[styles.readText, { color: c.text }]} selectable>{text.trim()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 8, width: '100%' },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heading: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  headingSmall: { fontSize: 14 },
  tag: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  inputWrap: { borderWidth: 1, borderRadius: 10, justifyContent: 'center' },
  input: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, minHeight: 44, paddingLeft: 12, paddingVertical: 11, textAlignVertical: 'top' },
  mic: { position: 'absolute', right: 6, top: 6, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  readOnly: { paddingHorizontal: 12, paddingVertical: 10 },
  readText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
});
