import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleProp, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

/**
 * Aivorah loader — replaces the platform's indeterminate circular spinner.
 *
 * Drop-in for react-native's ActivityIndicator (same props):
 *  - size "small" (default) / small numbers → three pulsing dots (inline, buttons)
 *  - size "large" / numbers ≥ 30            → Aivorah book mark + dots (page/section)
 * Dots fit in a fixed box so buttons keep their width. Respects reduced motion
 * (static dots) and exposes an accessible "Loading" status.
 */
type Props = {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  animating?: boolean;
  hidesWhenStopped?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

const IS_TEST = typeof process !== 'undefined' && !!process.env?.JEST_WORKER_ID;

const webReduceQuery = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => !!webReduceQuery()?.matches);
  useEffect(() => {
    let alive = true;
    const mq = webReduceQuery();
    if (mq) {
      const on = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener?.('change', on);
      return () => { mq.removeEventListener?.('change', on); };
    }
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { if (alive) setReduced(!!v); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return reduced;
}

export function LoadingDots({ color, dot = 7, style }: { color?: string; dot?: number; style?: StyleProp<ViewStyle> }) {
  const { isDark } = useTheme();
  const reduced = useReducedMotion();
  const [anims] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  // Brand trio (ocean / mint / apricot) unless a single colour is given (e.g. a button label colour).
  const trio = color
    ? [color, color, color]
    : isDark ? ['#9ADBE9', '#93DDB5', '#F6C29A'] : ['#075D75', '#3E9E72', '#D9784A'];

  useEffect(() => {
    if (reduced || IS_TEST) return;
    const loops = anims.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 160),
      Animated.timing(v, { toValue: 1, duration: 380, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(v, { toValue: 0, duration: 380, useNativeDriver: Platform.OS !== 'web' }),
      Animated.delay((2 - i) * 160),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduced, anims]);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: dot * 0.6, height: Math.max(20, dot * 2.4), minWidth: dot * 4.6 }, style]}>
      {anims.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: dot, height: dot, borderRadius: dot / 2, backgroundColor: trio[i],
            opacity: reduced || IS_TEST ? (color ? 0.55 + i * 0.2 : 1) : v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
            transform: reduced || IS_TEST ? undefined : [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.15] }) }],
          }}
        />
      ))}
    </View>
  );
}

export default function AivorahLoader({
  size = 'small', color, style, animating = true, hidesWhenStopped = true, testID, accessibilityLabel = 'Loading',
}: Props) {
  const { colors } = useTheme();
  if (!animating && hidesWhenStopped) return null;
  const large = size === 'large' || (typeof size === 'number' && size >= 30);
  const a11y = {
    testID,
    accessible: true,
    accessibilityRole: 'progressbar' as const,
    accessibilityLabel,
    accessibilityState: { busy: true },
    ...(Platform.OS === 'web' ? { role: 'status', 'aria-live': 'polite', 'aria-busy': true } as any : null),
  };
  if (!large) {
    return <View {...a11y} style={style}><LoadingDots color={color} dot={typeof size === 'number' ? Math.max(5, Math.round(size / 3)) : 7} /></View>;
  }
  return (
    <View {...a11y} style={[{ alignItems: 'center', justifyContent: 'center', gap: 10, padding: 8 }, style]}>
      <Feather name="book-open" size={34} color={colors?.primary || color || '#075D75'} />
      <LoadingDots dot={9} />
    </View>
  );
}
