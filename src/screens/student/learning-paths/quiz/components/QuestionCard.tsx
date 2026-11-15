/**
 * QuestionCard - one practice question in its own card on the all-questions
 * page (QuizQuestionList): number, question text, type tag, then the options
 * (MCQ), the answer box (fill-in-the-blank) or the mic (spoken), and the
 * explanation once it is answered. Same colours and answer rules as before.
 */
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import TransliterationInput, { resolveTypingLang } from '../../../../../components/common/TransliterationInput';
import type { AppColors } from '../../../../../theme';
import type { makeStyles } from '../styles';
import type { Question, QuestionAnswer, SpokenStatus } from '../types';
import SpokenQuestion from './SpokenQuestion';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const WRONG = '#C98A8A'; // warm amber-red for wrong
// Right answers are green (client's spec). Darker on the light theme's cream
// background so it stays readable. Exported for the tests.
export const correctGreen = (isDark: boolean) => (isDark ? '#7BC47F' : '#2E7D32');

export default function QuestionCard({
  index, q, answer, isCorrect, topic, subject, colors, isDark, styles,
  onMcqAnswer, setFillInput, onFillSubmit,
  spokenText, setSpokenText, spokenStatus, spokenError, onSpokenSubmit,
}: {
  index: number;
  q: Question;
  answer: QuestionAnswer;
  // The recorded result once answered (undefined while unanswered)
  isCorrect?: boolean;
  topic: string;
  subject: string;
  colors: AppColors;
  isDark: boolean;
  styles: ReturnType<typeof makeStyles>;
  onMcqAnswer: (optIdx: number) => void;
  setFillInput: (s: string) => void;
  onFillSubmit: () => void;
  spokenText: string;
  setSpokenText: (t: string) => void;
  spokenStatus: SpokenStatus;
  spokenError: string;
  onSpokenSubmit: () => void;
}) {
  const accent = colors.accentYellow;
  const CORRECT = correctGreen(isDark);
  const isFill = q.type === 'fill_blank';
  const isSpoken = q.type === 'spoken';
  const { mcqSelected, mcqDone, showMcqHint, fillInput, fillFeedback, fillValidating, explanation, loadingExplain, recorded } = answer;
  const wellDone = isSpoken ? !!isCorrect : (mcqDone && mcqSelected === (q.correct as number)) || fillFeedback === 'correct';

  return (
    <View testID={`question-card-${index}`} style={[styles.qCard, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]}>
      {/* ── Number, question, type tag ── */}
      <View style={styles.qCardHeader}>
        <View style={[styles.qNumber, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
          <Text style={[styles.qNumberText, { color: accent }]}>{index + 1}</Text>
        </View>
        <Text style={[styles.qCardText, { color: colors.textMain }]}>{q.question}</Text>
        <View style={[styles.leftTypeBadge, { backgroundColor: accent + '18', borderColor: accent + '40', marginTop: 0 }]}>
          <Feather name={isSpoken ? 'mic' : isFill ? 'edit-3' : 'list'} size={10} color={accent} />
          <Text style={[styles.leftTypeTxt, { color: accent }]}>{isSpoken ? 'Speak' : isFill ? 'Fill Blank' : 'MCQ'}</Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />

      {/* ── Spoken explanation (last question) ── */}
      {isSpoken && (recorded ? (
        <View style={styles.fillArea}>
          <View style={[styles.fillResultRow, { backgroundColor: accent + '12', borderColor: accent + '40', alignItems: 'flex-start' }]}>
            <Feather name="mic" size={14} color={accent} style={{ marginTop: 2 }} />
            <Text style={[styles.optionText, { color: colors.textMain }]}>{spokenText}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.fillArea}>
          <SpokenQuestion
            hint={q.hint}
            text={spokenText}
            setText={setSpokenText}
            status={spokenStatus}
            error={spokenError}
            onSubmit={onSpokenSubmit}
            colors={colors}
            isDark={isDark}
          />
        </View>
      ))}

      {/* ── MCQ options ── */}
      {!isFill && !isSpoken && (
        <View style={styles.optionsList}>
          {q.options.map((opt, i) => {
            const isSelected = mcqSelected === i;
            const isRight = (q.correct as number) === i;
            const showResult = mcqDone;

            let radioFill = 'transparent';
            let radioBorder = isDark ? '#555' : '#B8CCCA';
            let textCol = colors.textMain;
            let rowBg = 'transparent';
            let leftBorder = 'transparent';
            let resultIcon: 'check-circle' | 'x-circle' | null = null;

            if (showResult) {
              if (isRight) { radioFill = CORRECT; radioBorder = CORRECT; textCol = CORRECT; rowBg = CORRECT + '1F'; leftBorder = CORRECT; resultIcon = 'check-circle'; }
              else if (isSelected) { radioFill = WRONG; radioBorder = WRONG; textCol = WRONG; rowBg = isDark ? '#C98A8A12' : '#FFF6F0'; leftBorder = WRONG; resultIcon = 'x-circle'; }
              else { radioBorder = isDark ? '#333' : '#DDD'; textCol = isDark ? '#444' : '#CCC'; }
            } else if (isSelected) {
              radioFill = accent; radioBorder = accent; textCol = accent;
              rowBg = accent + '14'; leftBorder = accent;
            }

            return (
              <TouchableOpacity key={i}
                testID={`option-${index}-${i}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: mcqSelected !== null || mcqDone }}
                style={[styles.optionRow, { backgroundColor: rowBg, borderLeftColor: leftBorder }]}
                onPress={() => onMcqAnswer(i)}
                activeOpacity={mcqSelected !== null ? 1 : 0.65}
                disabled={mcqSelected !== null || mcqDone}
              >
                <View style={[styles.radioOuter, { borderColor: radioBorder }]}>
                  {radioFill !== 'transparent' && <View style={[styles.radioInner, { backgroundColor: radioFill }]} />}
                </View>
                <Text style={[styles.optionLetter, { color: showResult ? (isRight ? CORRECT : isSelected ? WRONG : isDark ? '#444' : '#DDD') : (isSelected ? accent : colors.textMuted) }]}>{LETTERS[i]}</Text>
                <Text style={[styles.optionText, { color: textCol }]}>{opt}</Text>
                {resultIcon && <Feather name={resultIcon} size={14} color={resultIcon === 'check-circle' ? CORRECT : WRONG} style={{ marginLeft: 'auto' as any }} />}
              </TouchableOpacity>
            );
          })}

          {/* Hint after a first wrong answer */}
          {showMcqHint && !mcqDone && (
            <View style={[styles.hintBanner, { backgroundColor: accent + '10', borderColor: accent + '40' }]}>
              <Feather name="zap" size={12} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.hintBannerLabel}>Aivorah&apos;s Hint</Text>
                <Text style={styles.hintBannerText}>{q.hint || 'Think carefully before your next attempt!'}</Text>
              </View>
              <View style={[styles.retryChip, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
                <Feather name="refresh-cw" size={9} color={accent} />
                <Text style={[styles.retryChipText, { color: accent }]}>retry</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Fill-in-the-blank ── */}
      {isFill && (
        <View style={styles.fillArea}>
          {fillFeedback === 'correct' ? (
            <View style={[styles.fillResultRow, { backgroundColor: CORRECT + '1F', borderColor: CORRECT + '55' }]}>
              <Feather name="check-circle" size={14} color={CORRECT} />
              <Text style={[styles.fillCorrectText, { color: CORRECT }]}>{fillInput}</Text>
            </View>
          ) : fillFeedback === 'revealed' ? (
            <View style={[styles.fillResultRow, { backgroundColor: CORRECT + '1F', borderColor: CORRECT + '55' }]}>
              <Feather name="info" size={14} color={CORRECT} />
              <Text style={[styles.fillCorrectText, { color: CORRECT }]}>Answer: {q.correct as string}</Text>
            </View>
          ) : (
            <>
              <TransliterationInput
                style={[styles.fillInput, { borderColor: fillFeedback !== 'idle' ? accent + '70' : accent + '50', color: colors.textMain, backgroundColor: isDark ? colors.bgDark : '#F8FAFA' }]}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.textDim}
                colors={colors}
                value={fillInput}
                onChangeText={setFillInput}
                // Language-Acquisition answers: if the question is in a native
                // script (e.g. Devanagari), let the student type it via English.
                langCode={resolveTypingLang(subject, q.question as string, topic)}
              />
              {fillFeedback === 'wrong1' && (
                <View style={styles.nudgeRow}>
                  <Feather name="alert-circle" size={12} color={accent} />
                  <Text style={[styles.nudgeText, { color: accent }]}>Not quite — give it another try!</Text>
                </View>
              )}
              {fillFeedback === 'wrong2' && (
                <View style={[styles.hintBanner, { backgroundColor: accent + '10', borderColor: accent + '40' }]}>
                  <Feather name="zap" size={12} color="#fff" />
                  <Text style={[styles.hintBannerText, { flex: 1 }]}>Hint: {q.hint || 'Think carefully!'}</Text>
                </View>
              )}
              <TouchableOpacity
                testID={`fill-check-${index}`}
                style={[styles.checkBtn, { backgroundColor: fillValidating || !fillInput.trim() ? accent + '45' : accent }]}
                onPress={onFillSubmit}
                activeOpacity={0.85}
                disabled={fillValidating || !fillInput.trim()}
              >
                {fillValidating
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Feather name="check" size={14} color="#fff" /><Text style={styles.checkBtnText}>Check Answer</Text></>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ── Explanation, once answered ── */}
      {(explanation || loadingExplain) ? (
        <View testID={`explanation-${index}`} style={[styles.explanationRow, { borderTopWidth: 1, borderTopColor: colors.borderColor, paddingTop: 12, marginTop: 4 }]}>
          {loadingExplain
            ? <ActivityIndicator color={accent} size="small" />
            : <>
                <Feather name={wellDone ? 'check-circle' : 'info'} size={13} color={wellDone ? CORRECT : accent} />
                <Text style={[styles.explanationText, { color: isDark ? colors.textMuted : '#666' }]}>
                  <Text style={{ fontWeight: '700', color: wellDone ? CORRECT : accent }}>{wellDone ? 'Well done! ' : 'Aivorah: '}</Text>
                  {explanation}
                </Text>
              </>
          }
        </View>
      ) : null}
    </View>
  );
}
