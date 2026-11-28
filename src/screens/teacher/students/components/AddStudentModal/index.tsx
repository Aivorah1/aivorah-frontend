import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import type { AddTab } from '../../types';
import CreateStudentTab from './CreateStudentTab';
import LinkExistingTab from './LinkExistingTab';
import BulkImportTab from './BulkImportTab';

interface Props {
  visible: boolean;
  onClose: () => void;
  colors: AppColors;
  gold: string;
  isDark: boolean;
  styles: any;
  addTab: AddTab;
  onSelectCreateTab: () => void;
  onSelectLinkTab: () => void;
  onSelectBulkTab: () => void;
  createProps: React.ComponentProps<typeof CreateStudentTab>;
  linkProps: React.ComponentProps<typeof LinkExistingTab>;
  bulkProps: React.ComponentProps<typeof BulkImportTab>;
}

export default function AddStudentModal({
  visible, onClose, colors, isDark, styles, addTab,
  onSelectCreateTab, onSelectLinkTab, onSelectBulkTab,
  createProps, linkProps, bulkProps,
}: Props) {
  const teal = isDark ? '#94D9CA' : '#1D665E';
  const peach = isDark ? '#FFD0B6' : '#873717';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View testID="teacher-students-add-modal" style={[styles.modalBox, { maxHeight: '100%' }]}>
          {Platform.OS === 'web' && React.createElement('style', null, `
            body[data-av-portal] [data-testid="teacher-students-add-modal"] :focus-visible {
              outline: 2px solid ${teal} !important;
              outline-offset: 2px !important;
            }
            body[data-av-portal] [data-testid="teacher-students-add-modal"] input:focus-visible {
              outline: none !important;
            }
            [data-testid="teacher-students-add-modal"] [data-student-field]:focus-within {
              border-color: ${teal};
              box-shadow: 0 0 0 2px ${teal}38;
            }
          `)}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 4 }}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: peach + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="user-plus" size={16} color={peach} />
                </View>
                <Text style={styles.modalTitle}>Add Student</Text>
              </View>
              <TouchableOpacity testID="teacher-students-add-modal-close" accessibilityRole="button" accessibilityLabel="Close Add Student" onPress={onClose} style={styles.modalClose}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.modalTabs} accessibilityRole="tablist">
              {([
                ['create', 'Create New', 'user-plus', onSelectCreateTab],
                ['link', 'Link Existing', 'link', onSelectLinkTab],
                ...(Platform.OS === 'web' ? [['bulk', 'Bulk Import', 'upload', onSelectBulkTab] as const] : []),
              ] as const).map(([id, label, icon, onPress]) => {
                const selected = addTab === id;
                const accent = selected ? peach : teal;
                return (
                  <TouchableOpacity key={id} testID={`teacher-students-tab-${id}`}
                    accessibilityRole="tab" accessibilityState={{ selected }} aria-selected={selected} onPress={onPress} activeOpacity={0.8}
                    style={[styles.modalTab, { borderColor: accent + '55', backgroundColor: accent + '20' }]}>
                    <Feather name={icon} size={13} color={accent} />
                    <Text style={[styles.modalTabText, { color: accent }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {addTab === 'create' && <CreateStudentTab {...createProps} gold={peach} focusColor={teal} />}
            {addTab === 'link' && <LinkExistingTab {...linkProps} />}
            {addTab === 'bulk' && Platform.OS === 'web' && <BulkImportTab {...bulkProps} />}
            {/* Defensive fallback: if addTab is 'bulk' on mobile (where the tab is
                hidden), show the Create New tab instead of a blank modal body. */}
            {addTab === 'bulk' && Platform.OS !== 'web' && <CreateStudentTab {...createProps} gold={peach} focusColor={teal} />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
