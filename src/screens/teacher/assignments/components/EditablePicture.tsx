import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import ActivityIndicator from '../../../../components/common/AivorahLoader';
import Icon from '../../../../components/common/Icon';
import { useTheme } from '../../../../context/ThemeContext';
import SERVER_URL from '../../../../config/serverUrl';
import { pickAndUploadPicture } from '../utils/pictureUpload';
import type { PictureSlot } from '../utils/quizEditing';

// One picture in the Edit tab (the task picture, or a question's own): shown
// as in Preview, with Move to / Replace / Remove under it. With no picture it
// is a small "Add picture" button. Website Redesign, Phase 4: the tools follow
// the Teacher Portal theme; the picture keeps its white mat so the uploaded
// material looks the same in Light and Dark.

const resolveUri = (url: string) => (url.startsWith('http') || url.startsWith('data:') ? url : `${SERVER_URL}${url}`);

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}


export function EditablePicture({ url, height, addLabel, moveTargets, onSet, onMove, testID }: {
  url: string | null;
  height: number;
  addLabel: string;
  moveTargets: { slot: PictureSlot; label: string }[];
  onSet: (url: string | null) => void;
  onMove: (to: PictureSlot) => void;
  testID?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [moving, setMoving] = React.useState(false);
  const { colors: t } = useTheme();
  const chip = { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: t.borderColor, backgroundColor: t.cardDark } as const;
  const chipText = { fontSize: 13, fontWeight: '600', color: t.textMain } as const;

  const pick = async () => {
    setBusy(true);
    try {
      const next = await pickAndUploadPicture();
      if (next) onSet(next);
    } catch (e: any) {
      notify('Picture not added', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!url) {
    return (
      <TouchableOpacity testID={testID ? `${testID}-add` : undefined} onPress={pick} disabled={busy} activeOpacity={0.75}
        accessibilityRole="button"
        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, minHeight: 36, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.borderColor }}>
        {busy ? <ActivityIndicator size="small" color={t.primary} /> : <Icon name="image-plus" size={16} color={t.primary} />}
        <Text style={{ fontSize: 13, fontWeight: '600', color: t.textMain }}>{busy ? 'Uploading…' : addLabel}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={{ marginBottom: 12 }}>
      <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: t.borderColor, backgroundColor: '#fff', padding: 8 }}>
        <Image source={{ uri: resolveUri(url) }} style={{ width: '100%', height, resizeMode: 'contain' }} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {moveTargets.length > 0 && (
          <TouchableOpacity testID={testID ? `${testID}-move` : undefined} style={chip} onPress={() => setMoving(m => !m)} activeOpacity={0.75} accessibilityRole="button" accessibilityState={{ expanded: moving }}>
            <Icon name="move" size={15} color={t.textMain} />
            <Text style={chipText}>Move to…</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity testID={testID ? `${testID}-replace` : undefined} style={chip} onPress={pick} disabled={busy} activeOpacity={0.75} accessibilityRole="button">
          {busy ? <ActivityIndicator size="small" color={t.primary} /> : <Icon name="replace" size={15} color={t.textMain} />}
          <Text style={chipText}>{busy ? 'Uploading…' : 'Replace'}</Text>
        </TouchableOpacity>
        <TouchableOpacity testID={testID ? `${testID}-remove` : undefined} style={chip} onPress={() => onSet(null)} activeOpacity={0.75} accessibilityRole="button">
          <Icon name="trash" size={15} color={t.accentRed} />
          <Text style={[chipText, { color: t.accentRed }]}>Remove</Text>
        </TouchableOpacity>
      </View>
      {moving && (
        <View style={{ marginTop: 8, padding: 10, borderRadius: 14, backgroundColor: t.surfaceSubtle, borderWidth: 1, borderColor: t.borderColor, gap: 6 }}>
          <Text style={{ fontSize: 12.5, color: t.textMuted }}>Move this picture to (a picture already there comes here):</Text>
          {moveTargets.map((target, i) => (
            <TouchableOpacity key={i} testID={testID ? `${testID}-move-${i}` : undefined} style={chip} activeOpacity={0.75}
              onPress={() => { setMoving(false); onMove(target.slot); }}>
              <Icon name="corner-down-right" size={15} color={t.primary} />
              <Text style={chipText}>{target.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
