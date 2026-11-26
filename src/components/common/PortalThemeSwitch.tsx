/**
 * One sun / moon switch for the signed-in portal header (Website Redesign,
 * Phase 3). It flips between Light and Dark through the existing ThemeContext,
 * so screens keep their state; the Auto option stays in Settings.
 */
import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';

export default function PortalThemeSwitch({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const { isDark, setThemeMode, colors } = useTheme();
  const w = size === 'lg' ? 96 : 80, h = size === 'lg' ? 48 : 40;
  const knob = (w - 8) / 2;
  const web = Platform.OS === 'web';
  return (
    <Pressable
      onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: isDark }}
      testID="portal-theme-switch"
      style={{
        width: w, height: h, borderRadius: 999, borderWidth: 1.5, borderColor: colors.textHeading,
        backgroundColor: colors.cardDark, flexDirection: 'row', alignItems: 'center', padding: 2.5,
      }}
    >
      <View style={{
        position: 'absolute', top: 2.5, bottom: 2.5, left: 2.5, width: knob, borderRadius: 999,
        backgroundColor: isDark ? colors.primary : '#F58B3A',
        transform: [{ translateX: isDark ? knob : 0 }],
        ...(web ? { transitionProperty: 'transform, background-color', transitionDuration: '200ms', transitionTimingFunction: 'ease' } as any : null),
      }} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Icon name="sun" size={size === 'lg' ? 20 : 17} color={isDark ? colors.textHeading : '#FFFFFF'} />
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Icon name="moon" size={size === 'lg' ? 20 : 17} color={isDark ? colors.onPrimary : colors.textHeading} />
      </View>
    </Pressable>
  );
}
