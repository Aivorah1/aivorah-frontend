/**
 * AI Teacher avatar: the student's Learning Buddy on a mint panel, the live
 * status (Listening / Thinking / Speaking), the caption of what is being said,
 * and the ONE voice button (Start / Stop).
 *
 * Motion: the buddy talks (lips and jaw move with the speech, eyes blink;
 * see avatar/TalkingFace.tsx), breathes gently, and tilts a little while
 * thinking.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import type { VoiceStatus } from '../voice/VoiceSession';
import TalkingFace from '../avatar/TalkingFace';
import type { LipSync } from '../avatar/lipSync';

const STATUS_LABEL: Record<VoiceStatus, string> = { idle: '', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…' };

export default function AvatarPanel({ source, name, status, caption, active, onToggle, colors, compact = false, lips }: {
  source: any;
  name: string;
  status: VoiceStatus;
  caption: string;
  active: boolean;
  onToggle: () => void;
  colors: AppColors;
  compact?: boolean;
  lips: LipSync;
}) {
  const [breathe] = useState(() => new Animated.Value(0));
  const [tilt] = useState(() => new Animated.Value(0));
  const [bars] = useState(() => new Animated.Value(0));

  // Idle breathing (always on, subtle).
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  // Thinking tilt / listening bars.
  useEffect(() => {
    const anim = status === 'thinking' ? tilt : status === 'listening' ? bars : null;
    if (!anim) { tilt.setValue(0); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: status === 'thinking' ? 700 : 420, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: status === 'thinking' ? 700 : 420, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [status, tilt, bars]);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] });
  const rotate = tilt.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });
  const mint = '#D9F0E4';

  return (
    <View style={[styles.wrap, { backgroundColor: colors.cardDark, borderColor: colors.borderColor }]} testID="ai-teacher-avatar">
      <View style={[styles.stage, { backgroundColor: mint, height: compact ? 260 : 400 }]}>
        {!!STATUS_LABEL[status] && (
          <View style={styles.chip} testID="ai-teacher-status" accessibilityLiveRegion="polite">
            <Feather name={status === 'listening' ? 'mic' : status === 'speaking' ? 'volume-2' : 'loader'} size={14} color="#2E7D4F" />
            <Text style={styles.chipText}>{STATUS_LABEL[status]}</Text>
            {status === 'listening' && [0.5, 1, 0.7, 1, 0.6].map((h, i) => (
              <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: bars.interpolate({ inputRange: [0, 1], outputRange: [h * 0.5, i % 2 ? h : h * 0.8] }) }] }]} />
            ))}
          </View>
        )}
        <Animated.View style={[styles.avatar, { transform: [{ scale }, { rotate }] }]}>
          <TalkingFace source={source} name={name} lips={lips} />
        </Animated.View>
        {!!caption && (
          <View style={styles.caption} testID="ai-teacher-caption" accessibilityLiveRegion="polite">
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        )}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={onToggle} style={[styles.button, { backgroundColor: colors.accentYellow }]} accessibilityRole="button"
          accessibilityLabel={active ? 'Stop voice' : 'Start voice'} testID="ai-teacher-voice">
          <Feather name={active ? 'mic' : 'mic-off'} size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>{active ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>
        <Text style={[styles.micState, { color: colors.textMuted }]} testID="ai-teacher-mic-state">{active ? 'Microphone on' : 'Microphone off'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 20, padding: 10, gap: 12 },
  stage: { borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  avatar: { width: '88%', height: '92%' },
  chip: { position: 'absolute', top: 12, left: 12, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFFEE', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 14, fontWeight: '800', color: '#1E3A2B' },
  bar: { width: 3, height: 14, borderRadius: 2, backgroundColor: '#2E9E5B' },
  caption: { position: 'absolute', left: 10, right: 10, bottom: 10, backgroundColor: '#1F1F1FE6', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  captionText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  controls: { alignItems: 'center', gap: 6, paddingBottom: 6 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 44 },
  buttonText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  micState: { fontSize: 13, fontStyle: 'italic' },
});

