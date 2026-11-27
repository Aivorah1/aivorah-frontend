/**
 * Shared light/dark design system for the signed-out pages (Sign In, Create
 * Account, Forgot password, Reset password), "Check your inbox" and Student
 * Onboarding — Website Redesign, Phase 2 (matches the Phase 1 homepage).
 *
 * It uses the homepage's own theme preference (localStorage
 * 'aivorah-home-theme', same rule as public/landing.html: saved choice, else
 * the system setting, else light) so the theme carries across the homepage,
 * these pages and Book a Demo. Toggling only swaps tokens — it never remounts
 * the forms, so typed input and selections survive.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo, Animated, Appearance, Easing, Platform, Pressable, ScrollView, StyleProp, Text, TextInput,
  TextInputProps, View, ViewStyle, useWindowDimensions,
} from 'react-native';
import ActivityIndicator from '../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Rect, G } from 'react-native-svg';

export const HOME_THEME_KEY = 'aivorah-home-theme';
export type HomeMode = 'light' | 'dark';

export const HOME_TOKENS = {
  light: {
    bg: '#F7F3E9', card: '#FFFCF6', input: '#F9F5ED',
    heading: '#302117', text: '#4F4035', muted: '#6A584A',
    accent: '#B84312', onAccent: '#FFFFFF', link: '#B84312',
    primary: '#B84312', onPrimary: '#FFFFFF', primaryHover: '#9F390E',
    line: '#D5C6B3', inputLine: '#D5C6B3', focus: '#1D5DB5', placeholder: '#8A786A',
    primarySoft: 'rgba(184,67,18,0.08)', accentSoft: 'rgba(184,67,18,0.08)',
    infoBg: '#FCEBD2', infoLine: '#F1CF9B',
    danger: '#B3261E', dangerSoft: 'rgba(179,38,30,0.07)',
    success: '#23803A', successSoft: 'rgba(35,128,58,0.10)',
    shadow: 'rgba(48,33,23,0.18)',
    // decorative shapes
    green: '#77B742', yellow: '#F6C931', orange: '#F58B3A', blue: '#61ABD7',
    // artwork
    ink: '#302117', paperFill: '#FFFFFF', pencil: '#F6C931', pencilDark: '#E0A812', rubber: '#F2A3B9',
    envelope: '#F6C931', envelopeFlap: '#E8B51F', ruler: '#61ABD7', rulerMark: '#2C6E96',
  },
  dark: {
    bg: '#101827', card: '#1C2A40', input: '#162238',
    heading: '#FFF3DC', text: '#DCE6F4', muted: '#B4C3D8',
    accent: '#FFB27A', onAccent: '#101827', link: '#A9D5FF',
    primary: '#A9D5FF', onPrimary: '#101827', primaryHover: '#C3E4FF',
    line: '#425775', inputLine: '#425775', focus: '#8DD1FF', placeholder: '#8FA2BD',
    primarySoft: 'rgba(169,213,255,0.12)', accentSoft: 'rgba(255,178,122,0.10)',
    infoBg: '#2B4663', infoLine: '#4E6C8E',
    danger: '#FF9C8A', dangerSoft: 'rgba(255,156,138,0.10)',
    success: '#7BD389', successSoft: 'rgba(123,211,137,0.12)',
    shadow: 'rgba(0,0,0,0.55)',
    green: '#6A9F3E', yellow: '#DCA928', orange: '#C85F24', blue: '#477EAB',
    ink: '#FFF3DC', paperFill: '#22324B', pencil: '#DCA928', pencilDark: '#B88A16', rubber: '#E58FA8',
    envelope: '#DCA928', envelopeFlap: '#C49420', ruler: '#477EAB', rulerMark: '#C3E4FF',
  },
};
export type HomeTokens = typeof HOME_TOKENS.light;

const IS_WEB = Platform.OS === 'web';
export const SERIF = IS_WEB ? '"Fraunces", Georgia, serif' : 'Georgia';
export const SANS = IS_WEB ? '"DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' : undefined;

/** Fraunces + DM Sans, the homepage fonts. Safe to call repeatedly. */
export function ensureHomeFonts() {
  if (!IS_WEB || typeof document === 'undefined') return;
  if (document.getElementById('aivorah-landing-fonts')) return;
  const link = document.createElement('link');
  link.id = 'aivorah-landing-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap';
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

/** Responsive helpers: gutters and content caps. */
export function useAuthLayout() {
  const { width, height } = useWindowDimensions();
  const gutter = IS_WEB
    ? (width < 640 ? 16 : width < 1200 ? 24 : 40)
    : (width < 640 ? 16 : width < 1024 ? 24 : width >= 1920 ? 56 : 32);
  const maxContent = width >= 1920 ? 1440 : 1200;
  const headingSize = width < 640 ? 30 : width < 1024 ? 36 : width >= 1920 ? 52 : 44;
  return { width, height, gutter, maxContent, headingSize, isWide: width >= 1024, isTablet: width >= 640, isTV: width >= 1920 };
}

/** True when the visitor asked the OS/browser for reduced motion. */
export function useReducedMotion() {
  const [reduce, setReduce] = useState(() => {
    if (IS_WEB && typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  useEffect(() => {
    if (IS_WEB) return;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { if (alive) setReduce(!!v); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return reduce;
}

/** Web-only CSS transition for colour changes (theme switch, selection). */
export function colorTransition(ms = 200): any {
  return IS_WEB ? { transitionProperty: 'background-color, border-color, color, box-shadow', transitionDuration: `${ms}ms`, transitionTimingFunction: 'ease' } : null;
}

// ── Web focus ring (Pressable on react-native-web reports `focused`) ─────────
export function focusRing(t: HomeTokens, focused?: boolean): any {
  if (!IS_WEB) return null;
  return focused
    ? { outlineStyle: 'solid', outlineWidth: 3, outlineColor: t.focus, outlineOffset: 2 }
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

// ── Brand: text-only serif wordmark, as on the homepage ──────────────────────
export function BrandMark({ size = 28 }: { size?: number }) {
  const { t } = useHomeTheme();
  return (
    <Text accessibilityRole="header" accessibilityLabel="Aivorah"
      style={{ fontFamily: SERIF, fontSize: size, fontWeight: '600', color: t.heading, letterSpacing: -0.4, ...colorTransition() }}>
      Aivorah
    </Text>
  );
}

// ── Sun / moon switch (same control as the homepage) ─────────────────────────
export function ThemeSwitch() {
  const { mode, t, toggle } = useHomeTheme();
  const { isTV } = useAuthLayout();
  const dark = mode === 'dark';
  const w = isTV ? 100 : 84, h = isTV ? 50 : 42;
  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: dark }}
      style={(s: any) => [{
        width: w, height: h, borderRadius: 999, borderWidth: 1.5, borderColor: t.heading,
        backgroundColor: t.card, flexDirection: 'row', alignItems: 'center', padding: 3, ...colorTransition(),
      }, focusRing(t, s.focused)]}
    >
      <View style={{
        position: 'absolute', top: 3, bottom: 3, left: 3, width: (w - 9) / 2, borderRadius: 999,
        backgroundColor: dark ? t.primary : t.orange,
        transform: [{ translateX: dark ? (w - 9) / 2 : 0 }],
        ...(IS_WEB ? { transitionProperty: 'transform, background-color', transitionDuration: '200ms', transitionTimingFunction: 'ease' } as any : null),
      }} />
      <View style={{ flex: 1, alignItems: 'center' }}><Feather name="sun" size={isTV ? 21 : 18} color={dark ? t.heading : '#FFFFFF'} /></View>
      <View style={{ flex: 1, alignItems: 'center' }}><Feather name="moon" size={isTV ? 21 : 18} color={dark ? t.onPrimary : t.heading} /></View>
    </Pressable>
  );
}

// ── Page shell: ivory / navy page, header, scrolling body ────────────────────
export function AuthShell({
  children, onBack, backLabel = 'Back to home', backIcon = 'home', backStyle = 'link', headerRight, contentStyle, center = true, contentMaxWidth,
}: {
  children: React.ReactNode;
  /** Wider native content area than the default 1200/1440px cap. */
  contentMaxWidth?: number;
  onBack?: () => void;
  backLabel?: string;
  backIcon?: string;
  /** 'link' = icon + text; 'pill' = outlined button. */
  backStyle?: 'link' | 'pill';
  headerRight?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Vertically centre the content when it is shorter than the screen. */
  center?: boolean;
  /** Kept for callers of the previous design; the page is always plain now. */
  backdrop?: 'full' | 'plain';
}) {
  const { t } = useHomeTheme();
  const { gutter, maxContent, isTablet, isTV } = useAuthLayout();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, ...colorTransition() }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: isTablet ? 48 : 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexGrow: 1, width: '100%', maxWidth: IS_WEB ? undefined : Math.max(maxContent, contentMaxWidth ?? 0) + gutter * 2, alignSelf: 'center', paddingHorizontal: gutter }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: isTablet ? 18 : 12, paddingBottom: isTablet ? 18 : 12 }}>
            <BrandMark size={isTV ? 36 : isTablet ? 30 : 26} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: isTablet ? 12 : 8 }}>
              {headerRight}
              {onBack && (
                <Pressable
                  onPress={onBack}
                  accessibilityRole="button"
                  accessibilityLabel={backLabel}
                  style={(s: any) => [{
                    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44,
                    paddingHorizontal: isTablet ? 14 : 10, borderRadius: 999,
                    borderWidth: backStyle === 'pill' ? 1.5 : 0, borderColor: t.heading,
                    backgroundColor: s.pressed || s.hovered ? t.primarySoft : 'transparent', ...colorTransition(),
                  }, focusRing(t, s.focused)]}
                >
                  <Feather name={backIcon as any} size={isTablet ? 17 : 16} color={t.heading} />
                  {isTablet && <Text style={{ fontFamily: SANS, fontSize: isTV ? 18 : 15, fontWeight: '600', color: t.heading }}>{backLabel}</Text>}
                </Pressable>
              )}
              <ThemeSwitch />
            </View>
          </View>
          <View style={[{ flexGrow: 1, justifyContent: center ? 'center' : 'flex-start', paddingTop: isTablet ? 12 : 6 }, contentStyle]}>{children}</View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Colourful shapes that peek out behind a card (kept out of the form) ─────
const BLOB = 'M58 2C80 6 98 24 98 48C98 74 82 96 56 98C30 100 6 86 3 60C0 32 30 -2 58 2Z';
function Blob({ color, style }: { color: string; style: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ position: 'absolute' }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><Path d={BLOB} fill={color} /></Svg>
    </View>
  );
}

/** Wraps a card with the homepage's asymmetric green / yellow / orange / blue shapes. */
export function ShapeFrame({ children, style, compact }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; compact?: boolean }) {
  const { t } = useHomeTheme();
  const { isTablet } = useAuthLayout();
  const k = compact || !isTablet ? 0.55 : 1;
  return (
    <View style={[{ position: 'relative', width: '100%', alignItems: 'center' }, style]}>
      <Decorative style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Blob color={t.orange} style={{ top: -26 * k, right: -34 * k, width: '30%', height: '52%' }} />
        <Blob color={t.green} style={{ top: '18%', left: -30 * k, width: '20%', height: '56%' }} />
        <Blob color={t.yellow} style={{ bottom: -24 * k, left: -18 * k, width: '24%', height: '34%' }} />
        <Blob color={t.blue} style={{ bottom: -20 * k, right: -26 * k, width: '20%', height: '44%' }} />
      </Decorative>
      {children}
    </View>
  );
}

// ── Building blocks ──────────────────────────────────────────────────────────
export function AuthCard({ children, maxWidth = 480, style }: { children: React.ReactNode; maxWidth?: number; style?: StyleProp<ViewStyle> }) {
  const { t } = useHomeTheme();
  const { isTablet, isTV } = useAuthLayout();
  return (
    <View style={[{
      width: '100%', maxWidth, backgroundColor: t.card, borderWidth: 1, borderColor: t.line, borderRadius: 22,
      paddingHorizontal: isTV ? 44 : isTablet ? 32 : 18, paddingVertical: isTV ? 40 : isTablet ? 28 : 20,
      shadowColor: t.shadow, shadowOpacity: 1, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, elevation: 5,
      ...colorTransition(),
    }, style]}>
      {children}
    </View>
  );
}

/** Previous design's framed panel; now the same card as everywhere else. */
export function FramedPanel({ children, maxWidth = 1000, style }: { children: React.ReactNode; maxWidth?: number; style?: StyleProp<ViewStyle> }) {
  return <AuthCard maxWidth={maxWidth} style={[{ alignSelf: 'center' }, style]}>{children}</AuthCard>;
}

export function AuthHeading({ title, subtitle, align = 'center', size }: {
  title: string; subtitle?: string; align?: 'center' | 'left';
  /** Kept for callers of the previous design (decorative leaf rule). */
  ornament?: boolean; size?: number;
}) {
  const { t } = useHomeTheme();
  const { headingSize } = useAuthLayout();
  const fs = size ?? headingSize;
  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start', marginBottom: 18 }}>
      <Text accessibilityRole="header" style={{ fontFamily: SERIF, fontSize: fs, lineHeight: fs * 1.08, fontWeight: '600', color: t.heading, letterSpacing: -0.6, textAlign: align }}>{title}</Text>
      {!!subtitle && <Text style={{ fontFamily: SANS, fontSize: fs >= 44 ? 18 : 16, lineHeight: fs >= 44 ? 26 : 23, color: t.text, marginTop: 8, textAlign: align, maxWidth: 420 }}>{subtitle}</Text>}
    </View>
  );
}

export function FieldLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const { t } = useHomeTheme();
  const { isTV } = useAuthLayout();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <Text style={{ fontFamily: SANS, fontSize: isTV ? 17 : 14.5, fontWeight: '600', color: t.heading }}>{children}</Text>
      {right}
    </View>
  );
}

/** Labelled text field: label above, 48px, 12px corners, distinct focus / invalid. */
export function AuthField({ label, labelRight, invalid, rightEl, style, ...input }: Omit<TextInputProps, 'style'> & {
  label: string; labelRight?: React.ReactNode; invalid?: boolean; rightEl?: React.ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const { t } = useHomeTheme();
  const { isTV } = useAuthLayout();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <FieldLabel right={labelRight}>{label}</FieldLabel>
      <View style={{
        flexDirection: 'row', alignItems: 'center', minHeight: isTV ? 56 : 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14,
        backgroundColor: t.input, borderColor: invalid ? t.danger : focused ? t.focus : t.inputLine, ...colorTransition(),
        ...(IS_WEB && focused ? { boxShadow: `0 0 0 3px ${t.focus}33` } as any : null),
      }}>
        <TextInput
          {...input}
          accessibilityLabel={label}
          placeholderTextColor={t.placeholder}
          onFocus={(e) => { setFocused(true); input.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); input.onBlur?.(e); }}
          style={[{ flex: 1, minWidth: 0, fontFamily: SANS, fontSize: isTV ? 18 : 16, color: t.text, paddingVertical: 11 }, IS_WEB ? ({ outlineStyle: 'none' } as any) : null]}
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

export function PrimaryButton({ label, onPress, loading, disabled, icon, style, testID }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean; icon?: string; style?: StyleProp<ViewStyle>; testID?: string;
  /** Kept for callers of the previous design; every primary action is now the same filled button. */
  tone?: 'primary' | 'accent';
}) {
  const { t } = useHomeTheme();
  const { isTV } = useAuthLayout();
  const off = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={(s: any) => [{
        minHeight: isTV ? 58 : 50, borderRadius: 999, backgroundColor: s.hovered && !off ? t.primaryHover : t.primary,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingHorizontal: 22, opacity: disabled && !loading ? 0.5 : 1,
        transform: [{ translateY: s.pressed ? 1 : 0 }, { scale: s.pressed ? 0.985 : 1 }],
        ...colorTransition(150),
      }, focusRing(t, s.focused), style]}
    >
      {loading ? <ActivityIndicator color={t.onPrimary} size="small" /> : (
        <>
          <Text style={{ fontFamily: SANS, fontSize: isTV ? 19 : 16.5, fontWeight: '700', color: t.onPrimary }}>{label}</Text>
          {icon && <Feather name={icon as any} size={17} color={t.onPrimary} />}
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
  const { isTV } = useAuthLayout();
  const off = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={off}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState ?? { disabled: !!off, busy: !!loading }}
      style={(s: any) => [{
        minHeight: isTV ? 58 : 50, borderRadius: 999, borderWidth: 1.5, borderColor: t.heading,
        backgroundColor: s.pressed || (s.hovered && !off) ? t.primarySoft : t.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingHorizontal: 18, opacity: off && !loading ? 0.5 : 1, ...colorTransition(150),
      }, focusRing(t, s.focused), style]}
    >
      {loading ? <ActivityIndicator color={t.heading} size="small" /> : (leading ?? (icon ? <Feather name={icon as any} size={17} color={t.heading} /> : null))}
      <Text style={{ fontFamily: SANS, fontSize: isTV ? 19 : 16, fontWeight: '700', color: t.heading }}>{label}</Text>
    </Pressable>
  );
}

export function OrDivider({ label = 'or continue with email' }: { label?: string }) {
  const { t } = useHomeTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 14 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
      <Text style={{ fontFamily: SANS, fontSize: 14, color: t.muted }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: t.line }} />
    </View>
  );
}

/** Status message. Fades in when it appears (not on theme changes). */
export function Notice({ kind, children, style }: { kind: 'error' | 'success' | 'info' | 'warn'; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { t } = useHomeTheme();
  const reduce = useReducedMotion();
  const [fade] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return;
    Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: !IS_WEB }).start();
  }, [fade, reduce]);
  const map = {
    error: { fg: t.danger, bg: t.dangerSoft, line: t.danger + '66', icon: 'alert-circle' },
    success: { fg: t.success, bg: t.successSoft, line: t.success + '66', icon: 'check-circle' },
    info: { fg: t.heading, bg: t.infoBg, line: t.infoLine, icon: 'info' },
    warn: { fg: t.accent, bg: t.accentSoft, line: t.accent + '66', icon: 'alert-triangle' },
  }[kind];
  return (
    <Animated.View accessibilityLiveRegion="polite" style={[{
      flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14,
      backgroundColor: map.bg, borderWidth: 1, borderColor: map.line, marginBottom: 14, opacity: fade, ...colorTransition(),
    }, style]}>
      <Feather name={map.icon as any} size={16} color={map.fg} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        {typeof children === 'string'
          ? <Text style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 19, color: kind === 'info' ? t.text : map.fg }}>{children}</Text>
          : children}
      </View>
    </Animated.View>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void; tone?: 'accent' | 'primary' }) {
  const { t } = useHomeTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={6} style={(s: any) => [{ borderRadius: 4 }, focusRing(t, s.focused)]}>
      <Text style={{ fontFamily: SANS, fontSize: 15, fontWeight: '700', color: t.link, textDecorationLine: 'underline' }}>{label}</Text>
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
        flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5,
        borderColor: selected ? t.primary : s.hovered ? t.heading : t.inputLine,
        backgroundColor: selected ? t.primary : t.input, ...colorTransition(),
      }, focusRing(t, s.focused)]}
    >
      {selected && <Feather name="check" size={14} color={t.onPrimary} />}
      <Text style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: '600', color: selected ? t.onPrimary : t.text }}>{label}</Text>
    </Pressable>
  );
}

/** Role tile: icon + label; the active role is filled, outlined and checked. */
export function RoleTile({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: (color: string) => React.ReactNode }) {
  const { t } = useHomeTheme();
  const { isTablet } = useAuthLayout();
  const fg = selected ? t.onPrimary : t.heading;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
      style={(s: any) => [{
        flexGrow: 1, flexBasis: 0, minWidth: 92, alignItems: 'center', justifyContent: 'center', gap: 4,
        minHeight: isTablet ? 66 : 58, paddingHorizontal: 10, paddingVertical: 8,
        borderRadius: 16, borderWidth: 2, borderColor: selected ? t.primary : s.hovered ? t.heading : t.line,
        backgroundColor: selected ? t.primary : t.card, ...colorTransition(),
      }, focusRing(t, s.focused)]}
    >
      {icon?.(fg)}
      <Text style={{ fontFamily: SANS, fontSize: 15, fontWeight: '700', color: fg }}>{label}</Text>
      {selected && (
        <View testID="role-tile-check" style={{
          position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: 11, backgroundColor: t.success,
          borderWidth: 2, borderColor: t.card, alignItems: 'center', justifyContent: 'center',
        }}>
          <Feather name="check" size={12} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

/** Fades a group in when it first appears (e.g. role-specific fields). */
export function FadeIn({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const [v] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return;
    Animated.timing(v, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: !IS_WEB }).start();
  }, [v, reduce]);
  return <Animated.View style={[{ opacity: v }, style]}>{children}</Animated.View>;
}

// ════════════════════════════════════════════════════════════════════════════
// Decorative artwork (react-native-svg, coloured by tokens)
// ════════════════════════════════════════════════════════════════════════════

/** Yellow pencil with a pink eraser, drawn on a slant. */
export function PencilArt({ width = 90 }: { width?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={width} height={width} viewBox="0 0 120 120">
      <G transform="rotate(-38 60 60)">
        <Rect x={18} y={50} width={70} height={20} rx={3} fill={t.pencil} />
        <Rect x={18} y={50} width={70} height={6} fill={t.pencilDark} opacity={0.55} />
        <Rect x={8} y={50} width={12} height={20} rx={3} fill={t.rubber} />
        <Rect x={18} y={49} width={6} height={22} fill="#B9BEC7" />
        <Path d="M88 50 L108 60 L88 70 Z" fill="#F3D6A6" />
        <Path d="M101 56.5 L108 60 L101 63.5 Z" fill={t.ink} />
      </G>
    </Svg>
  );
}

/** Paper plane outline with a dashed trail. */
export function PlaneArt({ width = 110 }: { width?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={width} height={width * (110 / 130)} viewBox="0 0 130 110">
      <Path d="M8 104 C26 92 34 84 44 70" fill="none" stroke={t.ink} strokeWidth={2.2} strokeDasharray="4 6" strokeLinecap="round" opacity={0.55} />
      <Path d="M50 58 L124 8 L94 92 L76 66 Z" fill={t.paperFill} stroke={t.ink} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M50 58 L124 8 L76 66" fill="none" stroke={t.ink} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M76 66 L72 86 L84 74" fill="none" stroke={t.ink} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}

/** Blue ruler — Create Account. */
export function RulerArt({ width = 150 }: { width?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={width} height={width * 0.42} viewBox="0 0 200 84">
      <G transform="rotate(-16 100 42)">
        <Rect x={10} y={26} width={180} height={34} rx={6} fill={t.ruler} />
        {Array.from({ length: 17 }).map((_, i) => (
          <Path key={i} d={`M${22 + i * 10} 26 V${i % 2 ? 36 : 42}`} stroke={t.rulerMark} strokeWidth={2} strokeLinecap="round" />
        ))}
      </G>
    </Svg>
  );
}

/** Envelope whose flap opens once (Check your inbox). */
export function EnvelopeArt({ width = 120, animate = true }: { width?: number; animate?: boolean }) {
  const { t } = useHomeTheme();
  const reduce = useReducedMotion();
  const [open] = useState(() => new Animated.Value(animate && !reduce ? 0 : 1));
  useEffect(() => {
    if (!animate || reduce) return;
    Animated.timing(open, { toValue: 1, duration: 700, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: !IS_WEB }).start();
  }, [open, animate, reduce]);
  const flapScale = open.interpolate({ inputRange: [0, 1], outputRange: [1, -1] });
  const letterRise = open.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 0.16] });
  const h = width * 0.78;
  return (
    <View style={{ width, height: h }}>
      {/* letter */}
      <Animated.View style={{ position: 'absolute', left: width * 0.18, top: h * 0.28, width: width * 0.64, height: h * 0.5, transform: [{ translateY: letterRise }] }}>
        <Svg width="100%" height="100%" viewBox="0 0 64 40">
          <Rect x={0} y={0} width={64} height={40} rx={3} fill={t.paperFill} stroke={t.ink} strokeWidth={1.4} />
          <Path d="M10 12 H54 M10 20 H46 M10 28 H38" stroke={t.ink} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
        </Svg>
      </Animated.View>
      {/* body */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: h * 0.36, bottom: 0 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
          <Path d="M2 4 L50 36 L98 4 V58 H2 Z" fill={t.envelope} stroke={t.ink} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M2 58 L38 28 M98 58 L62 28" stroke={t.ink} strokeWidth={1.4} opacity={0.5} />
        </Svg>
      </View>
      {/* flap, hinged at its top edge */}
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: h * 0.36, height: h * 0.36, transform: [{ translateY: -h * 0.18 }, { scaleY: flapScale }, { translateY: h * 0.18 }] }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 36" preserveAspectRatio="none">
          <Path d="M2 1 L50 34 L98 1 Z" fill={t.envelopeFlap} stroke={t.ink} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Folded paper (onboarding corner). */
export function FoldedPaperArt({ width = 120 }: { width?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={width} height={width * 0.75} viewBox="0 0 120 90">
      <Path d="M8 58 L60 34 L112 52 L62 84 Z" fill={t.blue} stroke={t.ink} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M60 34 L62 84" stroke={t.ink} strokeWidth={1.6} opacity={0.6} />
      <Path d="M8 58 L52 18 L60 34 Z" fill={t.orange} stroke={t.ink} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M80 14 L88 4 M92 22 L104 16 M70 10 L72 0" stroke={t.yellow} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** Paper plane that glides a short distance once (Sign In). */
export function GlidingPlane({ width = 110 }: { width?: number }) {
  const reduce = useReducedMotion();
  const [v] = useState(() => new Animated.Value(reduce ? 1 : 0));
  useEffect(() => {
    if (reduce) return;
    Animated.timing(v, { toValue: 1, duration: 1100, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: !IS_WEB }).start();
  }, [v, reduce]);
  const tx = v.interpolate({ inputRange: [0, 1], outputRange: [-36, 0] });
  const ty = v.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateX: tx }, { translateY: ty }] }}>
      <PlaneArt width={width} />
    </Animated.View>
  );
}

/** Small ink sparkle lines beside an illustration. */
export function Sparks({ size = 34 }: { size?: number }) {
  const { t } = useHomeTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34">
      <Path d="M4 20 L12 22 M10 6 L15 14 M24 2 L22 11" stroke={t.ink} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

/** Shape behind the student onboarding page corners. */
export function CornerShape({ color, size = 160, flip }: { color: string; size?: number; flip?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      <Path d="M0 0 H70 C88 18 76 40 58 52 C38 66 30 86 0 100 Z" fill={color} />
    </Svg>
  );
}

