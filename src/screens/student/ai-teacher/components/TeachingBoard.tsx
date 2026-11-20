/**
 * AI Teacher board: the topic, its source, and the blocks the teacher reveals
 * as it speaks (explanations, worked steps, equations, curriculum images),
 * then the practice card: the prompt, "Say your answer aloud.", the timer and
 * the spoken feedback. Maths uses the lesson screen's plainMath (2^2 → 2²).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import { plainMath } from '../../learning-paths/lesson-screen/utils/plainMath';
import type { BoardBlock, Practice, TeacherTopic } from '../services/aiTeacherApi';

export interface PracticeView {
  practice: Practice;
  timerEndsAt: number | null;
  feedback: { correct: boolean | null; message: string; expected?: string; revealed?: boolean } | null;
  feedbackBlocks: BoardBlock[];
}

function BlockView({ b, colors }: { b: BoardBlock; colors: AppColors }) {
  const text = colors.textMain;
  switch (b.type) {
    case 'heading': return <Text style={[styles.heading, { color: text }]}>{plainMath(b.text)}</Text>;
    case 'text': return <Text style={[styles.text, { color: text }]}>{plainMath(b.text)}</Text>;
    case 'label': return <View style={[styles.label, { backgroundColor: colors.accentYellow + '22' }]}><Text style={[styles.labelText, { color: text }]}>{b.text}</Text></View>;
    case 'note': return <View style={[styles.note, { borderColor: colors.borderColor }]}><Feather name="info" size={14} color={colors.textMuted} /><Text style={[styles.noteText, { color: colors.textMuted }]}>{b.text}</Text></View>;
    case 'steps': return <View style={{ gap: 4 }}>{b.items.map((it, i) => <Text key={i} style={[styles.text, { color: text }]}>{i + 1}. {plainMath(it)}</Text>)}</View>;
    case 'equation': return (
      <View style={{ gap: 8 }} testID="board-equation">
        {b.lines.map((l, i) => {
          const last = b.highlightLast && i === b.lines.length - 1;
          return <Text key={i} style={[styles.eq, { color: text }, last && { backgroundColor: colors.accentYellow + '30', alignSelf: 'flex-start', paddingHorizontal: 10, borderRadius: 8, fontWeight: '800' }]}>{plainMath(l)}</Text>;
        })}
      </View>
    );
    case 'image': return <ImageBlock url={b.url} caption={b.caption} colors={colors} />;
    case 'feedback': return <Text style={[styles.text, { color: text, fontWeight: '800' }]}>{b.text}</Text>;
    default: return null;
  }
}

function ImageBlock({ url, caption, colors }: { url: string; caption?: string; colors: AppColors }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Text style={[styles.noteText, { color: colors.textMuted }]}>This picture couldn&apos;t be loaded.</Text>;
  return (
    <View style={{ gap: 4 }}>
      <Image source={{ uri: url }} style={styles.image} resizeMode="contain" onError={() => setFailed(true)} accessibilityLabel={caption || 'Curriculum picture'} />
      {!!caption && <Text style={[styles.noteText, { color: colors.textMuted }]}>{caption}</Text>}
    </View>
  );
}

function Timer({ endsAt, colors }: { endsAt: number; colors: AppColors }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <View style={[styles.timer, { borderColor: colors.accentYellow }]} testID="practice-timer" accessibilityLabel={left ? `${left} seconds left` : "Time's up"}>
      <Feather name="clock" size={15} color={colors.textMain} />
      <Text style={[styles.timerText, { color: colors.textMain }]}>{left ? `${mm}:${ss}` : "Time's up"}</Text>
    </View>
  );
}

export default function TeachingBoard({ topic, blocks, revealed, practice, colors }: {
  topic: TeacherTopic | null;
  blocks: BoardBlock[];
  revealed: Set<string>;
  practice: PracticeView | null;
  colors: AppColors;
}) {
  const shown = blocks.filter((b) => revealed.has(b.id));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!practice?.timerEndsAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [practice?.timerEndsAt]);
  const timeUp = !!practice?.timerEndsAt && now >= practice.timerEndsAt && !practice.feedback;

  return (
    <View style={[styles.board, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]} testID="ai-teacher-board">
      {topic ? (
        <>
          <Text style={[styles.title, { color: colors.textMain }]} testID="board-title">{topic.title}</Text>
          {topic.grounded && topic.source ? <Text style={[styles.source, { color: colors.textMuted }]}>From your book: {topic.source}</Text>
            : <Text style={[styles.source, { color: colors.textMuted }]}>General explanation (not from your textbook)</Text>}
        </>
      ) : (
        <View style={styles.empty}>
          <Feather name="mic" size={22} color={colors.textMuted} />
          <Text style={[styles.text, { color: colors.textMuted, textAlign: 'center' }]}>Press Start and ask a question out loud, like &quot;Explain LCM&quot; or &quot;Give me a problem to solve&quot;.</Text>
        </View>
      )}
      {shown.map((b) => <View key={b.id} testID={`board-block-${b.type}`}><BlockView b={b} colors={colors} /></View>)}

      {!!practice && (
        <View style={[styles.practice, { backgroundColor: colors.accentYellow + '18', borderColor: colors.accentYellow + '55' }]} testID="practice-card">
          <View style={styles.practiceHead}>
            <View style={styles.row}>
              <Feather name="target" size={18} color={colors.accentYellow} />
              <Text style={[styles.practiceTitle, { color: colors.textMain }]}>Your turn</Text>
            </View>
            {!!practice.timerEndsAt && !practice.feedback && <Timer endsAt={practice.timerEndsAt} colors={colors} />}
          </View>
          <Text style={[styles.prompt, { color: colors.textMain }]} testID="practice-prompt">{plainMath(practice.practice.prompt)}</Text>
          {!practice.feedback && <Text style={[styles.say, { color: colors.textMuted }]}>Say your answer aloud.</Text>}
          {timeUp && <Text style={[styles.say, { color: colors.textMain }]} testID="practice-time-up">Time&apos;s up — you can still say your answer, or say &quot;try again&quot;.</Text>}
          {!!practice.feedback && (
            <View style={{ gap: 8 }} testID="practice-feedback">
              <View style={styles.row}>
                <Feather name={practice.feedback.correct ? 'check-circle' : 'info'} size={18} color={practice.feedback.correct ? colors.accentGreen : colors.accentYellow} />
                <Text style={[styles.text, { color: colors.textMain, flex: 1, fontWeight: '700' }]}>{practice.feedback.message}</Text>
              </View>
              {practice.feedbackBlocks.filter((b) => b.type !== 'feedback' && revealed.has(b.id)).map((b) => <BlockView key={b.id} b={b} colors={colors} />)}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderWidth: 1, borderRadius: 20, padding: 22, gap: 14 },
  title: { fontSize: 30, fontWeight: '800' },
  source: { fontSize: 13, marginTop: -6 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 30 },
  heading: { fontSize: 20, fontWeight: '800' },
  text: { fontSize: 17, lineHeight: 25 },
  label: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  labelText: { fontSize: 14, fontWeight: '800' },
  note: { flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 14, lineHeight: 20 },
  eq: { fontSize: 26, lineHeight: 36, fontWeight: '600' },
  image: { width: '100%', height: 220, borderRadius: 10 },
  practice: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 10 },
  practiceHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  practiceTitle: { fontSize: 20, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prompt: { fontSize: 20, lineHeight: 28 },
  say: { fontSize: 17, fontStyle: 'italic' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  timerText: { fontSize: 15, fontWeight: '800' },
});
