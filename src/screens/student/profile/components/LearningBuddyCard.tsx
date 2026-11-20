import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { AppColors } from '../../../../theme';
import { SectionHead } from './common/SectionHead';
import type { makeStyles } from '../ProfileScreen';
import { getBuddyById, getCostumeById, type SavedLearningBuddy } from '../learningBuddyConstants';
import {
  BUDDY_EMOTIONS, BUDDY_OUTFITS, DEFAULT_EMOTION, describePictureBuddy, fitOutfit, getPictureCharacter, optionLabel,
} from '../buddyPictureOptions';
import { BuddyPicture } from './BuddyPicture';

interface LearningBuddyCardProps {
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
  isDark: boolean;
  savedBuddy: SavedLearningBuddy | null;
  onOpenCustomize: () => void;
}

// "Learning Buddy" card — shows the currently selected buddy (with image +
// costume overlay) and opens the customization modal on tap.
export function LearningBuddyCard({
  styles, colors, isDark, savedBuddy, onOpenCustomize,
}: LearningBuddyCardProps) {
  const buddy = savedBuddy ? getBuddyById(savedBuddy.buddyId) : null;
  const costume = buddy && savedBuddy ? getCostumeById(buddy, savedBuddy.costumeId) : null;
  const pictureChar = getPictureCharacter(savedBuddy?.buddyId);
  const displayName = savedBuddy?.customName?.trim() || pictureChar?.name || buddy?.name || null;
  const outfit = pictureChar ? fitOutfit(pictureChar.id, savedBuddy?.costumeId) : '';
  const emotion = savedBuddy?.emotion || DEFAULT_EMOTION;

  return (
    <View style={[styles.card, { overflow: 'hidden' }]}>
      <View style={styles.cardHeadRow}>
        <SectionHead
          icon="smile"
          iconBg={isDark ? 'rgba(195,220,216,0.15)' : 'rgba(195,220,216,0.40)'}
          iconColor={colors.accentYellow}
          title="Learning Buddy"
          sub="Who inspires your learning?"
        />
      </View>

      <TouchableOpacity onPress={onOpenCustomize} activeOpacity={0.8} style={{ paddingVertical: 8 }}>
        {pictureChar && displayName ? (
          // Picture buddy: the character in the chosen outfit and mood
          <View
            testID="buddy-card-picture"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderWidth: 1,
              borderColor: colors.borderColor,
            }}
          >
            <BuddyPicture
              characterId={pictureChar.id}
              outfit={outfit}
              emotion={emotion}
              size={72}
              shape="circle"
              showMood
              borderColor={colors.accentYellow + '60'}
              accessibilityLabel={describePictureBuddy(displayName, outfit, emotion)}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textDim }}>
                {pictureChar.kind === 'animal' ? '🐾 Buddy' : '✨ Buddy'}
              </Text>
              <Text
                style={{ fontSize: 18, fontWeight: '800', color: colors.textMain, fontFamily: 'serif' }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {`Feeling ${optionLabel(BUDDY_EMOTIONS, emotion).toLowerCase()} · ${optionLabel(BUDDY_OUTFITS, outfit)} • Tap to change`}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textDim} />
          </View>
        ) : buddy && costume ? (
          // Selected buddy — show full-body image with costume overlay
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderWidth: 1,
              borderColor: colors.borderColor,
            }}
          >
            {/* Avatar with costume gradient overlay */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: colors.accentYellow + '60',
                position: 'relative',
              }}
            >
              <Image
                source={buddy.image}
                style={{ width: 72, height: 72, borderRadius: 36 }}
                resizeMode="cover"
              />
              {/* Costume gradient overlay */}
              <LinearGradient
                colors={[costume.overlay[0] + '66', costume.overlay[1] + '66']}
                style={{ ...StyleSheet.absoluteFillObject, borderRadius: 36 }}
              />
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textDim }}>
                {buddy.category === 'princess' ? '👸 Princess' :
                 buddy.category === 'prince' ? '🤴 Prince' :
                 buddy.category === 'hero' ? '🦸 Hero' : '🐾 Animal'}
              </Text>
              <Text
                style={{ fontSize: 18, fontWeight: '800', color: colors.textMain, fontFamily: 'serif' }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {costume.label} • Tap to change
              </Text>
            </View>

            <Feather name="chevron-right" size={20} color={colors.textDim} />
          </View>
        ) : (
          // No buddy selected — show prompt
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 20,
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(186,164,103,0.06)' : 'rgba(186,164,103,0.05)',
              borderWidth: 1.5,
              borderColor: colors.accentYellow + '40',
              borderStyle: 'dashed',
            }}
          >
            <Feather name="plus" size={18} color={colors.accentYellow} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.accentYellow }}>
              Choose your Learning Buddy
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
