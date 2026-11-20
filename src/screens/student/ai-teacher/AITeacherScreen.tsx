/**
 * Student Portal → AI Teacher. The student's Learning Buddy teaches by voice:
 * one Start / Stop button, spoken questions and answers (no typing), and a
 * teaching board that reveals explanations, worked steps, equations and
 * curriculum pictures in step with what is being said.
 *
 * Page entry: avatar + an India-time greeting in the caption; microphone off,
 * silent. Start: microphone permission, the greeting spoken on the first
 * Start of the visit, then listening. Stop / leaving the screen: microphone
 * off and speech cancelled at once (see voice/VoiceSession.ts).
 * Backend: aivorah-learning-paths-service /ai-teacher (routes/aiTeacher.js).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../../components/common/Header';
import ScreenLayout from '../../../components/common/ScreenLayout';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useResponsive } from '../../../hooks/useResponsive';
import AvatarPanel from './components/AvatarPanel';
import TeachingBoard, { type PracticeView } from './components/TeachingBoard';
import { aiTeacherApi, type BoardBlock, type TeacherTopic, type TurnResponse } from './services/aiTeacherApi';
import { teacherAvatar } from './utils/buddyAvatar';
import { greetingLine } from './utils/greeting';
import { VoiceSession, type VoiceDrivers, type VoiceStatus } from './voice/VoiceSession';
import { browserDrivers } from './voice/browserDrivers';

const LISTEN_HINT = 'Say your answer when you’re ready.';

export default function AITeacherScreen({ navigation, drivers = browserDrivers }: { navigation: any; drivers?: VoiceDrivers }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const avatar = useMemo(() => teacherAvatar((user as any)?.learningBuddy), [user]);
  const [firstName, setFirstName] = useState(String((user as any)?.name || '').split(' ')[0] || '');
  const greeting = greetingLine(firstName, avatar.name);

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [active, setActive] = useState(false);
  const [caption, setCaption] = useState(greeting);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState<TeacherTopic | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [blocks, setBlocks] = useState<BoardBlock[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [practice, setPractice] = useState<PracticeView | null>(null);
  const turnState = useRef<Record<string, any>>({});
  const languageRef = useRef<'en' | 'hi'>('en');
  const greetingRef = useRef(greeting);
  useEffect(() => { greetingRef.current = greeting; }, [greeting]);
  const talkRef = useRef<(() => void) | null>(null);
  const started = useRef(false);

  // The student's first name (the account's own name, from the server).
  useEffect(() => {
    let alive = true;
    aiTeacherApi.me().then((m) => { if (alive && m.firstName) setFirstName(m.firstName); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  // Until the first Start, the caption shows the greeting.
  useEffect(() => { if (!started.current) setCaption(greeting); }, [greeting]);

  // One session per screen visit, created on the first Start (an event, not render).
  const sessionRef = useRef<VoiceSession | null>(null);
  const getSession = useCallback(() => {
    if (sessionRef.current) return sessionRef.current;
    sessionRef.current = new VoiceSession(drivers, {
      turn: async (text, signal) => {
        const r = await aiTeacherApi.turn(text, turnState.current, signal);
        return r;
      },
      greeting: () => greetingRef.current,
      language: () => languageRef.current,
      onStatus: (s) => { setStatus(s); setActive(s !== 'idle'); },
      onCaption: (c) => setCaption(c),
      onResponse: (r: TurnResponse) => {
        if (r.state) turnState.current = r.state;
        if (r.language) { languageRef.current = r.language; setLanguage(r.language); }
        if (r.topic) setTopic(r.topic);
        if (r.board === 'replace') {
          setBlocks(r.blocks);
          setRevealed(new Set());
          setPractice(null);
        }
        if (r.kind === 'practice' && r.practice) {
          setPractice({ practice: r.practice, timerEndsAt: null, feedback: null, feedbackBlocks: [] });
        }
        if ((r.kind === 'feedback' || r.kind === 'solution') && r.feedback) {
          setPractice((p) => (p ? { ...p, timerEndsAt: null, feedback: r.feedback, feedbackBlocks: r.blocks } : p));
        }
        return r.kind === 'practice' || (r.kind === 'unclear' && r.practice) ? LISTEN_HINT : '';
      },
      onSegmentStart: (seg) => {
        if (seg.reveal.length) setRevealed((prev) => new Set([...prev, ...seg.reveal]));
      },
      onBoundary: () => talkRef.current?.(),
      onNarrationDone: (r) => {
        // The countdown starts once the question has been read out and the microphone is listening.
        if (r?.kind === 'practice' && r.practice?.durationSeconds) {
          const ms = r.practice.durationSeconds * 1000;
          setPractice((p) => (p && p.practice.id === r.practice!.id ? { ...p, timerEndsAt: Date.now() + ms } : p));
        }
      },
      onError: (m) => setError(m),
    });
    return sessionRef.current;
  }, [drivers]);

  const toggle = useCallback(() => {
    setError('');
    const session = getSession();
    if (session.isActive) {
      session.stop();
      setPractice((p) => (p ? { ...p, timerEndsAt: null } : p));
      return;
    }
    started.current = true;
    session.start();
  }, [getSession]);

  // Leaving the screen (or unmounting) ends the session: microphone off, silence.
  useFocusEffect(useCallback(() => () => sessionRef.current?.stop(), []));
  useEffect(() => () => sessionRef.current?.stop(), []);

  const crumb = topic ? `${topic.subject} / ${topic.title}` : 'Ask by voice about any topic from your lessons';

  return (
    <ScreenLayout>
      <View style={[styles.screen, { backgroundColor: colors.bgDark }]}>
        <Header title="AI Teacher" subtitle={crumb} onMenuPress={() => navigation?.openDrawer?.()} />
        <View style={[styles.langRow]}>
          <View style={[styles.lang, { borderColor: colors.borderColor, backgroundColor: colors.cardDark }]} testID="ai-teacher-language">
            <Feather name="globe" size={14} color={colors.textMain} />
            <Text style={[styles.langText, { color: colors.textMain }]}>{language === 'hi' ? 'हिन्दी' : 'English'}</Text>
          </View>
        </View>
        {!!error && (
          <View style={[styles.error, { borderColor: '#C98A8A80', backgroundColor: '#C98A8A18' }]} testID="ai-teacher-error" accessibilityLiveRegion="polite">
            <Feather name="alert-circle" size={16} color={colors.textMain} />
            <Text style={[styles.errorText, { color: colors.textMain }]}>{error}</Text>
          </View>
        )}
        {isMobile ? (
          // Narrow screens: the avatar and the voice button stay on screen; the board scrolls under them.
          <View style={styles.mobile}>
            <AvatarPanel source={avatar.source} name={avatar.name} status={status} caption={caption} active={active} onToggle={toggle} colors={colors} compact talkRef={talkRef} />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} testID="ai-teacher-board-scroll">
              <TeachingBoard topic={topic} blocks={blocks} revealed={revealed} practice={practice} colors={colors} />
            </ScrollView>
          </View>
        ) : (
          <View style={styles.desktop}>
            {/* The avatar, caption and voice button stay put while the board scrolls. */}
            <View style={styles.left}>
              <AvatarPanel source={avatar.source} name={avatar.name} status={status} caption={caption} active={active} onToggle={toggle} colors={colors} talkRef={talkRef} />
            </View>
            <ScrollView style={styles.right} contentContainerStyle={{ paddingBottom: 24 }} testID="ai-teacher-board-scroll">
              <TeachingBoard topic={topic} blocks={blocks} revealed={revealed} practice={practice} colors={colors} />
            </ScrollView>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, marginTop: -8 },
  lang: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  langText: { fontSize: 14, fontWeight: '700' },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginHorizontal: 24, marginTop: 10 },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  desktop: { flex: 1, flexDirection: 'row', gap: 20, padding: 24, minHeight: 0 },
  left: { width: '44%', maxWidth: 620 },
  right: { flex: 1 },
  mobile: { flex: 1, padding: 16, gap: 12, minHeight: 0 },
});
