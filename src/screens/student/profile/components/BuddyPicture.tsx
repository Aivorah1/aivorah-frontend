import React from 'react';
import { View, Text, Image } from 'react-native';
import { BUDDY_EMOTIONS, buddyPicture, optionEmoji } from '../buddyPictureOptions';

interface BuddyPictureProps {
  characterId: string;
  outfit: string;
  emotion: string;
  size: number;
  /** 'circle' for avatars, 'rounded' for the big preview and outfit tiles. */
  shape?: 'circle' | 'rounded';
  /** Show the mood as an emoji badge (always shown when the mood has no picture of its own). */
  showMood?: boolean;
  borderColor?: string;
  accessibilityLabel?: string;
  testID?: string;
}

// One Learning Buddy picture: the character in the chosen outfit and mood.
export function BuddyPicture({
  characterId, outfit, emotion, size, shape = 'rounded', showMood = false, borderColor, accessibilityLabel, testID,
}: BuddyPictureProps) {
  const { source, exact } = buddyPicture(characterId, outfit, emotion);
  const radius = shape === 'circle' ? size / 2 : Math.round(size * 0.16);
  const badge = Math.max(18, Math.round(size * 0.3));
  const moodBadge = showMood || !exact;
  return (
    <View
      testID={testID}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size }}
    >
      <Image
        source={source}
        style={{
          width: size, height: size, borderRadius: radius,
          borderWidth: borderColor ? 2 : 0, borderColor,
        }}
        resizeMode="cover"
      />
      {moodBadge && (
        <View
          testID={testID ? `${testID}-mood` : undefined}
          style={{
            position: 'absolute', right: shape === 'circle' ? -2 : 6, bottom: shape === 'circle' ? -2 : 6,
            width: badge, height: badge, borderRadius: badge / 2,
            backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2,
          }}
        >
          <Text style={{ fontSize: Math.round(badge * 0.62) }}>{optionEmoji(BUDDY_EMOTIONS, emotion)}</Text>
        </View>
      )}
    </View>
  );
}
