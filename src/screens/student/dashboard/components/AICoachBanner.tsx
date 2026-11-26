import React from 'react';
import { Animated, TouchableOpacity, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { makeStyles } from '../DashboardScreen';
import { useTheme } from '../../../../context/ThemeContext';

interface AICoachBannerProps {
  styles: ReturnType<typeof makeStyles>;
  pulseAnim: Animated.Value;
  navigation: { navigate: (screen: string) => void };
}

// Pulsing banner that routes to AI Coach — pure presentation, animation
// value (pulseAnim) is owned and looped by the parent screen.
export function AICoachBanner({ styles, pulseAnim, navigation }: AICoachBannerProps) {
  const { colors } = useTheme();
  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity onPress={() => navigation.navigate('AICoach')} activeOpacity={0.88}>
        <LinearGradient
          colors={[colors.cardDark, colors.cardDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.aiBanner}
        >
          <View style={styles.aiGlow} />
          {/* AI avatar */}
          <View style={styles.aiAvatarWrap}>
            <View style={styles.aiAvatarOuter}>
              <View style={styles.aiAvatarInner}>
                <Feather name="cpu" size={22} color={colors.textHeading} />
              </View>
            </View>
            <View style={styles.aiOnline} />
          </View>
          <View style={styles.aiBannerBody}>
            <Text style={styles.aiTag}>AIVORAH AI COACH</Text>
            <Text style={styles.aiTitle}>Ask me anything</Text>
            <Text style={styles.aiSub}>Maths, Science, any topic — patient & always here.</Text>
          </View>
          <View style={styles.aiBannerCta}>
            <Feather name="message-circle" size={20} color={colors.primary} />
            <Text style={styles.aiBannerCtaTxt}>Chat now</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
