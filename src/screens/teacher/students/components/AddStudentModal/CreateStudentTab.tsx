import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import TealActionButton from '../../../../../components/common/TealActionButton';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../../theme';
import { isRealStudentEmail } from '../../utils/studentDisplay';

interface Props {
  colors: AppColors;
  gold: string;
  focusColor?: string;
  styles: any;
  allowedGrades: string[];
  allowedCurricula: string[];
  newName: string; setNewName: (v: string) => void;
  newEmail: string; setNewEmail: (v: string) => void;
  newPassword: string; setNewPassword: (v: string) => void;
  newGrade: string; setNewGrade: (v: string) => void;
  newCurriculum: string; setNewCurriculum: (v: string) => void;
  creating: boolean;
  createError: string;
  onCancel: () => void;
  onSubmit: () => void;
}

export default function CreateStudentTab({
  colors, gold, focusColor = gold, styles, allowedGrades, allowedCurricula,
  newName, setNewName, newEmail, setNewEmail, newPassword, setNewPassword,
  newGrade, setNewGrade, newCurriculum, setNewCurriculum,
  creating, createError, onCancel, onSubmit,
}: Props) {
  const invite = isRealStudentEmail(newEmail);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const fieldStyle = (id: string) => [styles.modalInput, focusedField === id && { borderColor: focusColor }];
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 3 }}>
        <Text style={styles.modalFieldLabel}>Full Name *</Text>
        <View style={fieldStyle('name')} {...{ dataSet: { studentField: 'name' } }}>
          <Feather name="user" size={14} color={colors.textDim} />
          <TextInput
            testID="teacher-students-create-name-input"
            style={styles.modalTextInput}
            value={newName} onChangeText={setNewName}
            placeholder="e.g. Aanya Kapoor" placeholderTextColor={colors.textDim}
            accessibilityLabel="Full Name"
            onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
            autoCapitalize="words"
          />
          </View>
      </View>

      <View style={{ gap: 3 }}>
        <Text style={styles.modalFieldLabel}>Email <Text style={{ fontWeight: '400', color: colors.textDim }}>(optional — auto-generated if blank)</Text></Text>
        <View style={fieldStyle('email')} {...{ dataSet: { studentField: 'email' } }}>
          <Feather name="mail" size={14} color={colors.textDim} />
          <TextInput
            testID="teacher-students-create-email-input"
            style={styles.modalTextInput}
            value={newEmail} onChangeText={setNewEmail}
            placeholder="Leave blank to auto-generate" placeholderTextColor={colors.textDim}
            accessibilityLabel="Email"
            onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
            keyboardType="email-address" autoCapitalize="none"
          />
      </View>
      </View>

      {invite ? (
        <Text testID="teacher-students-create-invite-note" style={{ fontSize: 12, color: colors.textMuted, lineHeight: 17 }}>
          We&apos;ll email this student an invite to set their password and verify their email. They can sign in once verified.
        </Text>
      ) : (
        <View style={{ gap: 3 }}>
          <Text style={styles.modalFieldLabel}>Password <Text style={{ fontWeight: '400', color: colors.textDim }}>(optional)</Text></Text>
          <View style={fieldStyle('password')} {...{ dataSet: { studentField: 'password' } }}>
            <Feather name="lock" size={14} color={colors.textDim} />
            <TextInput
              testID="teacher-students-create-password-input"
              style={styles.modalTextInput}
              value={newPassword} onChangeText={setNewPassword}
              placeholder="Leave blank to auto-generate" placeholderTextColor={colors.textDim}
              accessibilityLabel="Password"
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
              secureTextEntry
            />
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.modalFieldLabel}>Grade</Text>
          {allowedGrades.map(g => (
            <TouchableOpacity
              key={g} activeOpacity={0.8}
              testID={`teacher-students-create-grade-${g.toLowerCase().replace(/\s+/g, '-')}`}
              onPress={() => setNewGrade(g)}
              accessibilityRole="radio" accessibilityState={{ checked: newGrade === g }} aria-checked={newGrade === g}
              style={[styles.modalOption, { borderColor: newGrade === g ? gold : colors.borderColor, backgroundColor: newGrade === g ? gold + '18' : 'transparent' }]}
            >
              <Text style={{ fontSize: 12, color: newGrade === g ? gold : colors.textMuted, fontWeight: '600', flexShrink: 1 }}>{g}</Text>
              {newGrade === g && <Feather name="check" size={12} color={gold} />}
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.modalFieldLabel}>Curriculum</Text>
          {allowedCurricula.map(c => (
            <TouchableOpacity
              key={c} activeOpacity={0.8}
              testID={`teacher-students-create-curriculum-${c.toLowerCase().replace(/\s+/g, '-')}`}
              onPress={() => setNewCurriculum(c)}
              accessibilityRole="radio" accessibilityState={{ checked: newCurriculum === c, disabled: allowedCurricula.length <= 1 }} aria-checked={newCurriculum === c}
              disabled={allowedCurricula.length <= 1}
              style={[styles.modalOption, { borderColor: newCurriculum === c ? gold : colors.borderColor, backgroundColor: newCurriculum === c ? gold + '18' : 'transparent' }]}
            >
              <Text style={{ fontSize: 12, color: newCurriculum === c ? gold : colors.textMuted, fontWeight: '600', flex: 1 }}>{c}</Text>
              {newCurriculum === c && <Feather name={allowedCurricula.length <= 1 ? 'lock' : 'check'} size={11} color={gold} />}
            </TouchableOpacity>
          ))}
          <Text style={{ fontSize: 10, color: colors.textDim, marginTop: 5, lineHeight: 14 }}>
            {allowedCurricula.length > 1 ? 'Pick the curriculum for this student.' : 'Matches your curriculum. Contact admin to change.'}
          </Text>
        </View>
      </View>

      {createError ? <Text testID="teacher-students-create-error" style={{ color: colors.accentRed, fontSize: 13 }}>{createError}</Text> : null}

      <View style={styles.modalBtns}>
        <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TealActionButton testID="teacher-students-create-submit-button" style={{ flex: 1.35, minWidth: 0 }}
          label={creating ? 'Creating account…' : invite ? 'Create & Send Invite' : 'Create Account'}
          icon="user-plus" onPress={onSubmit} loading={creating} />
      </View>
    </View>
  );
}
