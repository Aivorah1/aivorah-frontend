import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../../theme';
import ActivityIndicator from './AivorahLoader';

export default function TealActionButton({
  label, icon, onPress, disabled, loading, testID, style,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  const inactive = !!(disabled || loading);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={(state) => [
        styles.button, style, (state as typeof state & { hovered?: boolean }).hovered && !inactive && styles.hovered,
        state.pressed && styles.pressed, focused && styles.focused, inactive && styles.inactive,
      ]}
    >
      <LinearGradient pointerEvents="none" colors={inactive ? ['#596F6D', '#4A6160'] : ['#287A73', '#195A58']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient} />
      {loading ? <ActivityIndicator size="small" color="#fff" /> : icon && <Feather name={icon} size={16} color="#fff" />}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderWidth: 1, borderColor: '#195A58', backgroundColor: '#195A58',
    shadowColor: '#143C39', shadowOpacity: 0.18, shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  gradient: { ...StyleSheet.absoluteFillObject, borderRadius: 15 },
  hovered: { borderColor: '#8BD3C6', shadowOpacity: 0.35, elevation: 4 },
  pressed: { opacity: 0.88 },
  focused: { borderColor: '#B4F1E4', borderWidth: 2 },
  inactive: { borderColor: '#596F6D', elevation: 0, shadowOpacity: 0 },
  label: {
    color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center', flexShrink: 1,
    ...(Platform.OS === 'web' ? { fontFamily: fonts.sans } : {}),
  },
});
