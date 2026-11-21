/**
 * Shared light/dark design system for the signed-out pages (Sign In, Create
 * Account, Forgot password), "Check your inbox" and Student Onboarding.
 *
 * It uses the homepage's own theme preference (localStorage
 * 'aivorah-home-theme', same rule as public/landing.html: saved choice, else
 * the system setting, else light) so the theme carries across the homepage,
 * these pages and Book a Demo. Toggling only swaps tokens — it never remounts
 * the forms, so typed input and selections survive.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle, useWindowDimensions } from 'react-native';
import ActivityIndicator from '../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import Svg, {
  Circle, Defs, Ellipse, G, LinearGradient as SvgLinear, Path, RadialGradient, Rect, Stop, Text as SvgText,
} from 'react-native-svg';

export const HOME_THEME_KEY = 'aivorah-home-theme';
export type HomeMode = 'light' | 'dark';

export const HOME_TOKENS = {
  light: {
    bg: '#F7F5EC', card: '#FFFDF7', input: '#FBFAF4',
    heading: '#15372C', text: '#202C25', muted: '#506054', accent: '#8B520C', onAccent: '#FFFFFF',
    primary: '#28533F', onPrimary: '#FFFFFF',
    line: '#D7DCCE', inputLine: '#CFD3C6', focus: '#28533F', placeholder: '#7A877D',
    primarySoft: 'rgba(40,83,63,0.09)', accentSoft: 'rgba(139,82,12,0.08)',
    danger: '#A9452E', dangerSoft: 'rgba(169,69,46,0.08)',
    success: '#2F6B48', successSoft: 'rgba(47,107,72,0.10)',
    shadow: 'rgba(60,48,20,0.16)',
    // backdrop
    paper: '#EFE7D3', paperHi: '#FAF6EA', stain: '#E6D9BB', frame: '#DCCFAF', knob: '#F6DCA6',
    // foliage
    leaf: '#8DAE70', leaf2: '#B7CE9A', leafDeep: '#6C8F55', stem: '#7E9A62', berry: '#C9A15A',
    // standing cover book
    coverA: '#F5EDDC', coverB: '#E4D5B4', coverEdge: '#CDB88E', spine: '#DCCBA5',
    emboss: '#B28C50', embossHi: 'rgba(255,255,255,0.75)', embossLo: 'rgba(110,80,30,0.28)', coverText: '#8E6B36',
    // cloth books (lying book, Create Account book)
    cloth: '#2F5B45', clothHi: '#3F7259', clothTrim: '#C9A15A',
    pages: '#F4EAD0', pagesLine: '#D9CBA6',
  },
  dark: {
    bg: '#101729', card: '#1C2942', input: '#23334D',
    heading: '#F8F4EC', text: '#DFE8F5', muted: '#B9C8DD', accent: '#F3CC92', onAccent: '#101729',
    primary: '#B6D5FF', onPrimary: '#101729',
    line: '#3B4F6C', inputLine: '#4A6084', focus: '#B6D5FF', placeholder: '#8B9CB5',
    primarySoft: 'rgba(182,213,255,0.13)', accentSoft: 'rgba(243,204,146,0.10)',
    danger: '#F2A48C', dangerSoft: 'rgba(242,164,140,0.10)',
    success: '#A9D4FF', successSoft: 'rgba(169,212,255,0.12)',
    shadow: 'rgba(0,0,0,0.5)',
    paper: '#0B1222', paperHi: '#17243D', stain: '#1B2A45', frame: '#34486A', knob: '#B6D5FF',
    leaf: '#56779F', leaf2: '#86A7CF', leafDeep: '#3E5D85', stem: '#5E7AA0', berry: '#E2C285',
    coverA: '#24395C', coverB: '#14223A', coverEdge: '#0C1628', spine: '#1A2B47',
    emboss: '#D8B674', embossHi: 'rgba(255,255,255,0.16)', embossLo: 'rgba(0,0,0,0.45)', coverText: '#E2C285',
    cloth: '#22395E', clothHi: '#2F4C78', clothTrim: '#D8B674',
    pages: '#E7D9B8', pagesLine: '#B9A57E',
  },
};
export type HomeTokens = typeof HOME_TOKENS.light;

const IS_WEB = Platform.OS === 'web';
export const SERIF = IS_WEB ? '"Fraunces", Georgia, serif' : 'Georgia';
export const SANS = IS_WEB ? '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' : undefined;
const SVG_SERIF = 'Fraunces, Georgia, serif';

/** Fraunces + Inter, the homepage fonts. Safe to call repeatedly. */
export function ensureHomeFonts() {
  if (!IS_WEB || typeof document === 'undefined') return;
  if (document.getElementById('aivorah-landing-fonts')) return;
  const link = document.createElement('link');
  link.id = 'aivorah-landing-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

function readMode(): HomeMode {
  if (IS_WEB && typeof window !== 'undefined') {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(HOME_THEME_KEY); } catch { saved = null; }
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

type Ctx = { mode: HomeMode; t: HomeTokens; toggle: () => void };
const HomeThemeContext = createContext<Ctx>({ mode: 'light', t: HOME_TOKENS.light, toggle: () => {} });

export function HomeThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<HomeMode>(readMode);
  useEffect(() => { ensureHomeFonts(); }, []);
  // The homepage iframe and Book a Demo page write the same key; follow them.
  useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => { if (e.key === HOME_THEME_KEY) setMode(readMode()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const toggle = useCallback(() => {
    setMode((m) => {
      const next: HomeMode = m === 'dark' ? 'light' : 'dark';
      if (IS_WEB) { try { window.localStorage.setItem(HOME_THEME_KEY, next); } catch { /* private mode */ } }
      return next;
    });
  }, []);
  const value = useMemo(() => ({ mode, t: HOME_TOKENS[mode], toggle }), [mode, toggle]);
  return <HomeThemeContext.Provider value={value}>{children}</HomeThemeContext.Provider>;
}

export const useHomeTheme = () => useContext(HomeThemeContext);

/** Responsive helpers: gutters and content caps from the spec. */
export function useAuthLayout() {
  const { width, height } = useWindowDimensions();
  const gutter = width < 640 ? 16 : width < 1024 ? 24 : 32;
  const maxContent = width >= 1920 ? 1440 : 1200;
  const headingSize = width < 640 ? 30 : width < 1024 ? 36 : width >= 1920 ? 44 : 40;
  return { width, height, gutter, maxContent, headingSize, isWide: width >= 1024, isTablet: width >= 640 };
}

// ── Web focus ring (Pressable on react-native-web reports `focused`) ─────────
function focusRing(t: HomeTokens, focused?: boolean): any {
  if (!IS_WEB) return null;
  return focused
    ? { outlineStyle: 'solid', outlineWidth: 2, outlineColor: t.focus, outlineOffset: 2 }
    : { outlineStyle: 'none' };
}

/** Wraps decorative artwork: hidden from screen readers and never interactive. */
export function Decorative({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={style}>
      {children}
    </View>
  );
}

// ── Brand (serif word-mark, as in the designs) ───────────────────────────────
export function BrandMark({ size = 28 }: { size?: number }) {
  const { t } = useHomeTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }} accessibilityRole="header" accessibilityLabel="Aivorah">
      <Text style={{ fontFamily: SERIF, fontSize: size * 1.08, fontWeight: '500', color: t.heading }}>Æ</Text>
      <Text style={{ fontFamily: SERIF, fontSize: size, fontWeight: '500', color: t.heading, letterSpacing: -0.3 }}>Aivorah</Text>
    </View>
  );
}

// ── Sun / moon switch (same behaviour as the homepage switch) ────────────────
export function ThemeSwitch() {
  const { mode, t, toggle } = useHomeTheme();
  const dark = mode === 'dark';
  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: dark }}
      style={(s: any) => [{
        width: 76, height: 40, borderRadius: 999, borderWidth: 1, borderColor: s.hovered ? t.primary : t.line,
        backgroundColor: t.input, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 11,
      }, focusRing(t, s.focused)]}
    >
      <View style={{
        position: 'absolute', top: 3, left: dark ? 39 : 3, width: 32, height: 32, borderRadius: 16,
        backgroundColor: t.knob, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
      }} />
      <Feather name="sun" size={17} color={dark ? t.muted : t.accent} />
      <Feather name="moon" size={17} color={dark ? t.onPrimary : t.muted} />
    </Pressable>
  );
}

// ── Page shell: paper backdrop, header, scrolling body ──────────────────────
export function AuthShell({
  children, onBack, backLabel = 'Back to home', backIcon = 'home', backStyle = 'link', headerRight, contentStyle, center = true, backdrop = 'full', contentMaxWidth,
}: {
  children: React.ReactNode;
  /** Wider content area than the default 1200/1440px cap (e.g. Create Account's 80% panel). */
  contentMaxWidth?: number;
  onBack?: () => void;
  backLabel?: string;
  backIcon?: string;
  /** 'link' = icon + text with a divider before the switch; 'pill' = outlined button. */
  backStyle?: 'link' | 'pill';
  headerRight?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Vertically centre the content when it is shorter than the screen. */
  center?: boolean;
  backdrop?: 'full' | 'plain';
}) {
  const { t } = useHomeTheme();
  const { gutter, maxContent, isTablet } = useAuthLayout();
  return (
    <View style={{ flex: 1, backgroundColor: t.paper }}>
      <PaperBackdrop variant={backdrop} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: isTablet ? 40 : 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexGrow: 1, width: '100%', maxWidth: Math.max(maxContent, contentMaxWidth ?? 0) + gutter * 2, alignSelf: 'center', paddingHorizontal: gutter + (isTablet ? 12 : 0) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: isTablet ? 22 : 14, paddingBottom: 10 }}>
            <BrandMark size={isTablet ? 28 : 22} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: isTablet ? 14 : 8 }}>
              {headerRight}
              {onBack && (
                <Pressable
                  onPress={onBack}
                  accessibilityRole="button"
                  accessibilityLabel={backLabel}
                  style={(s: any) => [{
                    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44,
                    paddingHorizontal: backStyle === 'pill' ? (isTablet ? 16 : 12) : 6, borderRadius: 999,
                    borderWidth: backStyle === 'pill' ? 1.5 : 0, borderColor: s.hovered ? t.primary : t.line,
                    backgroundColor: s.pressed ? t.primarySoft : 'transparent',
                  }, focusRing(t, s.focused)]}
                >
                  <Feather name={backIcon as any} size={isTablet ? 17 : 14} color={t.heading} />
                  <Text style={{ fontFamily: SANS, fontSize: isTablet ? 15 : 12, fontWeight: '600', color: t.heading }}>{backLabel}</Text>
                </Pressable>
              )}
              {onBack && backStyle === 'link' && <View style={{ width: 1, height: 28, backgroundColor: t.line }} />}
              <ThemeSwitch />
            </View>
          </View>
          <View style={[{ flexGrow: 1, justifyContent: center ? 'center' : 'flex-start', paddingTop: isTablet ? 8 : 4 }, contentStyle]}>{children}</View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Building blocks ──────────────────────────────────────────────────────────
export function AuthCard({ children, maxWidth = 480, style }: { children: React.ReactNode; maxWidth?: number; style?: StyleProp<ViewStyle> }) {
  const { t } = useHomeTheme();
  const { isTablet } = useAuthLayout();
  return (
    <View style={[{
      width: '100%', maxWidth, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 18,
      paddingHorizontal: isTablet ? 34 : 20, paddingVertical: isTablet ? 32 : 22,
      shadowColor: t.shadow, shadowOpacity: 1, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 5,
    }, style]}>
      {children}
    </View>
  );
}

/** Framed panel (double hairline border) used by Create Account. */
export function FramedPanel({ children, maxWidth = 1000, style }: { children: React.ReactNode; maxWidth?: number; style?: StyleProp<ViewStyle> }) {
  const { t } = useHomeTheme();
  const { isTablet } = useAuthLayout();
  return (
    <View style={[{
      width: '100%', maxWidth, alignSelf: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.frame, borderRadius: 22, padding: isTablet ? 8 : 0,
      shadowColor: t.shadow, shadowOpacity: 1, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 5,
    }, style]}>
      <View style={{ borderWidth: isTablet ? 1 : 0, borderColor: t.line, borderRadius: 16, paddingHorizontal: isTablet ? 40 : 20, paddingVertical: isTablet ? 32 : 22 }}>
        {children}
      </View>
    </View>
  );
}

export function AuthHeading({ title, subtitle, align = 'center', ornament = true }: { title: string; subtitle?: string; align?: 'center' | 'left'; ornament?: boolean }) {
  const { t } = useHomeTheme();
  const { headingSize } = useAuthLayout();
  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start', marginBottom: 20 }}>
      <Text accessibilityRole="header" style={{ fontFamily: SERIF, fontSize: headingSize, lineHeight: headingSize * 1.12, fontWeight: '600', color: align === 'left' ? t.heading : t.heading, letterSpacing: -0.6, textAlign: align }}>{title}</Text>
      {!!subtitle && <Text style={{ fontFamily: SANS, fontSize: 16.5, lineHeight: 23, color: t.text, marginTop: 6, textAlign: align }}>{subtitle}</Text>}
      {ornament && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }} aria-hidden>
          <View style={{ width: 70, height: 1, backgroundColor: t.line }} />
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path d="M19 4C11 5 6 10 6 18c3-1 5-3 7-6-2 4-4 6-8 8 9 0 14-6 14-16z" fill={t.accent} opacity={0.85} />
          </Svg>
          <View style={{ width: 70, height: 1, backgroundColor: t.line }} />
        </View>
      )}
    </View>
  );
}

export function FieldLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const { t } = useHomeTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
      <Text style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: '600', color: t.heading }}>{children}</Text>
      {right}
    </View>
  );
}

/** Labelled text field: 48px, 12px corners, 16px text, distinct focus/invalid. */
export function AuthField({ label, labelRight, invalid, rightEl, style, ...input }: Omit<TextInputProps, 'style'> & {
  label: string; labelRight?: React.ReactNode; invalid?: boolean; rightEl?: React.ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const { t } = useHomeTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <FieldLabel right={labelRight}>{label}</FieldLabel>
      <View style={{
        flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: 12, borderWidth: focused || invalid ? 1.5 : 1, paddingHorizontal: focused || invalid ? 13.5 : 14,
        backgroundColor: t.input, borderColor: invalid ? t.danger : focused ? t.focus : t.inputLine,
        ...(IS_WEB && focused ? { boxShadow: `0 0 0 3px ${t.primarySoft}` } as any : null),
      }}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={t.placeholder}
          onFocus={(e) => { setFocused(true); input.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); input.onBlur?.(e); }}
          style={[{ flex: 1, fontFamily: SANS, fontSize: 16, color: t.text, paddingVertical: 12 }, IS_WEB ? ({ outlineStyle: 'none' } as any) : null]}
        />
        {rightEl}
      </View>
    </View>
  );
}

export function PasswordEye({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const { t } = useHomeTheme();
  return (
    <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={shown ? 'Hide password' : 'Show password'}
      hitSlop={8} style={(s: any) => [{ padding: 6, borderRadius: 8 }, focusRing(t, s.focused)]}>
      <Feather name={shown ? 'eye-off' : 'eye'} size={19} color={t.heading} />
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, loading, disabled, icon, style, testID, tone = 'primary' }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean; icon?: string; style?: StyleProp<ViewStyle>; testID?: string;
  /** 'accent' = amber/gold fill (Create Account). */
  tone?: 'primary' | 'accent';
}) {
  const { t } = useHomeTheme();
  const off = disabled || loading;
  const bg = tone === 'accent' ? t.accent : t.primary;
  const fg = tone === 'accent' ? t.onAccent : t.onPrimary;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={(s: any) => [{
        minHeight: 50, borderRadius: 10, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingHorizontal: 20, opacity: disabled && !loading ? 0.5 : s.pressed ? 0.88 : 1,
        transform: [{ scale: s.pressed ? 0.99 : 1 }],
        ...(IS_WEB && s.hovered && !off ? { boxShadow: `0 10px 22px -12px ${t.shadow}` } as any : null),
      }, focusRing(t, s.focused), style]}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : (
        <>
          <Text style={{ fontFamily: SANS, fontSize: 17, fontWeight: '600', color: fg }}>{label}</Text>
          {icon && <Feather name={icon as any} size={17} color={fg} />}
        </>
      )}
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, loading, disabled, icon, leading, style, testID, accessibilityRole = 'button', accessibilityState }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean; icon?: string; leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>; testID?: string; accessibilityRole?: any; accessibilityState?: any;
}) {
  const { t } = useHomeTheme();
  const off = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={off}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState ?? { disabled: !!off, busy: !!loading }}
      style={(s: any) => [{
        minHeight: 50, borderRadius: 10, borderWidth: 1.2, borderColor: s.hovered && !off ? t.primary : t.heading + '55',
        backgroundColor: s.pressed ? t.primarySoft : t.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingHorizontal: 18, opacity: off && !loading ? 0.5 : 1,
      }, focusRing(t, s.focused), style]}
    >
      {loading ? <ActivityIndicator color={t.heading} size="small" /> : (leading ?? (icon ? <Feather name={icon as any} size={17} color={t.heading} /> : null))}
      <Text style={{ fontFamily: SANS, fontSize: 16.5, fontWeight: '600', color: t.heading }}>{label}</Text>
    </Pressable>
  );
}

export function OrDivider({ label = 'or continue with email' }: { label?: string }) {
  const { t } = useHomeTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 16 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
      <Text style={{ fontFamily: SANS, fontSize: 14, color: t.muted }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
    </View>
  );
}

export function Notice({ kind, children, style }: { kind: 'error' | 'success' | 'info' | 'warn'; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { t } = useHomeTheme();
  const map = {
    error: { fg: t.danger, bg: t.dangerSoft, icon: 'alert-circle' },
    success: { fg: t.success, bg: t.successSoft, icon: 'check-circle' },
    info: { fg: t.primary, bg: t.primarySoft, icon: 'info' },
    warn: { fg: t.accent, bg: t.accentSoft, icon: 'alert-triangle' },
  }[kind];
  return (
    <View accessibilityLiveRegion="polite" style={[{
      flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 10,
      backgroundColor: map.bg, borderWidth: 1, borderColor: map.fg + '40', marginBottom: 14,
    }, style]}>
      <Feather name={map.icon as any} size={16} color={map.fg} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        {typeof children === 'string'
          ? <Text style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 19, color: kind === 'info' ? t.text : map.fg }}>{children}</Text>
          : children}
      </View>
    </View>
  );
}

export function TextLink({ label, onPress, tone = 'accent' }: { label: string; onPress: () => void; tone?: 'accent' | 'primary' }) {
  const { t } = useHomeTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={6} style={(s: any) => [{ borderRadius: 4 }, focusRing(t, s.focused)]}>
      <Text style={{ fontFamily: SANS, fontSize: 15, fontWeight: '600', color: tone === 'accent' ? t.accent : t.primary, textDecorationLine: 'underline' }}>{label}</Text>
    </Pressable>
  );
}

/** Selectable chip with a visible check, used for curriculum / grade / gender. */
export function SelectChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { t } = useHomeTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      style={(s: any) => [{
        flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1,
        borderColor: selected ? t.primary : s.hovered ? t.primary : t.inputLine,
        backgroundColor: selected ? t.primary : t.input,
      }, focusRing(t, s.focused)]}
    >
      {selected && <Feather name="check" size={14} color={t.onPrimary} />}
      <Text style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: '600', color: selected ? t.onPrimary : t.text }}>{label}</Text>
    </Pressable>
  );
}

/** Role tile with a radio/check indicator. */
export function RoleTile({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { t } = useHomeTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      style={(s: any) => [{
        flexGrow: 1, flexBasis: 140, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 16,
        borderRadius: 8, borderWidth: selected ? 1.5 : 1, borderColor: selected || s.hovered ? t.primary : t.inputLine,
        backgroundColor: selected ? t.primarySoft : t.card,
      }, focusRing(t, s.focused)]}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: selected ? t.primary : t.muted,
        backgroundColor: selected ? t.primary : 'transparent', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <Feather name="check" size={13} color={t.onPrimary} />}
      </View>
      <Text style={{ fontFamily: SANS, fontSize: 16, fontWeight: '600', color: t.heading }}>{label}</Text>
    </Pressable>
  );
}

export function Checkbox({ label, help, checked, onToggle, testID }: { label: string; help?: string; checked: boolean; onToggle: () => void; testID?: string }) {
  const { t } = useHomeTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={(s: any) => [{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 6, borderRadius: 8 }, focusRing(t, s.focused)]}
    >
      <View style={{
        width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, marginTop: 1, borderColor: checked ? t.primary : t.muted,
        backgroundColor: checked ? t.primary : t.card, alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Feather name="check" size={13} color={t.onPrimary} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: SANS, fontSize: 15, fontWeight: '500', color: t.heading }}>{label}</Text>
        {!!help && <Text style={{ fontFamily: SANS, fontSize: 13, lineHeight: 19, color: t.muted, marginTop: 2 }}>{help}</Text>}
      </View>
    </Pressable>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Decorative artwork (react-native-svg, coloured by tokens)
// ════════════════════════════════════════════════════════════════════════════
const LEAF = 'M0 0 C12 -13 34 -14 48 0 C34 14 12 13 0 0 Z';
const SPRIG_STEM = 'M80 298 C78 240 70 190 84 130 C94 86 104 50 120 8';
const SPRIG_LEAVES: [number, number, number, number, 0 | 1 | 2][] = [
  [81, 268, -28, 1, 0], [79, 212, -36, 1.05, 1], [84, 150, -42, 1, 2], [95, 102, -48, 0.9, 1],
  [106, 58, -52, 0.75, 0], [80, 246, -152, 1, 1], [78, 186, -145, 1.05, 2], [84, 128, -138, 0.95, 0],
  [94, 80, -132, 0.8, 1], [118, 12, -68, 0.6, 2],
];

/** One leafy branch, base at (80,298) of a 160×300 box, pointing up. */
function SprigPaths({ t }: { t: HomeTokens }) {
  const fills = [t.leaf, t.leaf2, t.leafDeep];
  return (
    <>
      <Path d={SPRIG_STEM} fill="none" stroke={t.stem} strokeWidth={2.4} strokeLinecap="round" />
      {SPRIG_LEAVES.map(([x, y, r, sc, f], i) => (
        <G key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${sc})`}>
          <Path d={LEAF} fill={fills[f]} />
          <Path d="M3 0 H44" stroke={t.stem} strokeWidth={0.8} opacity={0.45} />
        </G>
      ))}
    </>
  );
}

export function LeafSprig({ width = 120 }: { width?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={width} height={width * 1.875} viewBox="0 0 160 300">
      <SprigPaths t={t} />
    </Svg>
  );
}

/** Corner foliage: three branches and a berry stem growing from the top-left corner. */
export function LeafCluster({ width = 260 }: { width?: number }) {
  const { t } = useHomeTheme();
  const branch = (x: number, y: number, rot: number, s: number, key: string) => (
    <G key={key} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-80 -298)`}>
      <SprigPaths t={t} />
    </G>
  );
  return (
    <Svg width={width} height={width * 1.1} viewBox="0 0 280 308">
      {branch(6, 20, 128, 0.95, 'a')}
      {branch(0, 40, 160, 0.8, 'b')}
      {branch(20, 4, 104, 0.62, 'c')}
      <Path d="M8 10 C40 40 64 60 96 74" stroke={t.stem} strokeWidth={1.4} fill="none" />
      <Path d="M70 62 C76 50 84 46 92 44 M86 70 C96 64 104 64 112 66" stroke={t.stem} strokeWidth={1.1} fill="none" />
      {[[92, 44], [112, 66], [97, 74], [84, 40]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={3.4} fill={t.berry} />
      ))}
    </Svg>
  );
}

/** Torn paper scrap (light theme), sits behind content in the bottom-right corner. */
function TornPaper({ width = 320 }: { width?: number }) {
  const { t } = useHomeTheme();
  const d = 'M320 18 L303 15 L297 21 L281 19 L271 29 L262 27 L250 38 L236 36 L229 47 L214 49 L206 60 L190 63 L183 75 L170 74 L160 88 L144 92 L138 104 L122 107 L113 121 L98 122 L88 136 L70 140 L60 152 L44 156 L36 160 L320 160 Z';
  return (
    <Svg width={width} height={width * 0.5} viewBox="0 0 320 160" opacity={0.85}>
      <Path d={d} fill={t.paperHi} />
      <Path d={d} fill="none" stroke={t.frame} strokeWidth={0.8} />
    </Svg>
  );
}

/** Warm paper background with vignette, hairline frame, corner foliage. */
export function PaperBackdrop({ variant = 'full' }: { variant?: 'full' | 'plain' }) {
  const { t, mode } = useHomeTheme();
  const { width, isWide, isTablet } = useAuthLayout();
  const cluster = isWide ? Math.min(300, width * 0.2) : isTablet ? 170 : 110;
  return (
    <Decorative style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="aivPaperVignette" cx="50%" cy="42%" rx="72%" ry="78%" fx="50%" fy="40%">
            <Stop offset="0" stopColor={t.paperHi} />
            <Stop offset="0.65" stopColor={t.bg} />
            <Stop offset="1" stopColor={t.paper} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#aivPaperVignette)" />
        <Ellipse cx="14" cy="72" rx="16" ry="10" fill={t.stain} opacity={0.35} />
        <Ellipse cx="88" cy="22" rx="12" ry="9" fill={t.stain} opacity={0.25} />
        <Ellipse cx="70" cy="90" rx="20" ry="7" fill={t.stain} opacity={0.25} />
      </Svg>
      {isTablet && (
        <View style={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 1, borderColor: t.frame, borderRadius: 18, opacity: mode === 'dark' ? 0.9 : 0.6 }} />
      )}
      {variant === 'full' && mode === 'light' && isWide && (
        <View style={{ position: 'absolute', right: '4%', bottom: 0 }}><TornPaper width={Math.min(360, width * 0.24)} /></View>
      )}
      <View style={{ position: 'absolute', top: isWide ? -34 : -18, left: isWide ? -46 : -22 }}><LeafCluster width={cluster} /></View>
      {variant === 'full' && (
        <View style={{ position: 'absolute', bottom: -14, right: -18, transform: [{ rotate: '180deg' }] }}>
          <LeafCluster width={cluster * 0.8} />
        </View>
      )}
    </Decorative>
  );
}

/** Standing embossed hardcover with the Aivorah crest — Sign In artwork. */
export function StandingBookArt({ width = 300 }: { width?: number }) {
  const { t } = useHomeTheme();
  const laurelLeaf = (x: number, y: number, r: number, k: string) => (
    <Path key={k} d={LEAF} fill={t.emboss} opacity={0.9} transform={`translate(${x} ${y}) rotate(${r}) scale(0.3)`} />
  );
  return (
    <Svg width={width} height={width * (400 / 300)} viewBox="0 0 300 400">
      <Defs>
        <SvgLinear id="aivCover" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={t.coverA} />
          <Stop offset="1" stopColor={t.coverB} />
        </SvgLinear>
        <SvgLinear id="aivHinge" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={t.coverEdge} />
          <Stop offset="0.55" stopColor={t.spine} />
          <Stop offset="1" stopColor={t.coverA} stopOpacity={0} />
        </SvgLinear>
        <SvgLinear id="aivEdge" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={t.pagesLine} />
          <Stop offset="1" stopColor={t.pages} />
        </SvgLinear>
        <RadialGradient id="aivShadow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="#000" stopOpacity={0.28} />
          <Stop offset="1" stopColor="#000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={158} cy={386} rx={150} ry={12} fill="url(#aivShadow)" />
      {/* page block + fore-edge */}
      <Rect x={36} y={16} width={252} height={366} rx={8} fill={t.pages} />
      <Rect x={270} y={22} width={18} height={354} rx={4} fill="url(#aivEdge)" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <Path key={i} d={`M${272 + i * 2.2} 24 V374`} stroke={t.pagesLine} strokeWidth={0.5} opacity={0.8} />)}
      {/* cover */}
      <Rect x={18} y={10} width={256} height={366} rx={10} fill="url(#aivCover)" />
      <Rect x={18} y={10} width={256} height={366} rx={10} fill="none" stroke={t.coverEdge} strokeWidth={1.4} />
      <Rect x={18} y={10} width={34} height={366} rx={10} fill="url(#aivHinge)" />
      <Path d="M52 12 V374" stroke={t.embossLo} strokeWidth={2} />
      <Path d="M54 12 V374" stroke={t.embossHi} strokeWidth={1} />
      <Path d="M22 44 H48 M22 50 H48 M22 336 H48 M22 342 H48" stroke={t.emboss} strokeWidth={1.2} opacity={0.7} />
      {/* embossed frames */}
      <Rect x={73} y={41} width={176} height={306} rx={6} fill="none" stroke={t.embossHi} strokeWidth={2} />
      <Rect x={72} y={40} width={176} height={306} rx={6} fill="none" stroke={t.emboss} strokeWidth={1.3} />
      <Rect x={81} y={49} width={160} height={290} rx={4} fill="none" stroke={t.emboss} strokeWidth={0.7} opacity={0.7} />
      {[[84, 52, 0], [238, 52, 90], [238, 336, 180], [84, 336, 270]].map(([x, y, r], i) => (
        <Path key={i} d="M0 14 C0 6 6 0 14 0 M4 14 C4 8 8 4 14 4" stroke={t.emboss} strokeWidth={1} fill="none" transform={`translate(${x} ${y}) rotate(${r})`} />
      ))}
      {/* open-book emblem */}
      <Path d="M130 112 C141 103 153 103 160 110 C167 103 179 103 190 112 V130 C179 122 167 122 160 129 C153 122 141 122 130 130 Z" fill="none" stroke={t.embossHi} strokeWidth={2.2} transform="translate(0.8 0.8)" />
      <Path d="M130 112 C141 103 153 103 160 110 C167 103 179 103 190 112 V130 C179 122 167 122 160 129 C153 122 141 122 130 130 Z" fill="none" stroke={t.emboss} strokeWidth={1.6} />
      <Path d="M160 110 V129 M137 113 C145 110 152 110 157 114 M183 113 C175 110 168 110 163 114" stroke={t.emboss} strokeWidth={0.9} fill="none" />
      {/* laurel */}
      <Path d="M126 238 C112 216 112 188 124 166" stroke={t.emboss} strokeWidth={1.3} fill="none" />
      <Path d="M194 238 C208 216 208 188 196 166" stroke={t.emboss} strokeWidth={1.3} fill="none" />
      {[0, 1, 2, 3, 4].map((i) => laurelLeaf(120 - (i === 0 || i === 4 ? 0 : 3), 232 - i * 15, -120 + i * 6, `l${i}`))}
      {[0, 1, 2, 3, 4].map((i) => laurelLeaf(200 + (i === 0 || i === 4 ? 0 : 3), 232 - i * 15, -60 - i * 6, `r${i}`))}
      {/* crest text, embossed (highlight offset under the colour) */}
      <SvgText x={161} y={223} textAnchor="middle" fontFamily={SVG_SERIF} fontSize={56} fontWeight="500" fill={t.embossHi}>Æ</SvgText>
      <SvgText x={160} y={222} textAnchor="middle" fontFamily={SVG_SERIF} fontSize={56} fontWeight="500" fill={t.coverText}>Æ</SvgText>
      <SvgText x={161} y={271} textAnchor="middle" fontFamily={SVG_SERIF} fontSize={32} fill={t.embossHi}>Aivorah</SvgText>
      <SvgText x={160} y={270} textAnchor="middle" fontFamily={SVG_SERIF} fontSize={32} fill={t.coverText}>Aivorah</SvgText>
      <SvgText x={160} y={298} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontSize={10.5} letterSpacing={5} fill={t.coverText}>EDUCATION</SvgText>
      <Path d="M144 318 H176" stroke={t.emboss} strokeWidth={1.4} />
    </Svg>
  );
}

/** Cloth book lying flat, spine toward the viewer — sits under the standing book. */
export function LyingBookArt({ width = 300 }: { width?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={width} height={width * (120 / 320)} viewBox="0 0 320 120">
      <Ellipse cx={170} cy={110} rx={150} ry={8} fill="#000" opacity={0.14} />
      <Rect x={40} y={38} width={272} height={44} rx={4} fill={t.pages} />
      {[46, 54, 62, 70, 76].map((y) => <Path key={y} d={`M44 ${y} H308`} stroke={t.pagesLine} strokeWidth={0.8} />)}
      <Rect x={30} y={26} width={286} height={16} rx={6} fill={t.cloth} />
      <Rect x={30} y={80} width={286} height={18} rx={6} fill={t.cloth} />
      <Rect x={6} y={24} width={64} height={76} rx={14} fill={t.clothHi} />
      <Rect x={6} y={24} width={64} height={76} rx={14} fill="none" stroke={t.cloth} strokeWidth={2} />
      {[16, 22, 52, 58].map((x) => <Path key={x} d={`M${x} 28 V96`} stroke={t.clothTrim} strokeWidth={1.6} />)}
      <Path d="M38 50 L44 62 L38 74 L32 62 Z" fill="none" stroke={t.clothTrim} strokeWidth={1.4} />
      <Path d="M76 32 H300 M76 92 H300" stroke={t.clothTrim} strokeWidth={0.8} opacity={0.6} />
    </Svg>
  );
}

/** Sign In artwork group: standing crest book with a cloth book under it. */
export function SignInArt({ width = 340 }: { width?: number }) {
  return (
    <Decorative style={{ width: width * 1.05, height: width * 1.27 }}>
      {/* standing book behind; the cloth book lies in front of its base */}
      <View style={{ position: 'absolute', left: width * 0.14, top: 0 }}><StandingBookArt width={width * 0.88} /></View>
      <View style={{ position: 'absolute', left: -width * 0.24, bottom: 0 }}><LyingBookArt width={width * 0.92} /></View>
    </Decorative>
  );
}

/** Create Account artwork: standing cloth book with gold sprig and ribbons, open book in front. */
export function CreateBookArt({ width = 230 }: { width?: number }) {
  const { t } = useHomeTheme();
  const ribbons = ['#E0A84B', '#9EC7C0', '#F1E3C4', '#C98B5A'];
  return (
    <Svg width={width} height={width * (360 / 240)} viewBox="0 0 240 360">
      <Defs>
        <SvgLinear id="aivCloth" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={t.clothHi} />
          <Stop offset="1" stopColor={t.cloth} />
        </SvgLinear>
      </Defs>
      <Ellipse cx={124} cy={344} rx={112} ry={10} fill="#000" opacity={0.15} />
      {/* standing book */}
      <Rect x={58} y={16} width={150} height={250} rx={6} fill={t.pages} />
      {ribbons.map((c, i) => <Rect key={i} x={200} y={44 + i * 38} width={18} height={24} rx={3} fill={c} />)}
      <Rect x={40} y={10} width={160} height={256} rx={8} fill="url(#aivCloth)" />
      <Rect x={40} y={10} width={20} height={256} rx={8} fill={t.cloth} />
      <Path d="M60 12 V264" stroke="#000" strokeOpacity={0.2} strokeWidth={1.5} />
      <Rect x={70} y={26} width={118} height={224} rx={4} fill="none" stroke={t.clothTrim} strokeWidth={0.9} opacity={0.6} />
      <Path d="M120 232 C116 190 120 140 140 70" stroke={t.clothTrim} strokeWidth={2} fill="none" />
      {[[121, 212, -150], [122, 190, -30], [124, 166, -150], [127, 144, -36], [131, 120, -142], [135, 98, -44], [139, 78, -128]].map(([x, y, r], i) => (
        <Path key={i} d={LEAF} fill={t.clothTrim} opacity={0.9} transform={`translate(${x} ${y}) rotate(${r}) scale(0.55)`} />
      ))}
      {/* open book in front */}
      <Path d="M20 290 C56 270 98 272 120 288 L120 336 C98 320 56 318 20 336 Z" fill={t.pages} stroke={t.pagesLine} strokeWidth={1} />
      <Path d="M220 290 C184 270 142 272 120 288 L120 336 C142 320 184 318 220 336 Z" fill={t.pages} stroke={t.pagesLine} strokeWidth={1} />
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Path d={`M30 ${298 + i * 9} C60 ${284 + i * 9} 94 ${286 + i * 9} 112 ${296 + i * 9}`} stroke={t.pagesLine} strokeWidth={0.8} fill="none" />
          <Path d={`M210 ${298 + i * 9} C180 ${284 + i * 9} 146 ${286 + i * 9} 128 ${296 + i * 9}`} stroke={t.pagesLine} strokeWidth={0.8} fill="none" />
        </React.Fragment>
      ))}
      <Path d="M16 336 C56 322 98 324 120 340 C142 324 184 322 224 336 L224 342 C184 330 142 332 120 346 C98 332 56 330 16 342 Z" fill={t.cloth} />
    </Svg>
  );
}

/** Envelope with leaf sprigs — "Check your inbox". */
export function EnvelopeArt({ width = 150 }: { width?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={width} height={width * 0.62} viewBox="0 0 240 150">
      {[[-18, 0], [0, -4], [18, 0]].map(([dx, dy], i) => (
        <Path key={i} d={`M${120 + dx * 1.4} ${18 + dy} L${120 + dx * 1.8} ${4 + dy}`} stroke={t.accent} strokeWidth={2.4} strokeLinecap="round" />
      ))}
      <G transform="translate(58 140) rotate(-35) scale(0.32) translate(-80 -298)"><SprigPaths t={t} /></G>
      <G transform="translate(182 140) rotate(35) scale(0.32) translate(-80 -298)"><SprigPaths t={t} /></G>
      <Rect x={74} y={42} width={92} height={64} rx={6} fill={t.knob} stroke={t.accent} strokeWidth={2} />
      <Path d="M74 46 L120 80 L166 46" fill="none" stroke={t.accent} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M74 104 L106 72 M166 104 L134 72" stroke={t.accent} strokeWidth={1.4} opacity={0.6} />
    </Svg>
  );
}

/** Open book for the onboarding page corner. */
export function OpenBookArt({ width = 160 }: { width?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={width} height={width * 0.6} viewBox="0 0 200 120">
      <Path d="M8 34 C50 10 86 14 100 30 L100 112 C86 96 50 92 8 112 Z" fill={t.pages} stroke={t.pagesLine} />
      <Path d="M192 34 C150 10 114 14 100 30 L100 112 C114 96 150 92 192 112 Z" fill={t.pages} stroke={t.pagesLine} />
      {[0, 1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <Path d={`M18 ${44 + i * 12} C48 ${28 + i * 12} 78 ${30 + i * 12} 92 ${42 + i * 12}`} stroke={t.pagesLine} strokeWidth={0.8} fill="none" />
          <Path d={`M182 ${44 + i * 12} C152 ${28 + i * 12} 122 ${30 + i * 12} 108 ${42 + i * 12}`} stroke={t.pagesLine} strokeWidth={0.8} fill="none" />
        </React.Fragment>
      ))}
    </Svg>
  );
}
