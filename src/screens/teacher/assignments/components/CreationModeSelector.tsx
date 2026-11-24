import React from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../../../theme';
import type { ScrollView } from 'react-native';

// The "choose how you want to create this assignment" landing screen —
// extracted verbatim (no behavior change) from TeacherAssignmentsScreen.tsx,
// as part of splitting the Create Assignment Modal wizard into per-flow
// components (2026-08-25), following the design the user specified.
//
// Prepare Worksheet and Bulk Upload are WEB-ONLY on native (Android/iOS):
// the Word-style editor needs a browser DOM, and bulk upload needs client-side
// PDF rendering (pdfjs) which isn't available natively. On native they are
// shown greyed-out with a "Web only" badge and tapping them directs the teacher
// to the web app, so the choice is visible but clearly unavailable.
const IS_WEB = Platform.OS === 'web';

export function CreationModeSelector({
  isIBPYP, gold, colors,
  setCreateMode, setType, setUploadStep, uploadScrollRef, setBulkPhase, setBulkItems, onPrepareWorksheet,
}: {
  isIBPYP: boolean;
  gold: string;
  colors: AppColors;
  setCreateMode: (m: 'choose' | 'ai' | 'upload' | 'bulk') => void;
  setType: (t: 'assignment' | 'quiz') => void;
  setUploadStep: (s: 1 | 2 | 3) => void;
  uploadScrollRef: React.RefObject<ScrollView | null>;
  setBulkPhase: (p: 'pick' | 'group' | 'classify' | 'generate' | 'assign') => void;
  setBulkItems: (items: any[]) => void;
  // Opens the Prepare Worksheet page (its own screen, not part of this modal).
  onPrepareWorksheet: () => void;
}) {
  const webOnlyMsg = 'This feature is available on the Aivorah web app.';

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      <Text style={{ width: '100%', fontSize: 16, color: colors.textMuted, lineHeight: 24 }}>
        Choose how you want to create this assignment:
      </Text>

      {/* Option 1: Prepare Worksheet — write one in the Word-style editor, then assign it */}
      <TouchableOpacity
        testID="create-mode-prepare-worksheet"
        style={{ flexGrow: 1, flexBasis: 260, minHeight: 96, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.borderColor, backgroundColor: colors.tintBlue, gap: 8, justifyContent: 'center', opacity: IS_WEB ? 1 : 0.6 }}
        onPress={() => { if (IS_WEB) onPrepareWorksheet(); else Alert.alert('Prepare Worksheet', webOnlyMsg, [{ text: 'OK' }]); }}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cardDark, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="edit" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, lineHeight: 23, fontWeight: '700', color: colors.textHeading }}>Prepare Worksheet</Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textMuted, marginTop: 4 }}>
              Create and edit a worksheet in a Word-style editor, then assign it to students.
            </Text>
            {!IS_WEB && (
              <Text style={{ fontSize: 12, lineHeight: 16, color: colors.textDim, marginTop: 2, fontWeight: '600' }}>Web only</Text>
            )}
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Option 2: Upload Worksheet */}
      <TouchableOpacity
        style={{ flexGrow: 1, flexBasis: 260, minHeight: 96, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.borderColor, backgroundColor: colors.tintPeach, gap: 8, justifyContent: 'center' }}
        onPress={() => { setCreateMode('upload'); setUploadStep(1); uploadScrollRef.current?.scrollTo({ y: 0, animated: false }); }}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cardDark, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="upload" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, lineHeight: 23, fontWeight: '700', color: colors.textHeading }}>Upload Worksheet (PDF / Image)</Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textMuted, marginTop: 4 }}>
              Extract questions from worksheet, use as-is or convert to interactive quiz
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Option 3: AI Assignment */}
      <TouchableOpacity
        style={{ flexGrow: 1, flexBasis: 260, minHeight: 96, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.borderColor, backgroundColor: colors.tintLilac, gap: 8, justifyContent: 'center' }}
        onPress={() => { setCreateMode('ai'); setType('assignment'); }}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cardDark, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="cpu" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, lineHeight: 23, fontWeight: '700', color: colors.textHeading }}>
              {isIBPYP ? 'Generate IB PYP Assignment' : 'Generate AI Assignment'}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textMuted, marginTop: 4 }}>
              AI creates Purpose, Learning Outcomes, Task Steps, Word Bank, and Stamps
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Option 4: Bulk Upload — several separate worksheets at once */}
      <TouchableOpacity
        style={{ flexGrow: 1, flexBasis: 260, minHeight: 96, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: colors.borderColor, backgroundColor: colors.tintMint, gap: 8, justifyContent: 'center', opacity: IS_WEB ? 1 : 0.6 }}
        onPress={() => { if (IS_WEB) { setCreateMode('bulk'); setBulkPhase('pick'); setBulkItems([]); } else { Alert.alert('Bulk Upload', webOnlyMsg, [{ text: 'OK' }]); } }}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cardDark, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="layers" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, lineHeight: 23, fontWeight: '700', color: colors.textHeading }}>Bulk Upload (Multiple Worksheets)</Text>
            <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textMuted, marginTop: 4 }}>
              Upload several separate worksheets at once — each becomes its own assignment
            </Text>
            {!IS_WEB && (
              <Text style={{ fontSize: 12, lineHeight: 16, color: colors.textDim, marginTop: 2, fontWeight: '600' }}>Web only</Text>
            )}
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    </View>
  );
}
