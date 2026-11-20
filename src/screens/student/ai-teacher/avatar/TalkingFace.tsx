/**
 * The AI Teacher's Learning Buddy, talking.
 *
 * On the web, for every picture whose face is mapped (buddyFaces.generated.ts),
 * the buddy is drawn on a canvas: the jaw and lips move with each sound as it
 * is spoken and the eyes blink every few seconds. Pictures without a face map
 * (and the phone apps, which have no voice yet) show the picture itself with
 * a small bounce on each word.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet } from 'react-native';
import CanvasFace from './CanvasFace';
import { facePointsFor } from './faceGeometry';
import type { LipSync } from './lipSync';

export default function TalkingFace({ source, name, lips }: { source: any; name: string; lips: LipSync }) {
  const points = useMemo(() => facePointsFor(source), [source]);
  const [failed, setFailed] = useState<any>(null);
  const onFail = useCallback(() => setFailed(source), [source]);
  const label = `${name}, your AI Teacher`;
  if (Platform.OS === 'web' && points && failed !== source) {
    return <CanvasFace source={source} points={points} lips={lips} label={label} onFail={onFail} />;
  }
  return <PictureFace source={source} label={label} lips={lips} />;
}

/** The plain picture, nudged up a little on each sound while it speaks. */
function PictureFace({ source, label, lips }: { source: any; label: string; lips: LipSync }) {
  const [talk] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (typeof requestAnimationFrame === 'undefined') return undefined;
    let raf = 0;
    let alive = true;
    let shown = 0;
    const tick = (now: number) => {
      if (!alive) return;
      const v = lips.openness(now);
      if (v !== shown) { shown = v; talk.setValue(v); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [lips, talk]);
  const translateY = talk.interpolate({ inputRange: [0, 1], outputRange: [0, -3], easing: Easing.out(Easing.quad) });
  const scale = talk.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] });
  return (
    <Animated.Image
      source={source}
      accessibilityLabel={label}
      resizeMode="contain"
      style={[styles.fill, { transform: [{ translateY }, { scale }] }]}
      testID="ai-teacher-buddy"
    />
  );
}

const styles = StyleSheet.create({ fill: { width: '100%', height: '100%' } });
