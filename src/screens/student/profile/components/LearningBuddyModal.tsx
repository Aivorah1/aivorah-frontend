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
  type LearningBuddy,
  type BuddyCostume,
  type SavedLearningBuddy,
} from '../learningBuddyConstants';

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
  const [selectedBuddyId, setSelectedBuddyId] = useState<string>(currentBuddy.buddyId);
  const [customName, setCustomName] = useState<string>(currentBuddy.customName ?? '');
  const [selectedCostumeId, setSelectedCostumeId] = useState<string>(currentBuddy.costumeId);

  // Reset selection when modal opens
  React.useEffect(() => {
    if (visible) {
      setActiveCategory('all');
      setSelectedBuddyId(currentBuddy.buddyId);
      setCustomName(currentBuddy.customName ?? '');
      setSelectedCostumeId(currentBuddy.costumeId);
    }
  }, [visible, currentBuddy]);

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

  function handleSave() {
    onSave({
      buddyId: selectedBuddyId,
      customName: customName.trim() || null,
      costumeId: selectedCostumeId,
    });
    onClose();
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

            {/* Name Input */}
            <Text style={styles.fieldLabel}>Give your buddy a name (optional)</Text>
            <View style={styles.inputRow}>
              <Feather name="edit-3" size={16} color={colors.textDim} />
              <TextInput
                style={styles.input}
                placeholder={`e.g. ${selectedBuddy.name}`}
                placeholderTextColor={colors.textDim}
                value={customName}
                onChangeText={setCustomName}
                maxLength={20}
              />
            </View>

            {/* Costume Picker */}
            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Choose a costume</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.md }}
            >
              {selectedBuddy.costumes.map(renderCostumeCard)}
            </ScrollView>
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
