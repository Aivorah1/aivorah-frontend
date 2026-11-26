import React from 'react';
import { View } from 'react-native';
import { studentShapeColors } from '../../../../../theme';

// One of the homepage's coloured shapes, tucked into a dashboard card's corner
// (Website Redesign, Phase 4). Decorative: hidden from screen readers and taps.
export function CardShape({ tone, corner, isDark, size = 64 }: {
  tone: 'green' | 'yellow' | 'orange' | 'blue';
  corner: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  isDark: boolean;
  size?: number;
}) {
  const color = (isDark ? studentShapeColors.dark : studentShapeColors.light)[tone];
  const off = -size * 0.42;
  const pos = {
    'top-right': { top: off, right: off },
    'bottom-right': { bottom: off, right: off },
    'top-left': { top: off, left: off },
    'bottom-left': { bottom: off, left: off },
  }[corner];
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: isDark ? 0.8 : 0.95, ...pos }}
    />
  );
}
