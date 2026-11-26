import React from 'react';
import { View, Text, Pressable, Platform, Alert } from 'react-native';
import Icon from '../../../../components/common/Icon';
import { useTheme } from '../../../../context/ThemeContext';
import { studentShapeColors } from '../../../../theme';
import type { AppColors } from '../../../../theme';
import type { ScrollView } from 'react-native';

// The "choose how you want to create this assignment" landing screen —
// extracted verbatim (no behavior change) from TeacherAssignmentsScreen.tsx,
// as part of splitting the Create Assignment Modal wizard into per-flow
// components (2026-08-25), following the design the user specified.
//
// Website Redesign, Phase 4: each option has its own accent (the homepage
// shapes: blue, orange, green, yellow), a shape in its corner, the icon in
// the same place, and a brief hover / focus highlight. Copy is unchanged.
//
// Prepare Worksheet and Bulk Upload are WEB-ONLY on native (Android/iOS):
// the Word-style editor needs a browser DOM, and bulk upload needs client-side
// PDF rendering (pdfjs) which isn't available natively. On native they are
// shown greyed-out with a "Web only" badge and tapping them directs the teacher
// to the web app, so the choice is visible but clearly unavailable.
const IS_WEB = Platform.OS === 'web';

type Accent = 'blue' | 'orange' | 'green' | 'yellow';
// Readable icon / outline colour per accent (AA on the card surface).
const INK: Record<Accent, { light: string; dark: string }> = {
  blue: { light: '#1D5DB5', dark: '#8DD1FF' },
  orange: { light: '#B84312', dark: '#FFB27A' },
  green: { light: '#23803A', dark: '#7BD389' },
  yellow: { light: '#7A5300', dark: '#FFD58A' },
};

function ModeCard({ testID, accent, icon, title, body, webOnly, onPress, colors }: {
  testID?: string;
  accent: Accent;
  icon: string;
  title: string;
  body: string;
  webOnly?: boolean;
  onPress: () => void;
  colors: AppColors;
}) {
  const { isDark } = useTheme();
  const shape = (isDark ? studentShapeColors.dark : studentShapeColors.light)[accent];
  const ink = INK[accent][isDark ? 'dark' : 'light'];
  const disabledLook = webOnly && !IS_WEB;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={(state: any) => {
        const lit = !disabledLook && (state.hovered || state.focused || state.pressed);
        return {
          // Board layout: four upright cards in one row (two / one as space narrows).
          flexGrow: 1, flexBasis: 170, minWidth: 150, minHeight: 220, padding: 16, borderRadius: 20, overflow: 'hidden', position: 'relative',
          borderWidth: 1.5, borderColor: lit ? ink : colors.borderColor, backgroundColor: lit ? shape + (isDark ? '26' : '1F') : colors.cardDark,
          opacity: disabledLook ? 0.6 : 1,
          transform: [{ translateY: lit && IS_WEB ? -2 : 0 }],
          shadowColor: '#302117', shadowOpacity: lit ? (isDark ? 0.35 : 0.1) : 0.04, shadowRadius: lit ? 18 : 8, shadowOffset: { width: 0, height: lit ? 10 : 4 },
          ...(IS_WEB ? { transitionProperty: 'border-color, background-color, transform, box-shadow', transitionDuration: '160ms', cursor: 'pointer' } : null),
        } as any;
      }}
    >
      {/* Accent shape peeking from the corner. */}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', right: -30, top: -34, width: 86, height: 78, borderRadius: 44, backgroundColor: shape, opacity: isDark ? 0.5 : 0.8 }} />
      <View style={{ flex: 1, gap: 10 }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: shape + (isDark ? '40' : '33'), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={24} color={ink} />
        </View>
        <Text style={{ fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.textHeading, fontFamily: Platform.OS === 'web' ? '"Fraunces", Georgia, serif' : undefined }}>{title}</Text>
        <Text style={{ fontSize: 13.5, lineHeight: 19, color: colors.textMuted }}>{body}</Text>
        {disabledLook && (
          <Text style={{ fontSize: 12, lineHeight: 16, color: colors.textDim, fontWeight: '600' }}>Web only</Text>
        )}
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'flex-end', width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.borderColor, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-right" size={18} color={colors.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

export function CreationModeSelector({
  isIBPYP, colors,
  setCreateMode, setType, setUploadStep, uploadScrollRef, setBulkPhase, setBulkItems, onPrepareWorksheet,
}: {
  isIBPYP: boolean;
  gold?: string;
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
      <ModeCard
        testID="create-mode-prepare-worksheet"
        accent="blue"
        icon="square-pen"
        title="Prepare Worksheet"
        body="Create and edit a worksheet in a Word-style editor, then assign it to students."
        webOnly
        colors={colors}
        onPress={() => { if (IS_WEB) onPrepareWorksheet(); else Alert.alert('Prepare Worksheet', webOnlyMsg, [{ text: 'OK' }]); }}
      />

      {/* Option 2: Upload Worksheet */}
      <ModeCard
        testID="create-mode-upload"
        accent="orange"
        icon="upload"
        title="Upload Worksheet (PDF / Image)"
        body="Extract questions from worksheet, use as-is or convert to interactive quiz"
        colors={colors}
        onPress={() => { setCreateMode('upload'); setUploadStep(1); uploadScrollRef.current?.scrollTo({ y: 0, animated: false }); }}
      />

      {/* Option 3: AI Assignment */}
      <ModeCard
        testID="create-mode-ai"
        accent="green"
        icon="cpu"
        title={isIBPYP ? 'Generate IB PYP Assignment' : 'Generate AI Assignment'}
        body="AI creates Purpose, Learning Outcomes, Task Steps, Word Bank, and Stamps"
        colors={colors}
        onPress={() => { setCreateMode('ai'); setType('assignment'); }}
      />

      {/* Option 4: Bulk Upload — several separate worksheets at once */}
      <ModeCard
        testID="create-mode-bulk"
        accent="yellow"
        icon="layers"
        title="Bulk Upload (Multiple Worksheets)"
        body="Upload several separate worksheets at once — each becomes its own assignment"
        webOnly
        colors={colors}
        onPress={() => { if (IS_WEB) { setCreateMode('bulk'); setBulkPhase('pick'); setBulkItems([]); } else { Alert.alert('Bulk Upload', webOnlyMsg, [{ text: 'OK' }]); } }}
      />
    </View>
  );
}
