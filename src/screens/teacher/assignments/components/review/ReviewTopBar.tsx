import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ActivityIndicator from '../../../../../components/common/AivorahLoader';
import type { useReviewLayout } from './useReviewLayout';

type Layout = ReturnType<typeof useReviewLayout>;
type Colors = Record<string, string>;

type Action = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  testID?: string;
  selected?: boolean;
  busy?: boolean;
  busyLabel?: string;
};

function BarButton({ action, t, layout, variant = 'ghost', iconOnly = false }: {
  action: Action; t: Colors; layout: Layout; variant?: 'ghost' | 'primary'; iconOnly?: boolean;
}) {
  const selected = !!action.selected;
  const bg = variant === 'primary' ? t.primary : selected ? t.tintBlue || t.tintLilac : t.cardDark;
  const border = variant === 'primary' ? t.primary : selected ? t.primary : t.borderColor;
  const fg = variant === 'primary' ? t.onPrimary : selected ? t.primary : t.textMain;
  const h = layout.isTV ? 52 : 44;
  return (
    <TouchableOpacity
      testID={action.testID}
      onPress={action.onPress}
      disabled={action.busy}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityState={{ selected, busy: !!action.busy }}
      style={{
        minHeight: h, minWidth: h, paddingHorizontal: iconOnly ? 0 : layout.isTV ? 18 : 14, borderRadius: 10, borderWidth: 1,
        backgroundColor: bg, borderColor: border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: action.busy ? 0.7 : 1,
      }}
    >
      {action.busy ? <ActivityIndicator size="small" color={fg} /> : <Feather name={action.icon} size={layout.fs(16)} color={fg} />}
      {!iconOnly && (
        <Text style={{ fontSize: layout.fs(15), fontWeight: '700', color: fg }}>{action.busy && action.busyLabel ? action.busyLabel : action.label}</Text>
      )}
    </TouchableOpacity>
  );
}

// Aivorah Teacher Portal · Preview · Edit · Refresh · Open in Tab · Approve & Save · Close.
// Tablet: Refresh/Open in Tab shrink to icons and Close moves into "More".
// Mobile: only Approve & Save stays; everything else is under "⋯".
export function ReviewTopBar({ t, layout, mode, onPreview, onEdit, onRefresh, refreshing, onOpenInTab, onApprove, onClose }: {
  t: Colors;
  layout: Layout;
  mode: 'preview' | 'edit';
  onPreview: () => void;
  onEdit: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onOpenInTab?: () => void;
  onApprove: () => void;
  onClose: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const preview: Action = { key: 'preview', label: 'Preview', icon: 'eye', onPress: onPreview, selected: mode === 'preview', testID: 'review-preview' };
  const edit: Action = { key: 'edit', label: 'Edit', icon: 'edit-2', onPress: onEdit, selected: mode === 'edit', testID: 'review-edit' };
  const refresh: Action | null = onRefresh ? { key: 'refresh', label: 'Refresh', icon: 'refresh-cw', onPress: onRefresh, busy: refreshing, busyLabel: 'Refreshing…', testID: 'quiz-preview-refresh' } : null;
  const open: Action | null = onOpenInTab ? { key: 'open', label: 'Open in Tab', icon: 'external-link', onPress: onOpenInTab, testID: 'review-open-tab' } : null;
  const approve: Action = { key: 'approve', label: 'Approve & Save', icon: 'check', onPress: onApprove, testID: 'review-approve' };
  const close: Action = { key: 'close', label: 'Close', icon: 'x', onPress: onClose, testID: 'review-close' };

  const inline: { action: Action; iconOnly?: boolean; variant?: 'primary' }[] = [];
  const overflow: Action[] = [];
  if (layout.isMobile) {
    overflow.push(preview, edit, ...(refresh ? [refresh] : []), ...(open ? [open] : []), close);
    inline.push({ action: approve, variant: 'primary' });
  } else if (layout.isTablet) {
    inline.push({ action: preview }, { action: edit });
    if (refresh) inline.push({ action: refresh, iconOnly: true });
    if (open) inline.push({ action: open, iconOnly: true });
    inline.push({ action: approve, variant: 'primary' });
    overflow.push(close);
  } else {
    inline.push({ action: preview }, { action: edit });
    if (refresh) inline.push({ action: refresh });
    if (open) inline.push({ action: open });
    inline.push({ action: approve, variant: 'primary' }, { action: close });
  }

  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        paddingHorizontal: layout.gutter, paddingVertical: layout.isTV ? 16 : 10,
        backgroundColor: t.cardDark, borderBottomWidth: 1, borderBottomColor: t.borderColor, zIndex: 20,
        ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 0 } : null),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1 }} accessibilityRole="header">
        <Text style={{ fontSize: layout.fs(layout.isMobile ? 18 : 20), fontWeight: '800', color: t.primary }}>Aivorah</Text>
        {!layout.isMobile && !layout.isTablet && (
          <Text numberOfLines={1} style={{ fontSize: layout.fs(14), color: t.textMuted, fontWeight: '600' }}>Teacher Portal</Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: layout.isMobile ? 8 : 10, flexShrink: 0 }}>
        {inline.map(({ action, iconOnly, variant }) => (
          <BarButton key={action.key} action={action} iconOnly={iconOnly} variant={variant} t={t} layout={layout} />
        ))}
        {overflow.length > 0 && (
          <View style={{ position: 'relative' }}>
            <BarButton
              t={t}
              layout={layout}
              iconOnly={layout.isMobile}
              action={{ key: 'more', label: 'More', icon: layout.isMobile ? 'more-horizontal' : 'more-vertical', onPress: () => setMenuOpen(o => !o), testID: 'review-more', selected: menuOpen }}
            />
            {menuOpen && (
              <View
                testID="review-more-menu"
                accessibilityRole="menu"
                style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6, minWidth: 200, paddingVertical: 6, borderRadius: 12,
                  backgroundColor: t.cardDark, borderWidth: 1, borderColor: t.borderColor, zIndex: 30,
                  shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
                }}
              >
                {overflow.map(a => (
                  <Pressable
                    key={a.key}
                    testID={`${a.testID || a.key}-menu`}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: !!a.selected }}
                    onPress={() => { setMenuOpen(false); a.onPress(); }}
                    style={({ pressed }: any) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 14,
                      backgroundColor: pressed || a.selected ? t.surfaceSubtle : 'transparent',
                    })}
                  >
                    <Feather name={a.icon} size={16} color={a.selected ? t.primary : t.textMain} />
                    <Text style={{ fontSize: 15, fontWeight: a.selected ? '700' : '600', color: a.selected ? t.primary : t.textMain }}>{a.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
