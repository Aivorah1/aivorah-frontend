import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../context/ThemeContext';
import { fonts } from '../../../../theme';
import TealActionButton from '../../../../components/common/TealActionButton';

export default function AddYourChild({
  onAdd, secondaryAction, testID = 'parent-no-children',
}: {
  onAdd: () => void;
  secondaryAction?: React.ReactNode;
  testID?: string;
}) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const illustrationHeight = width < 600 ? Math.min(245, Math.max(146, (width - 80) * 2 / 3)) : width < 900 ? 240 : 330;
  const [entrance] = useState(() => new Animated.Value(1));

  useEffect(() => {
    function animate(reduceMotion: boolean) {
      if (reduceMotion || cancelled) return;
      entrance.setValue(0);
      animation = Animated.timing(entrance, { toValue: 1, duration: 280, useNativeDriver: Platform.OS !== 'web' });
      animation.start();
    }
    let cancelled = false;
    let animation: Animated.CompositeAnimation | undefined;
    if (Platform.OS === 'web') {
      animate(typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } else {
      AccessibilityInfo.isReduceMotionEnabled().then(animate).catch(() => {});
    }
    return () => { cancelled = true; animation?.stop(); };
  }, [entrance]);

  return (
    <Animated.View testID={testID} style={[
      styles.hero, { borderColor: colors.borderColor, backgroundColor: colors.cardDark,
        opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
    ]}>
      <LinearGradient pointerEvents="none" colors={isDark ? ['#253533', '#202123', '#3A2B29'] : ['#DCEEE4', '#FFFCF7', '#F8E6D8']}
        start={{ x: 0, y: 0.8 }} end={{ x: 1, y: 0.2 }} style={StyleSheet.absoluteFill} />
      <View style={styles.imageWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={require('../../../../../assets/parent-family-reading.webp')} resizeMode="contain" style={[styles.image, { height: illustrationHeight }]} />
      </View>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, { color: isDark ? '#A4E3D5' : '#175F5C' }]}>Add Your Child</Text>
        <Text style={[styles.description, { color: colors.textMain }]}>
          Add a child to follow their learning progress, assignments and achievements.
        </Text>
        <TealActionButton label="Add Child" icon="plus" testID={`${testID}-add`} onPress={onAdd} style={styles.action} />
        {secondaryAction}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%', maxWidth: 1120, alignSelf: 'center', overflow: 'hidden',
    borderWidth: 1, borderRadius: 24, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center',
    gap: 22, padding: 22,
  },
  imageWrap: { flexGrow: 1, flexShrink: 1, flexBasis: 285, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', maxWidth: 510 },
  copy: { flexGrow: 1, flexShrink: 1, flexBasis: 280, gap: 13, paddingVertical: 6 },
  title: { fontSize: 34, fontWeight: '700', ...(Platform.OS === 'web' ? { fontFamily: fonts.serif } : {}) },
  description: { fontSize: 16, lineHeight: 25, maxWidth: 390, ...(Platform.OS === 'web' ? { fontFamily: fonts.sans } : {}) },
  action: { alignSelf: 'flex-start', minWidth: 165, borderRadius: 14 },
});
