import React, { useRef, useState } from 'react';
import { Modal, Platform, Pressable, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { AppColors } from '../../theme';
import { FONT_PRESETS, loadPresetFonts, useFontPreset, type FontPresetId } from '../../utils/fontPresets';

const MENU_W = 228;

/**
 * "Aa" header button + anchored popover listing the five font presets.
 * Web only (presets drive CSS variables); renders nothing on native.
 */
export default function FontPresetMenu({ colors, account, buttonStyle }: { colors: AppColors; account?: string | null; buttonStyle: any }) {
  const [preset, choose] = useFontPreset(account);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 64, left: 0 });
  const btnRef = useRef<any>(null);
  const { width: W } = useWindowDimensions();

  if (Platform.OS !== 'web') return null;

  const openMenu = () => {
    loadPresetFonts(); // so each sample renders in its own heading font
    const node = btnRef.current;
    const place = (x: number, y: number, w: number, h: number) => {
      const left = Math.max(8, Math.min(x + w - MENU_W, W - MENU_W - 8));
      setPos({ top: y + h + 8, left });
      setOpen(true);
    };
    if (node?.measureInWindow) node.measureInWindow(place);
    else place(W - MENU_W - 16, 16, 36, 36);
  };
  const close = () => {
    setOpen(false);
    // return focus to the trigger
    setTimeout(() => { try { btnRef.current?.focus?.(); } catch { /* noop */ } }, 0);
  };
  const pick = (id: FontPresetId) => { choose(id); close(); };

  return (
    <>
      <TouchableOpacity
        ref={btnRef}
        testID="header-font-button"
        onPress={() => (open ? close() : openMenu())}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Font style"
        accessibilityState={{ expanded: open }}
        style={[buttonStyle, open && { borderColor: colors.primary }]}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textMain, fontFamily: 'var(--av-heading, inherit)' as any }}>Aa</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="none" onRequestClose={close}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} accessibilityLabel="Close font menu" testID="font-menu-backdrop">
          <View
            {...({ role: 'menu', 'aria-label': 'Font style' } as any)}
            onStartShouldSetResponder={() => true}
            style={{
              position: 'absolute', top: pos.top, left: pos.left, width: MENU_W, padding: 8, gap: 2,
              backgroundColor: colors.cardDark, borderRadius: 16, borderWidth: 1, borderColor: colors.borderColor,
              shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 16,
            }}
          >
            {FONT_PRESETS.map((p) => {
              const sel = preset === p.id;
              return (
                <Pressable
                  key={p.id}
                  testID={`font-option-${p.id}`}
                  onPress={() => pick(p.id)}
                  accessibilityRole={'menuitemradio' as any}
                  accessibilityState={{ checked: sel, selected: sel }}
                  accessibilityLabel={p.label}
                  style={({ hovered, focused }: any) => [{
                    minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 10,
                    backgroundColor: sel ? colors.primaryGlow : hovered || focused ? colors.cardHover : 'transparent',
                  }]}
                >
                  <Text style={{ width: 30, fontSize: 18, fontWeight: '700', color: colors.textHeading, fontFamily: `"${p.heading}", system-ui, sans-serif` }}>Aa</Text>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: sel ? '700' : '500', color: sel ? colors.textHeading : colors.textMain, fontFamily: `"${p.heading}", system-ui, sans-serif` }}>{p.label}</Text>
                  {sel && <Feather name="check" size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
