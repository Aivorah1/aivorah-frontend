import React, { useEffect, useState } from 'react';
import { View, Animated, Easing, Platform, AccessibilityInfo } from 'react-native';
import { studentShapeColors } from '../../../../../theme';

// The homepage's coloured shapes, peeking out behind the dashboard's top cards
// (Website Redesign, Phase 3). They drift into place once; with reduced
// motion they are simply there. Decorative only — hidden from screen readers.
export function WelcomeShapes({ isDark }: { isDark: boolean }) {
  const sh = isDark ? studentShapeColors.dark : studentShapeColors.light;
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let alive = true;
    const run = (reduce: boolean) => {
      if (!alive) return;
      if (reduce) { v.setValue(1); return; }
      Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) run(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    else AccessibilityInfo.isReduceMotionEnabled?.().then(run).catch(() => run(false));
    return () => { alive = false; };
  }, [v]);
  const blob = (bg: string, st: object) => <View style={[{ position: 'absolute', backgroundColor: bg }, st]} />;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID="welcome-shapes"
      style={{
        position: 'absolute', top: 0, right: 0, width: 250, height: 110, opacity: v,
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
        ],
      }}
    >
      {blob(sh.yellow, { right: 150, top: 22, width: 78, height: 60, borderRadius: 40 })}
      {blob(sh.green, { right: 84, top: 4, width: 92, height: 80, borderTopLeftRadius: 46, borderTopRightRadius: 46, borderBottomLeftRadius: 20, borderBottomRightRadius: 60 })}
      {blob(sh.blue, { right: 56, top: 44, width: 46, height: 32, borderRadius: 22 })}
      {blob(sh.orange, { right: 0, top: 0, width: 80, height: 92, borderTopLeftRadius: 46, borderBottomLeftRadius: 46, borderTopRightRadius: 20, borderBottomRightRadius: 20 })}
    </Animated.View>
  );
}
