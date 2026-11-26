import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { darkColors, lightColors, studentDarkColors, studentLightColors, teacherDarkColors, teacherLightColors, parentDarkColors, parentLightColors, schoolAdminDarkColors, schoolAdminLightColors, companyAdminDarkColors, companyAdminLightColors, AppColors } from '../theme';
import { applyStudentAccent } from '../theme/studentAccent';
import { applyDocumentChrome } from '../utils/documentChrome';

export type ThemeMode = 'dark' | 'light' | 'auto';

const THEME_KEY = '@ai_mentor_theme';
const THEME_VERSION_KEY = '@ai_mentor_theme_v';
const THEME_VERSION = '4'; // bump to force reset to light default

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: AppColors;
  isDark: boolean;
  /** Set only inside the Student Portal (StudentThemeProvider). */
  portal?: 'student' | 'teacher' | 'parent' | 'schoolAdmin' | 'companyAdmin';
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  setThemeMode: () => {},
  colors: lightColors,
  isDark: false,
});

// Auto mode: time-based — Light 6AM–6PM, Dark 6PM–6AM
function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 18;
}

function useSystemDark(): boolean {
  const [dark, setDark] = useState<boolean>(isNightTime);

  useEffect(() => {
    // Re-check every minute so it switches exactly at 6AM/6PM
    const interval = setInterval(() => setDark(isNightTime()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return dark;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemIsDark = useSystemDark();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      try {
        const ver = await AsyncStorage.getItem(THEME_VERSION_KEY);
        if (ver !== THEME_VERSION) {
          // One-time reset to the new light default
          await AsyncStorage.setItem(THEME_VERSION_KEY, THEME_VERSION);
          await AsyncStorage.setItem(THEME_KEY, 'light');
          setThemeModeState('light');
          return;
        }
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light' || saved === 'auto') {
          setThemeModeState(saved);
        }
      } catch {}
    })();
  }, []);

  function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  }

  const { colors, isDark } = useMemo(() => {
    const dark = themeMode === 'auto' ? systemIsDark : themeMode === 'dark';
    return { colors: dark ? darkColors : lightColors, isDark: dark };
  }, [themeMode, systemIsDark]);

  // Web: document background tracks the theme (no dark band behind light screens).
  useEffect(() => {
    // The Student Portal paints its own document background (StudentThemeProvider).
    if (Platform.OS !== 'web') return;
    const inStudentPortal = typeof document !== 'undefined' && !!document.body?.getAttribute('data-av-portal');
    if (!inStudentPortal) applyDocumentChrome(colors.bgDark);
  }, [colors.bgDark]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ── Student Portal theme ──────────────────────────────────────────────────
// Re-provides the theme with the Student Portal palette and, on web, turns on
// the portal's fonts (Sora / Baloo 2 / Karla / Quicksand / Lora) through CSS
// variables scoped to body[data-av-portal="student"]. Theme mode, Auto and
// persistence stay with the parent ThemeProvider, so switching keeps the route
// and screen state.
const STUDENT_FONTS_ID = 'aivorah-student-fonts';
const STUDENT_CSS_ID = 'aivorah-student-css';
// Student Portal: Fraunces headings + DM Sans UI (Website Redesign, Phase 3). The
// other portals' families stay in the list until their own phases.
const STUDENT_FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Baloo+2:wght@500;600;700;800&family=Karla:wght@400;500;600;700&family=Lora:wght@400;500;600&family=Quicksand:wght@500;600;700&family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap';
const STUDENT_CSS = [
  'body[data-av-portal="student"]{--av-heading:"Fraunces";--av-body:"DM Sans";--av-nav:"DM Sans";--av-card:"DM Sans";--av-reading:"Lora";font-variant-numeric:tabular-nums}',
  'body[data-av-portal="student"] :focus-visible{outline:3px solid var(--av-focus,#1D5DB5)!important;outline-offset:2px}',
  'body[data-av-portal="student"][data-av-theme="dark"]{--av-focus:#8DD1FF}',
  'body[data-av-portal="student"] input::placeholder,body[data-av-portal="student"] textarea::placeholder{opacity:.75}',
  // Teacher Portal: Sora throughout, indigo / periwinkle focus ring.
  'body[data-av-portal="teacher"]{--av-heading:"Sora";--av-body:"Sora";--av-nav:"Sora";--av-card:"Sora";--av-reading:"Lora";font-variant-numeric:tabular-nums}',
  'body[data-av-portal="teacher"] :focus-visible{outline:2px solid var(--av-focus,#075D75)!important;outline-offset:2px}',
  'body[data-av-portal="teacher"][data-av-theme="dark"]{--av-focus:#9ADBE9}',
  // Parent Portal: Sora headings, Inter body, ocean / pale-cyan focus ring.
  'body[data-av-portal="parent"]{--av-heading:"Sora";--av-body:"Inter";--av-nav:"Inter";--av-card:"Inter";--av-reading:"Lora";font-variant-numeric:tabular-nums}',
  'body[data-av-portal="parent"] :focus-visible{outline:2px solid var(--av-focus,#075D75)!important;outline-offset:2px}',
  'body[data-av-portal="parent"][data-av-theme="dark"]{--av-focus:#9ADBE9}',
  // School Admin Portal: Inter throughout, denim focus ring.
  'body[data-av-portal="schoolAdmin"]{--av-heading:"Inter";--av-body:"Inter";--av-nav:"Inter";--av-card:"Inter";--av-reading:"Lora";font-variant-numeric:tabular-nums}',
  'body[data-av-portal="schoolAdmin"] :focus-visible{outline:2px solid var(--av-focus,#2F5E9E)!important;outline-offset:2px}',
  'body[data-av-portal="schoolAdmin"][data-av-theme="dark"]{--av-focus:#8FB6EA}',
  // Company Admin Portal: same shared sans throughout (tables included), denim focus.
  'body[data-av-portal="companyAdmin"]{--av-heading:"Inter";--av-body:"Inter";--av-nav:"Inter";--av-card:"Inter";--av-reading:"Inter";font-variant-numeric:tabular-nums}',
  'body[data-av-portal="companyAdmin"] :focus-visible{outline:2px solid var(--av-focus,#2F5E9E)!important;outline-offset:2px}',
  'body[data-av-portal="companyAdmin"][data-av-theme="dark"]{--av-focus:#8FB6EA}',
].join(' ');

// react-native-web gives every Text / TextInput a base class with the system
// font stack. Point those rules at --av-body (falling back to the original
// stack) so unstyled text picks up Karla inside the Student Portal only.
function routeBaseFontsThroughVar() {
  if (typeof document === 'undefined') return;
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      const r = rule as CSSStyleRule;
      const ff = r.style?.fontFamily;
      if (!r.selectorText || !ff || !r.selectorText.startsWith('.css-')) continue;
      if (ff.includes('-apple-system') && !ff.includes('--av-body')) {
        r.style.fontFamily = `var(--av-body, ${ff})`;
      }
    }
  }
}

export function StudentThemeProvider({ children }: { children: ReactNode }) {
  return <PortalThemeProvider portal="student">{children}</PortalThemeProvider>;
}

export function ParentThemeProvider({ children }: { children: ReactNode }) {
  return <PortalThemeProvider portal="parent">{children}</PortalThemeProvider>;
}

export function SchoolAdminThemeProvider({ children }: { children: ReactNode }) {
  return <PortalThemeProvider portal="schoolAdmin">{children}</PortalThemeProvider>;
}

export function CompanyAdminThemeProvider({ children }: { children: ReactNode }) {
  return <PortalThemeProvider portal="companyAdmin">{children}</PortalThemeProvider>;
}

export function TeacherThemeProvider({ children }: { children: ReactNode }) {
  return <PortalThemeProvider portal="teacher">{children}</PortalThemeProvider>;
}

const PORTAL_COLORS = {
  student: { light: studentLightColors, dark: studentDarkColors },
  teacher: { light: teacherLightColors, dark: teacherDarkColors },
  parent: { light: parentLightColors, dark: parentDarkColors },
  schoolAdmin: { light: schoolAdminLightColors, dark: schoolAdminDarkColors },
  companyAdmin: { light: companyAdminLightColors, dark: companyAdminDarkColors },
};

function PortalThemeProvider({ portal, children }: { portal: 'student' | 'teacher' | 'parent' | 'schoolAdmin' | 'companyAdmin'; children: ReactNode }) {
  const parent = useContext(ThemeContext);
  const colors = parent.isDark ? PORTAL_COLORS[portal].dark : PORTAL_COLORS[portal].light;
  // Student screens' accent constants follow Light / Dark; set before children render.
  if (portal === 'student') applyStudentAccent(parent.isDark);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!document.getElementById(STUDENT_FONTS_ID)) {
      const link = document.createElement('link');
      link.id = STUDENT_FONTS_ID;
      link.rel = 'stylesheet';
      link.href = STUDENT_FONTS_HREF;
      document.head.appendChild(link);
    }
    if (!document.getElementById(STUDENT_CSS_ID)) {
      const style = document.createElement('style');
      style.id = STUDENT_CSS_ID;
      style.textContent = STUDENT_CSS;
      document.head.appendChild(style);
    }
    document.body.setAttribute('data-av-portal', portal);
    routeBaseFontsThroughVar();
    const t = setTimeout(routeBaseFontsThroughVar, 1500);
    return () => {
      clearTimeout(t);
      document.body.removeAttribute('data-av-portal');
      document.body.removeAttribute('data-av-font'); // font preset is per signed-in portal
      document.body.removeAttribute('data-av-theme');
    };
  }, [portal]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.body.setAttribute('data-av-theme', parent.isDark ? 'dark' : 'light');
    applyDocumentChrome(colors.bgDark);
    return () => applyDocumentChrome(parent.colors.bgDark);
  }, [parent.isDark, colors.bgDark, parent.colors.bgDark]);

  const value = useMemo(
    () => ({ ...parent, colors, portal }),
    [parent, colors, portal],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
