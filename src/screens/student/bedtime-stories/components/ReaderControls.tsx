import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import { VOICE_CONFIG } from '../constants';
import type { VoiceOption } from '../types';

interface Props {
  playing: boolean;
  isPaused: boolean;
  isLoading: boolean;
  voice: VoiceOption;
  autoPlay: boolean;
  playbackRate: number;
  pastelAccent: string;
  textDim: string;
  borderColor: string;
  onListenPress: () => void;
  onVoiceChange: (v: VoiceOption) => void;
  onAutoToggle: () => void;
  onRateChange: (rate: number) => void;
  /** Why the narration couldn't play, if it couldn't; shows a Try again button. */
  audioError?: string | null;
  onRetry?: () => void;
  styles: any;
}

export default function ReaderControls({
  playing, isPaused, isLoading, voice, autoPlay, playbackRate, pastelAccent, textDim, borderColor,
  onListenPress, onVoiceChange, onAutoToggle, onRateChange, audioError, onRetry, styles,
}: Props) {
  return (
    <View style={styles.controlsCol}>
      <View style={styles.listenRow}>
        <TouchableOpacity
          style={[styles.listenBtn, { backgroundColor: pastelAccent, opacity: isPaused ? 0.85 : 1 }]}
          onPress={onListenPress}
          activeOpacity={0.85}
        >
          {isLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Feather name={playing ? 'pause' : isPaused ? 'play' : 'headphones'} size={15} color="#fff" />
          }
          <Text style={styles.listenBtnText}>{isLoading ? 'Loading…' : playing ? 'Pause' : isPaused ? 'Resume' : 'Listen'}</Text>
        </TouchableOpacity>

        {(Object.keys(VOICE_CONFIG) as VoiceOption[]).map(v => {
          const cfg = VOICE_CONFIG[v]; const active = voice === v;
          // All chips share the story's pastel accent — active = filled, inactive = dim.
          return (
            <TouchableOpacity key={v}
              style={[styles.voiceChip, active ? { backgroundColor: pastelAccent + '20', borderColor: pastelAccent } : { backgroundColor: 'transparent', borderColor }]}
              onPress={() => onVoiceChange(v)} activeOpacity={0.8}
            >
              <Feather name={cfg.icon as any} size={12} color={active ? pastelAccent : textDim} />
              <Text style={[styles.voiceChipText, { color: active ? pastelAccent : textDim }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.voiceChip, autoPlay ? { backgroundColor: pastelAccent + '20', borderColor: pastelAccent } : { backgroundColor: 'transparent', borderColor }]}
          onPress={onAutoToggle} activeOpacity={0.8}
        >
          <Feather name={autoPlay ? 'pause-circle' : 'play-circle'} size={12} color={autoPlay ? pastelAccent : textDim} />
          <Text style={[styles.voiceChipText, { color: autoPlay ? pastelAccent : textDim }]}>Auto</Text>
        </TouchableOpacity>
      </View>

      {audioError ? (
        <View
          testID="narration-error"
          accessibilityRole="alert"
          style={[styles.audioErrorBox, { borderColor: pastelAccent }]}
        >
          <Feather name="volume-x" size={14} color={pastelAccent} />
          <Text style={[styles.audioErrorText, { color: textDim }]}>{audioError}</Text>
          {onRetry ? (
            <TouchableOpacity
              testID="narration-retry"
              accessibilityRole="button"
              accessibilityLabel="Try playing the story voice again"
              style={[styles.audioRetryBtn, { backgroundColor: pastelAccent }]}
              onPress={onRetry}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={12} color="#fff" />
              <Text style={styles.audioRetryText}>Try again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Playback speed — its own labeled row */}
      <View style={styles.speedRow}>
        <Text style={[styles.speedLabel, { color: textDim }]}>Speed</Text>
        {([0.5, 1, 1.5, 2] as const).map(rate => (
          <TouchableOpacity
            key={rate}
            style={[styles.speedChip, playbackRate === rate
              ? { backgroundColor: pastelAccent + '25', borderColor: pastelAccent }
              : { backgroundColor: 'transparent', borderColor }
            ]}
            onPress={() => onRateChange(rate)}
            activeOpacity={0.8}
          >
            <Text style={[styles.voiceChipText, { color: playbackRate === rate ? pastelAccent : textDim }]}>
              {rate}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
