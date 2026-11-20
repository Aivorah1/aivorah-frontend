import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, radius, fonts } from '../../../../theme';
import type { AppColors } from '../../../../theme';
import type { makeStyles } from '../ProfileScreen';
import {
  ALL_BUDDIES,
  BUDDY_CATEGORIES,
  HEROES,
  ANIMALS,
  PRINCESSES,
  PRINCES,
  getBuddyById,
  getCostumeById,
  DEFAULT_CLASSIC_BUDDY,
  isPictureBuddy,
  type LearningBuddy,
  type BuddyCostume,
  type SavedLearningBuddy,
} from '../learningBuddyConstants';
import {
  BUDDY_EMOTIONS,
  BUDDY_OUTFITS,
  DEFAULT_EMOTION,
  PICTURE_CHARACTERS,
  describePictureBuddy,
  fitOutfit,
  getPictureCharacter,
  optionLabel,
  outfitsFor,
} from '../buddyPictureOptions';
import { BuddyPicture } from './BuddyPicture';

type Mode = 'pictures' | 'classic';

// The picture-buddy and classic selections both start from what the student saved, each falling
// back to its own default, so switching tabs never loses a choice.
function startState(current: SavedLearningBuddy) {
  const picture = isPictureBuddy(current);
  const classic = picture ? DEFAULT_CLASSIC_BUDDY : current;
  const pictureChar = picture ? current.buddyId : PICTURE_CHARACTERS[0]?.id ?? 'aarav';
  return {
    mode: (picture ? 'pictures' : 'classic') as Mode,
    pictureChar,
    outfit: fitOutfit(pictureChar, picture ? current.costumeId : null),
    emotion: (picture && current.emotion) || DEFAULT_EMOTION,
    classicId: classic.buddyId,
    classicCostume: classic.costumeId,
  };
}

interface LearningBuddyModalProps {
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
  isDark: boolean;
  visible: boolean;
  onClose: () => void;
  onSave: (buddy: SavedLearningBuddy) => void;
  currentBuddy: SavedLearningBuddy;
}

export function LearningBuddyModal({
  styles, colors, isDark, visible, onClose, onSave, currentBuddy,
}: LearningBuddyModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mode, setMode] = useState<Mode>(() => startState(currentBuddy).mode);
  const [pictureChar, setPictureChar] = useState<string>(() => startState(currentBuddy).pictureChar);
  const [outfit, setOutfit] = useState<string>(() => startState(currentBuddy).outfit);
  const [emotion, setEmotion] = useState<string>(() => startState(currentBuddy).emotion);
  const [selectedBuddyId, setSelectedBuddyId] = useState<string>(() => startState(currentBuddy).classicId);
  const [customName, setCustomName] = useState<string>(currentBuddy.customName ?? '');
  const [selectedCostumeId, setSelectedCostumeId] = useState<string>(() => startState(currentBuddy).classicCostume);

  // Reset the selection each time the modal opens (adjusting state during
  // render when `visible` changes, as React recommends, instead of an effect).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      const start = startState(currentBuddy);
      setActiveCategory('all');
      setMode(start.mode);
      setPictureChar(start.pictureChar);
      setOutfit(start.outfit);
      setEmotion(start.emotion);
      setSelectedBuddyId(start.classicId);
      setCustomName(currentBuddy.customName ?? '');
      setSelectedCostumeId(start.classicCostume);
    }
  }

  const selectedBuddy = useMemo(
    () => getBuddyById(selectedBuddyId) ?? ALL_BUDDIES[0],
    [selectedBuddyId]
  );

  const selectedCostume = useMemo(
    () => getCostumeById(selectedBuddy, selectedCostumeId) ?? selectedBuddy.costumes[0],
    [selectedBuddy, selectedCostumeId]
  );

  const filteredBuddies = useMemo(() => {
    if (activeCategory === 'all') return ALL_BUDDIES;
    if (activeCategory === 'hero') return HEROES;
    if (activeCategory === 'animal') return ANIMALS;
    if (activeCategory === 'princess') return PRINCESSES;
    if (activeCategory === 'prince') return PRINCES;
    return ALL_BUDDIES;
  }, [activeCategory]);

  const character = getPictureCharacter(pictureChar) ?? PICTURE_CHARACTERS[0];
  const characterOutfits = useMemo(() => outfitsFor(pictureChar), [pictureChar]);

  function handleSave() {
    if (mode === 'pictures') {
      onSave({ buddyId: pictureChar, customName: customName.trim() || null, costumeId: outfit, emotion });
    } else {
      onSave({ buddyId: selectedBuddyId, customName: customName.trim() || null, costumeId: selectedCostumeId });
    }
    onClose();
  }

  function pickCharacter(id: string) {
    setPictureChar(id);
    setOutfit(fitOutfit(id, outfit)); // keep the outfit if the new character has it
  }

  function sectionTitle(text: string) {
    return <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>{text}</Text>;
  }

  function renderModeToggle() {
    const tabs: { id: Mode; label: string }[] = [
      { id: 'pictures', label: '✨ Buddies' },
      { id: 'classic', label: 'Classic characters' },
    ];
    return (
      <View
        style={{
          flexDirection: 'row', padding: 4, borderRadius: 999, marginBottom: spacing.lg,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        {tabs.map((t) => {
          const active = mode === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              testID={`buddy-mode-${t.id}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setMode(t.id)}
              activeOpacity={0.8}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center',
                backgroundColor: active ? colors.accentYellow : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#FFFFFF' : colors.textMuted }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderNameInput(placeholderName: string) {
    return (
      <>
        <Text style={styles.fieldLabel}>Give your buddy a name (optional)</Text>
        <View style={styles.inputRow}>
          <Feather name="edit-3" size={16} color={colors.textDim} />
          <TextInput
            testID="buddy-name-input"
            style={styles.input}
            placeholder={`e.g. ${placeholderName}`}
            placeholderTextColor={colors.textDim}
            value={customName}
            onChangeText={setCustomName}
            maxLength={20}
          />
        </View>
      </>
    );
  }

  function renderPictureBuddies() {
    if (!character) return null;
    const name = customName.trim() || character.name;
    return (
      <>
        {/* Big preview */}
        <View
          style={{
            alignItems: 'center', gap: 6, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          }}
        >
          <BuddyPicture
            testID="buddy-preview"
            characterId={character.id}
            outfit={outfit}
            emotion={emotion}
            size={180}
            showMood
            accessibilityLabel={describePictureBuddy(name, outfit, emotion)}
          />
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textMain, fontFamily: fonts.serif, marginTop: 6 }}>
            {name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {`Feeling ${optionLabel(BUDDY_EMOTIONS, emotion).toLowerCase()} · ${optionLabel(BUDDY_OUTFITS, outfit)}`}
          </Text>
        </View>

        {renderNameInput(character.name)}

        {/* Characters */}
        {sectionTitle('Choose your buddy')}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingVertical: 4 }}>
          {PICTURE_CHARACTERS.map((c) => {
            const active = c.id === pictureChar;
            return (
              <TouchableOpacity
                key={c.id}
                testID={`buddy-char-${c.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${c.name}: ${c.about}`}
                onPress={() => pickCharacter(c.id)}
                activeOpacity={0.8}
                style={{ alignItems: 'center', gap: 4, width: 68 }}
              >
                <BuddyPicture
                  characterId={c.id}
                  outfit={fitOutfit(c.id, outfit)}
                  emotion={DEFAULT_EMOTION}
                  size={60}
                  shape="circle"
                  borderColor={active ? colors.accentYellow : colors.borderColor}
                />
                <Text style={{ fontSize: 11, fontWeight: active ? '800' : '600', color: active ? colors.accentYellow : colors.textMuted }}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Outfits: real pictures of this character in each outfit */}
        {sectionTitle('Choose an outfit')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {characterOutfits.map((o) => {
            const active = o.id === outfit;
            return (
              <TouchableOpacity
                key={o.id}
                testID={`buddy-outfit-${o.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={o.label}
                onPress={() => setOutfit(o.id)}
                activeOpacity={0.8}
                style={{
                  width: '30%', alignItems: 'center', gap: 4, padding: 6, borderRadius: radius.lg, borderWidth: 2,
                  borderColor: active ? colors.accentYellow : colors.borderColor,
                  backgroundColor: active ? (isDark ? 'rgba(186,164,103,0.10)' : 'rgba(186,164,103,0.08)') : 'transparent',
                }}
              >
                <BuddyPicture characterId={pictureChar} outfit={o.id} emotion={DEFAULT_EMOTION} size={76} />
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: active ? '800' : '600', color: active ? colors.accentYellow : colors.textMuted }}>
                  {`${o.emoji} ${o.label}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Moods */}
        {sectionTitle('How is your buddy feeling?')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
          {BUDDY_EMOTIONS.map((e) => {
            const active = e.id === emotion;
            return (
              <TouchableOpacity
                key={e.id}
                testID={`buddy-mood-${e.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setEmotion(e.id)}
                activeOpacity={0.8}
                style={[styles.chip, active && styles.chipActive, { flexDirection: 'row', alignItems: 'center' }]}
              >
                <Text style={{ fontSize: 15 }}>{e.emoji}</Text>
                <Text style={[styles.chipTxt, active && styles.chipTxtActive, { marginLeft: 4 }]}>{e.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  }

  function renderBuddyCard(buddy: LearningBuddy) {
    const active = selectedBuddyId === buddy.id;
    return (
      <TouchableOpacity
        key={buddy.id}
        onPress={() => {
          setSelectedBuddyId(buddy.id);
          setSelectedCostumeId(buddy.costumes[0].id);
        }}
        style={[
          {
            width: '30%',
            borderRadius: radius.lg,
            borderWidth: 2,
            borderColor: active ? colors.accentYellow : colors.borderColor,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            padding: spacing.sm,
            alignItems: 'center',
            gap: 6,
          },
          active && { backgroundColor: isDark ? 'rgba(186,164,103,0.08)' : 'rgba(186,164,103,0.06)' },
        ]}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: 1,
            borderRadius: radius.md,
            overflow: 'hidden',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <Image
            source={buddy.image}
            style={{ width: '100%', height: '100%', borderRadius: radius.md }}
            resizeMode="cover"
          />
        </View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: active ? '700' : '600',
            color: active ? colors.accentYellow : colors.textMuted,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {buddy.name}
        </Text>
        {active && (
          <View
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.accentYellow,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="check" size={9} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  function renderCostumeCard(costume: BuddyCostume) {
    const active = selectedCostumeId === costume.id;
    return (
      <TouchableOpacity
        key={costume.id}
        onPress={() => setSelectedCostumeId(costume.id)}
        style={{
          alignItems: 'center',
          marginRight: spacing.md,
          gap: 6,
        }}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            borderWidth: 2,
            borderColor: active ? colors.accentYellow : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <LinearGradient colors={costume.overlay} style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 26,
            opacity: 0.85,
          }} />
          <Feather name={costume.icon as any} size={20} color="white" style={{ position: 'relative' }} />
        </View>
        <Text
          style={{
            fontSize: 10,
            fontWeight: active ? '700' : '500',
            color: active ? colors.accentYellow : colors.textDim,
          }}
          numberOfLines={1}
        >
          {costume.label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderClassic() {
    return (
      <>
        {/* Category Tabs */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
          {BUDDY_CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                ]}
                activeOpacity={0.7}
              >
                <Feather name={cat.icon as any} size={13} color={active ? colors.accentYellow : colors.textDim} />
                <Text style={[
                  styles.chipTxt,
                  active && styles.chipTxtActive,
                  { marginLeft: 4 },
                ]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Buddy Grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.xl,
          }}
        >
          {filteredBuddies.map(renderBuddyCard)}
        </View>

        {/* Selected Buddy Preview */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            marginBottom: spacing.xl,
          }}
        >
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
              source={selectedBuddy.image}
              style={{ width: 72, height: 72, borderRadius: 36 }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[selectedCostume.overlay[0] + '66', selectedCostume.overlay[1] + '66']}
              style={{ ...StyleSheet.absoluteFillObject, borderRadius: 36 }}
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textDim }}>
              {selectedBuddy.category === 'princess' ? '👸 Princess' :
               selectedBuddy.category === 'prince' ? '🤴 Prince' :
               selectedBuddy.category === 'hero' ? '🦸 Hero' : '🐾 Animal'}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textMain, fontFamily: fonts.serif }}>
              {customName.trim() || selectedBuddy.name}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {selectedCostume.label} costume
            </Text>
          </View>
        </View>

        {renderNameInput(selectedBuddy.name)}

        {/* Costume Picker */}
        <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Choose a costume</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.md }}
        >
          {selectedBuddy.costumes.map(renderCostumeCard)}
        </ScrollView>
      </>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.modalHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="smile" size={20} color={colors.accentYellow} />
              <Text style={styles.modalTitle}>Learning Buddy</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Feather name="x" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {renderModeToggle()}
            {mode === 'pictures' ? renderPictureBuddies() : renderClassic()}
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalBtns}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
              <Text style={styles.saveText}>Save Buddy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
