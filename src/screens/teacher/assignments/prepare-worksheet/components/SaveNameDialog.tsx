import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import ActivityIndicator from '../../../../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import type { WorksheetStyles } from '../styles';

const MAX = 200;

/** Small "File name" box shown when the teacher clicks Save (mounted only while open). */
export function SaveNameDialog({ visible, initialName, saving, error, onCancel, onSave, styles, colors }: {
  visible: boolean;
  initialName: string;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (name: string) => void;
  styles: WorksheetStyles;
  colors: AppColors;
}) {
  const [name, setName] = useState(initialName);
  const trimmed = name.replace(/\s+/g, ' ').trim();
  const submit = () => { if (trimmed && !saving) onSave(trimmed); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { maxWidth: 420 }]} testID="save-name-dialog">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Save document</Text>
            <TouchableOpacity onPress={onCancel} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.fieldLabel}>File name</Text>
            <TextInput
              testID="save-name-input"
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Fractions practice"
              placeholderTextColor={colors.textDim}
              maxLength={MAX}
              autoFocus
              onSubmitEditing={submit}
              returnKeyType="done"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.backBtn} onPress={onCancel} disabled={saving} accessibilityRole="button">
              <Text style={styles.backBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="save-name-confirm"
              style={[styles.primaryBtn, !trimmed && { opacity: 0.5 }]}
              onPress={submit}
              disabled={!trimmed || saving}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Feather name="save" size={15} color={colors.onPrimary} />}
              <Text style={styles.primaryBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
