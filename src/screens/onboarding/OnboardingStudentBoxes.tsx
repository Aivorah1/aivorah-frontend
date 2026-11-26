/**
 * OnboardingStudentBoxes.tsx
 * Student onboarding — all sections shown as cards on a single page
 * (About You, Curriculum, School, Your Grade, Your Avatar, Learning Style).
 * Everything is visible and editable at once; "Complete Setup" saves
 * the profile and finishes onboarding.
 *
 * Styled with the homepage light/dark tokens (../auth/authTheme); the sun/moon
 * switch only swaps tokens, so nothing typed or selected is lost.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Platform, Modal, useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import PROFILE_SERVER_URL from '../../config/profileServerUrl';
import { AVATAR_STYLES } from '../../constants/avatarStyles';
import {
  DatePickerInput, CURRICULA, getGradesForCurriculum, GENDERS, LEARNING_STYLES,
} from './OnboardingScreen';
import {
  AutocompleteField, CardHeader, BBox, fetchCitySuggestions, fetchSchoolSuggestions, locateFull,
  SelectField, COUNTRIES, INDIA_STATES, INDIA_CITIES,
} from './OnboardingSharedFields';
import { computeStudentCompletion } from './utils/studentCompletion';
import { checkDobGradeConsistency } from './utils/dobGradeValidation';
import { resolveOnboardingSaveResult } from './utils/resolveOnboardingSaveResult';
import {
  HomeThemeProvider, useHomeTheme, ThemeSwitch, SelectChip, HomeTokens, SERIF, SANS, Decorative,
  FoldedPaperArt, PlaneArt, CornerShape, colorTransition,
} from '../auth/authTheme';

const GRADE_GROUPS = [
  { label: 'Early Years', grades: ['Nursery', 'LKG', 'UKG'] },
  { label: 'Primary', grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
  { label: 'Middle School', grades: ['Grade 6', 'Grade 7', 'Grade 8'] },
  { label: 'Senior School', grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] },
];
const GROUP_ICONS: Record<string, string> = {
  'Early Years': 'sun', Primary: 'book-open', 'Middle School': 'layers', 'Senior School': 'award',
};

function getAge(dobStr: string): number | null {
  const parts = dobStr.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy || yyyy < 1900) return null;
  const birth = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

type Layout = 'mobile' | 'tablet' | 'wide';

function CompletionBar({ pct, t, width = 150 }: { pct: number; t: HomeTokens; width?: number }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width, height: 10, borderRadius: 999, backgroundColor: t.line, overflow: 'hidden' }}>
        <View style={{
          width: `${v}%`, height: '100%', borderRadius: 999, backgroundColor: t.success,
          ...(Platform.OS === 'web' ? { transitionProperty: 'width', transitionDuration: '450ms', transitionTimingFunction: 'ease' } as any : null),
        }} />
      </View>
      <Text style={{ fontFamily: SANS, fontSize: 14, fontWeight: '700', color: t.heading, minWidth: 38 }}>{v}%</Text>
    </View>
  );
}

export default function OnboardingStudentBoxes() {
  return (
    <HomeThemeProvider>
      <StudentOnboarding />
    </HomeThemeProvider>
  );
}

function StudentOnboarding() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useHomeTheme();
  const { width } = useWindowDimensions();
  const layout: Layout = width >= 1024 ? 'wide' : width >= 640 ? 'tablet' : 'mobile';
  // The shared onboarding fields read these app-theme keys; feed them the tokens.
  const colors = useMemo(() => ({
    bgDark: t.input, cardDark: t.card, borderColor: t.inputLine, textMain: t.text, textMuted: t.muted, textDim: t.placeholder,
  }), [t]);
  const styles = useMemo(() => makeStyles(t, layout), [t, layout]);
  const mobileLayout = layout === 'mobile';

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [locating, setLocating] = useState(false);
  const cityBBoxCache = useRef<Map<string, BBox | null>>(new Map());

  // Form state
  const [fullName, setFullName] = useState(user?.name || '');
  const [dob, setDob] = useState((user as any)?.dob || '');
  const [gender, setGender] = useState((user as any)?.gender || '');
  const [curriculum, setCurriculum] = useState((user as any)?.curriculum || '');
  const [school, setSchool] = useState((user as any)?.school || '');
  const [city, setCity] = useState((user as any)?.location || '');
  const [stateProv, setStateProv] = useState((user as any)?.state || '');
  const [country, setCountry] = useState((user as any)?.country || 'India');
  const [grade, setGrade] = useState((user as any)?.grade || '');
  const [avatarStyle, setAvatarStyle] = useState((user as any)?.avatarStyle || 'default');
  const [learningStyle, setLearningStyle] = useState((user as any)?.learningStyle || '');

  // Saved picks can land after mount (profile loads async); adopt them unless the student already chose.
  const savedAvatar: string | undefined = (user as any)?.avatarStyle;
  const savedLearningStyle: string | undefined = (user as any)?.learningStyle;
  const [seenSaved, setSeenSaved] = useState({ avatar: savedAvatar, learning: savedLearningStyle });
  if (seenSaved.avatar !== savedAvatar || seenSaved.learning !== savedLearningStyle) {
    setSeenSaved({ avatar: savedAvatar, learning: savedLearningStyle });
    if (savedAvatar && avatarStyle === 'default') setAvatarStyle(savedAvatar);
    if (savedLearningStyle && !learningStyle) setLearningStyle(savedLearningStyle);
  }

  // ── Per-card completion ────────────────────────────
  const {
    aboutYouDone, curriculumDone, schoolGradeDone, avatarDone, learningStyleDone, requiredDone, completionPct,
  } = computeStudentCompletion({ fullName, dob, curriculum, school, grade, avatarStyle, learningStyle });

  // Web: trap the browser Back button (#171 — this screen previously had no back-button
  // handling at all, so pressing browser Back silently signed the student out with no
  // confirmation). Routes to the same "Return to home page?" dialog as the in-page Back button.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    window.history.pushState(null, '', window.location.href);
    const onPop = () => {
      window.history.pushState(null, '', window.location.href);
      setShowLeaveConfirm(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Saves whatever fields are filled in so far WITHOUT marking onboarding complete —
  // used by the "Save & Exit" leave-confirm path so partial progress isn't lost just
  // because the student hasn't finished every required field yet.
  async function saveProgress() {
    try {
      const email = user?.email || '';
      const profileRes = await fetch(`${PROFILE_SERVER_URL}/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, role: 'student',
          name: fullName.trim() || undefined,
          school: school || undefined,
          location: city || undefined,
          grade: grade.trim() || undefined,
          curriculum: curriculum.trim() || undefined,
          state: stateProv || undefined,
          country: country || undefined,
          dob: dob || undefined,
          gender: gender || undefined,
          avatarStyle, learningStyle: learningStyle || undefined,
        }),
      });
      if (!profileRes.ok) {
        console.error('[saveProgress] /user/profile failed:', profileRes.status, await profileRes.text().catch(() => ''));
      }
      await fetch(`${PROFILE_SERVER_URL}/user/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, name: fullName.trim() || undefined, role: 'student',
          grade: grade.trim() || undefined, curriculum: curriculum.trim() || undefined,
          school: school || undefined, location: city || undefined,
          state: stateProv || undefined, country: country || undefined,
          avatarStyle, learningStyle: learningStyle || undefined, gender: gender || undefined,
          dob: dob || undefined,
        }),
      }).catch(() => {});
    } catch (e) {
      console.error('[saveProgress] failed:', e);
    }
  }

  const underAge = dob.length >= 10 && getAge(dob) !== null && getAge(dob)! < 14;
  const dobGradeCheck = checkDobGradeConsistency(dob, grade);

  async function handleFinish() {
    if (!requiredDone) {
      setSaveError('Please complete About You, Curriculum, and School & Grade before continuing.');
      return;
    }
    if (!dobGradeCheck.valid) {
      setSaveError(dobGradeCheck.message || 'Your date of birth and grade don\'t match. Please check both.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const email = user?.email || '';

      const body = {
        email,
        role: 'student',
        name: fullName.trim(),
        school,
        location: city,
        complete: true,
        grade: grade.trim(),
        curriculum: curriculum.trim(),
        state: stateProv || undefined,
        country: country || undefined,
        // dob/gender added 2026-08-26 — previously only ever reached the
        // backend via the un-awaited /user/preferences PATCH below, so a
        // failed/slow preferences call silently lost them even though this
        // primary, awaited profile save otherwise succeeded.
        dob: dob || undefined,
        gender: gender || undefined,
        avatarStyle,
        learningStyle: learningStyle || undefined,
      };

      const profileRes = await fetch(`${PROFILE_SERVER_URL}/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!profileRes.ok) {
        const errText = await profileRes.text().catch(() => '');
        throw new Error(`Profile save failed (${profileRes.status}): ${errText.slice(0, 200)}`);
      }
      const saved = await profileRes.json().catch(() => ({}));
      if (!saved.grade || !saved.curriculum) {
        throw new Error('Your profile could not be saved correctly. Please try again.');
      }
      // Trust the server's own onboardingComplete field rather than assuming
      // success from a 200 status — see BUGS_AND_FIXES.md Bug #1.
      const saveResult = resolveOnboardingSaveResult(saved);
      if (!saveResult.ok) {
        throw new Error(saveResult.error);
      }

      fetch(`${PROFILE_SERVER_URL}/user/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: fullName.trim(),
          role: 'student',
          grade: grade.trim(),
          curriculum: curriculum.trim(),
          school,
          location: city,
          state: stateProv || undefined,
          country: country || undefined,
          avatarStyle,
          learningStyle: learningStyle || undefined,
          gender: gender || undefined,
          dob: dob || undefined,
        }),
      }).catch(() => {});

      updateUser({
        name: fullName.trim(),
        school,
        location: city,
        onboardingComplete: saveResult.onboardingComplete,
        avatarStyle,
        learningStyle: learningStyle || undefined,
        gender: gender || undefined,
        dob: dob || undefined,
        state: stateProv || undefined,
        country: country || undefined,
        grade: saved.grade,
        curriculum: saved.curriculum,
      } as any);
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      setSaveError(err?.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }


  const brand = (
    <View style={styles.brand} pointerEvents="none">
      <Text style={styles.logoTxt}>Aivorah</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>Student</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Coloured corner shapes and paper artwork, kept outside the form cards */}
      {layout !== 'mobile' && (
        <>
          <Decorative style={{ position: 'absolute', top: 0, left: 0 }}><CornerShape color={t.yellow} size={layout === 'wide' ? 110 : 80} /></Decorative>
          <Decorative style={{ position: 'absolute', top: 0, right: 0 }}><CornerShape color={t.orange} size={layout === 'wide' ? 96 : 70} flip /></Decorative>
        </>
      )}
      {/* only where there is room beside the centred headline */}
      {width >= 1360 && (
        <>
          <Decorative style={{ position: 'absolute', top: 96, left: 34 }}><FoldedPaperArt width={120} /></Decorative>
          <Decorative style={{ position: 'absolute', top: 104, right: 52 }}><PlaneArt width={96} /></Decorative>
        </>
      )}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.topbar}>
          {layout === 'wide' && <View style={styles.brandCenter} pointerEvents="none">{brand}</View>}
          <TouchableOpacity
            onPress={() => setShowLeaveConfirm(true)}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to home page"
          >
            <Feather name="arrow-left" size={18} color={t.heading} />
            <Text style={styles.backTxt}>Back</Text>
          </TouchableOpacity>
          <View style={styles.topRight}>
            <ThemeSwitch />
            <View style={styles.completionRow} accessibilityLabel={`Profile Completion ${completionPct}%`}>
              {width >= 1200 && <Text style={styles.completionLbl}>Profile Completion</Text>}
              <CompletionBar pct={completionPct} t={t} width={layout === 'mobile' ? 64 : width >= 1200 ? 140 : 96} />
            </View>
          </View>
        </View>
        {layout !== 'wide' && <View style={{ alignItems: 'center', marginBottom: 12 }}>{brand}</View>}

        <View style={styles.greetWrap}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrow}>Student Onboarding</Text>
            <View style={styles.eyebrowLine} />
          </View>
          <Text style={styles.greetMain} accessibilityRole="header">Nice — let&apos;s personalise your learning experience</Text>
          <Text style={styles.greetSub}>Fill in each box to help us tailor stories, examples and explanations just for you.</Text>
        </View>

        {/* ── Row 1: About You / Curriculum / School ── */}
        <View style={[styles.row, { zIndex: 20 }]}>
          {/* About You */}
          <View style={[styles.card, styles.col3]}>
            <CardHeader icon="user" title="About You" subtitle="Let's get to know you better." done={aboutYouDone} styles={styles} accent={t.primary} onAccent={t.onPrimary} />
            <View style={styles.fieldGroup}>
              <Text style={styles.lbl}>Name</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} accessibilityLabel="Name"
                placeholder="Your name" placeholderTextColor={t.placeholder} autoCapitalize="words" autoComplete="name" />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.lbl}>Gender</Text>
              <View style={styles.chipRow} accessibilityRole="radiogroup">
                {GENDERS.map(g => (
                  <SelectChip key={g} label={g} selected={gender === g} onPress={() => setGender(g)} />
                ))}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.lbl}>Date of Birth</Text>
              {Platform.OS === 'web' ? (
                <DatePickerInput value={dob} onChange={setDob} colors={colors} accent={t.primary} onAccent={t.onPrimary} />
              ) : (
                <TextInput style={styles.input} value={dob} onChangeText={setDob} accessibilityLabel="Date of Birth"
                  placeholder="DD/MM/YYYY" placeholderTextColor={t.placeholder} keyboardType="numeric" />
              )}
              {underAge && (
                <Text style={styles.warnTxt}>Students under 14 must have a parent or teacher create the account.</Text>
              )}
            </View>
          </View>

          {/* Curriculum */}
          <View style={[styles.card, styles.col3]}>
            <CardHeader icon="book-open" title="Curriculum" subtitle="Which curriculum do you follow?" done={curriculumDone} styles={styles} accent={t.primary} onAccent={t.onPrimary} />
            <View style={styles.radioGrid} accessibilityRole="radiogroup">
              {CURRICULA.map(c => {
                const on = curriculum === c;
                return (
                  <TouchableOpacity key={c}
                    style={[styles.radioTile, on && styles.radioTileActive]}
                    onPress={() => { setCurriculum(c); setGrade(''); }} activeOpacity={0.8}
                    accessibilityRole="radio" accessibilityState={{ checked: on, selected: on }}>
                    <View style={[styles.radio, on && { borderColor: t.primary }]}>
                      {on && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.tileTxt, on && styles.tileTxtActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.infoBox}>
              <Feather name="info" size={14} color={t.muted} />
              <Text style={styles.infoTxt}>You can change this anytime in settings.</Text>
            </View>
          </View>

          {/* School */}
          <View style={[styles.card, styles.col3, { zIndex: 10 }]}>
            <CardHeader icon="award" title="School" subtitle="Tell us about your school." done={schoolGradeDone} styles={styles} accent={t.primary} onAccent={t.onPrimary} />
            <View style={styles.fieldGroup}>
              <Text style={styles.lbl}>School Name</Text>
              <AutocompleteField
                value={school}
                onChange={setSchool}
                fetchSuggestions={(q) => fetchSchoolSuggestions(q, city, cityBBoxCache.current)}
                placeholder="Type your school name (e.g. Senthil Public School)"
                colors={colors}
                styles={styles}
                disabledMessage={city.trim().length < 3 ? 'Enter your city below to search nearby schools.' : undefined}
              />
            </View>
            {Platform.OS === 'web' && (
              <TouchableOpacity style={styles.locateBtn} onPress={() => locateFull(({ city: c, state: s, country: co }) => { if (co) setCountry(co); if (s) setStateProv(s); if (c) setCity(c); }, setLocating)} disabled={locating} activeOpacity={0.8}
                accessibilityRole="button" accessibilityState={{ busy: locating, disabled: locating }}>
                <Feather name="crosshair" size={14} color={t.heading} />
                <Text style={styles.locateTxt}>{locating ? 'Locating...' : 'Use my location'}</Text>
              </TouchableOpacity>
            )}
            <View style={[styles.fieldRow, { zIndex: 10 }]}>
              <View style={[styles.fieldGroup, { flex: 1, zIndex: 20 }]}>
                <Text style={styles.lbl}>Country</Text>
                <SelectField
                  value={country}
                  onChange={(c) => { setCountry(c); if (c !== 'India') setStateProv(''); setCity(''); }}
                  options={COUNTRIES}
                  placeholder="Select your country"
                  searchPlaceholder="Search country..."
                  colors={colors}
                  styles={styles}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1, zIndex: 15 }]}>
                <Text style={styles.lbl}>State / Province</Text>
                <SelectField
                  value={stateProv}
                  onChange={(s) => { setStateProv(s); setCity(''); }}
                  options={country === 'India' ? INDIA_STATES : []}
                  placeholder="Select your state"
                  searchPlaceholder="Search state..."
                  colors={colors}
                  styles={styles}
                />
              </View>
            </View>
            <View style={[styles.fieldGroup, { zIndex: 5 }]}>
              <Text style={styles.lbl}>City</Text>
              {country === 'India' && INDIA_CITIES[stateProv] ? (
                <SelectField
                  value={city}
                  onChange={setCity}
                  options={[...INDIA_CITIES[stateProv]].sort()}
                  placeholder="Select your city"
                  searchPlaceholder="Search city..."
                  colors={colors}
                  styles={styles}
                />
              ) : (
                <AutocompleteField
                  value={city}
                  onChange={setCity}
                  fetchSuggestions={(q) => fetchCitySuggestions(q, { state: stateProv, country })}
                  placeholder={stateProv || country ? 'Search for your city' : 'Select country & state first'}
                  colors={colors}
                  styles={styles}
                />
              )}
            </View>
          </View>
        </View>

        {/* ── Row 2: Your Grade (full width) ── */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1 }]}>
            <CardHeader icon="layers" title="Your Grade" subtitle="Which grade are you in?" done={schoolGradeDone} styles={styles} accent={t.primary} onAccent={t.onPrimary} />
            <View style={styles.gradeGroupsWrap}>
              {GRADE_GROUPS.map(group => {
                const available = group.grades.filter(g => getGradesForCurriculum(curriculum).includes(g));
                if (available.length === 0) return null;
                return (
                  <View key={group.label} style={styles.gradeGroup}>
                    <View style={styles.gradeGroupHead}>
                      <Feather name={GROUP_ICONS[group.label] as any} size={15} color={t.primary} />
                      <Text style={styles.gradeGroupLbl}>{group.label}</Text>
                    </View>
                    <View style={styles.chipRow} accessibilityRole="radiogroup">
                      {available.map(g => (
                        <SelectChip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
            {!dobGradeCheck.valid && (
              <Text style={styles.warnTxt}>{dobGradeCheck.message}</Text>
            )}
          </View>
        </View>

        {/* ── Row 3: Your Avatar (wider) / Learning Style ── */}
        <View style={styles.row}>
          <View style={[styles.card, styles.colAvatar]}>
            <CardHeader icon="smile" title="Your Avatar" subtitle="Choose an avatar that represents you." done={avatarDone} styles={styles} accent={t.primary} onAccent={t.onPrimary} />
            <View style={styles.avatarGrid} accessibilityRole="radiogroup">
              {AVATAR_STYLES.map(av => {
                const on = avatarStyle === av.id;
                return (
                  <TouchableOpacity key={av.id}
                    style={[styles.avatarTile, on && styles.avatarTileActive]}
                    onPress={() => setAvatarStyle(av.id)} activeOpacity={0.8}
                    accessibilityRole="radio" accessibilityLabel={av.label} accessibilityState={{ checked: on, selected: on }}>
                    <LinearGradient colors={av.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarCircle}>
                      <Feather name={av.icon as any} size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.avatarLbl, on && { color: t.heading, fontWeight: '700' }]}>{av.label}</Text>
                    {on && (
                      <View style={styles.tileCheck}><Feather name="check" size={10} color={t.onPrimary} /></View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.card, styles.colStyle]}>
            <CardHeader icon="zap" title="Learning Style" subtitle="How do you learn best?" done={learningStyleDone} styles={styles} accent={t.primary} onAccent={t.onPrimary} />
            <View style={styles.lsGrid} accessibilityRole="radiogroup">
              {LEARNING_STYLES.map(ls => {
                const on = learningStyle === ls.id;
                return (
                  <TouchableOpacity key={ls.id}
                    style={[styles.lsTile, on && styles.lsTileActive]}
                    onPress={() => setLearningStyle(ls.id)} activeOpacity={0.8}
                    accessibilityRole="radio" accessibilityState={{ checked: on, selected: on }}>
                    {on && <View style={styles.lsCheck}><Feather name="check" size={11} color={t.onPrimary} /></View>}
                    <Feather name={ls.icon as any} size={24} color={on ? t.primary : t.heading} />
                    <Text style={styles.lsLabel}>{ls.label}</Text>
                    <Text style={styles.lsDesc}>{ls.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {saveError ? (
          <View style={styles.errorBox} accessibilityLiveRegion="polite">
            <Feather name="alert-circle" size={16} color={t.danger} />
            <Text style={styles.errorTxt}>{saveError}</Text>
          </View>
        ) : null}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.secureRow}>
            <Feather name="lock" size={15} color={t.heading} />
            <Text style={styles.secureTxt}>Your data is secure and never shared.</Text>
          </View>
          {!mobileLayout && <View style={styles.footerDivider} />}
          <View style={styles.footerBtns}>
            {!requiredDone && (
              <Text style={styles.requiredHint}>Complete About You, Curriculum and School & Grade to continue</Text>
            )}
            <TouchableOpacity
              style={[styles.completeBtn, (!requiredDone || saving) && { opacity: 0.5 }]}
              disabled={!requiredDone || saving}
              onPress={handleFinish} activeOpacity={0.85}
              accessibilityRole="button" accessibilityState={{ disabled: !requiredDone || saving, busy: saving }}>
              <Text style={styles.completeTxt}>{saving ? 'Saving...' : 'Complete Setup'}</Text>
              {!saving && <Feather name="arrow-right" size={16} color={t.onPrimary} />}
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.footBrand} aria-hidden>Aivorah</Text>
      </ScrollView>

      {/* ── Leave-to-home confirmation ── */}
      <Modal transparent visible={showLeaveConfirm} animationType="fade" onRequestClose={() => setShowLeaveConfirm(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIcon}>
              <Feather name="log-out" size={22} color={t.primary} />
            </View>
            <Text style={styles.confirmTitle}>Return to the home page?</Text>
            <Text style={styles.confirmBody}>
              You&apos;ll be signed out and taken back to the Aivorah home page. We can save what
              you&apos;ve entered so far so it&apos;s still here next time you sign in.
            </Text>
            <TouchableOpacity
              style={styles.confirmPrimary}
              activeOpacity={0.85}
              disabled={saving}
              onPress={async () => { setSaving(true); await saveProgress(); setSaving(false); setShowLeaveConfirm(false); await logout(); }}
            >
              <Text style={styles.confirmPrimaryTxt}>{saving ? 'Saving...' : 'Save & go to home page'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmSecondary}
              activeOpacity={0.7}
              disabled={saving}
              onPress={async () => { setShowLeaveConfirm(false); await logout(); }}
            >
              <Text style={styles.confirmSecondaryTxt}>Leave without saving</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={saving}
              onPress={() => setShowLeaveConfirm(false)}
              style={{ marginTop: 4, padding: 8 }}
            >
              <Text style={[styles.confirmSecondaryTxt, { textDecorationLine: 'underline' }]}>Stay here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(t: HomeTokens, layout: Layout) {
  const wide = layout === 'wide';
  const mobile = layout === 'mobile';
  const gutter = mobile ? 16 : wide ? 32 : 24;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg, ...colorTransition() },
    scrollContent: { paddingHorizontal: gutter, paddingTop: 16, paddingBottom: 40, maxWidth: 1200 + gutter * 2, width: '100%', alignSelf: 'center' },

    topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: mobile ? 12 : 20, minHeight: 56 },
    brandCenter: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    brand: { alignItems: 'center', gap: 4 },
    logoTxt: { fontFamily: SERIF, fontSize: 24, fontWeight: '600', color: t.heading, letterSpacing: -0.4 },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999, borderWidth: 1.5, borderColor: t.heading },
    roleBadgeText: { fontFamily: SANS, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: t.heading },
    backBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44,
      paddingHorizontal: 6, borderRadius: 999,
    },
    backTxt: { fontFamily: SANS, fontSize: 14, fontWeight: '600', color: t.heading },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    completionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: mobile ? 10 : 14,
      borderRadius: 999, backgroundColor: t.card, borderWidth: 1, borderColor: t.line,
    },
    completionLbl: { fontFamily: SANS, fontSize: 13, fontWeight: '700', color: t.heading },

    greetWrap: { alignItems: 'center', marginBottom: 24 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    eyebrowLine: { width: mobile ? 0 : 0, height: 1, backgroundColor: 'transparent' },
    eyebrow: { fontFamily: SANS, fontSize: 12.5, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: t.accent },
    greetMain: { fontFamily: SERIF, fontSize: mobile ? 28 : wide ? 38 : 32, lineHeight: (mobile ? 28 : wide ? 38 : 32) * 1.15, fontWeight: '600', color: t.heading, textAlign: 'center', letterSpacing: -0.5 },
    greetSub: { fontFamily: SANS, fontSize: 16, lineHeight: 23, color: t.muted, marginTop: 8, textAlign: 'center' },

    row: { flexDirection: mobile ? 'column' : 'row', flexWrap: layout === 'tablet' ? 'wrap' : 'nowrap', gap: 16, marginBottom: 16, alignItems: 'stretch' },
    card: {
      backgroundColor: t.card, borderWidth: 1, borderColor: t.line,
      borderRadius: 20, padding: wide ? 22 : 18, gap: 16,
      shadowColor: t.shadow, shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2,
      ...colorTransition(),
    },
    col3: wide ? { flex: 1, flexBasis: 0, minWidth: 0 } : mobile ? {} : { flexGrow: 1, flexBasis: '46%', minWidth: 280 },
    colAvatar: wide ? { flex: 1.55, flexBasis: 0, minWidth: 0 } : mobile ? {} : { flexGrow: 1, flexBasis: '100%' },
    colStyle: wide ? { flex: 1, flexBasis: 0, minWidth: 0 } : mobile ? {} : { flexGrow: 1, flexBasis: '100%' },

    gradeGroupsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gradeGroup: {
      flexGrow: 1, flexBasis: wide ? '22%' : mobile ? '100%' : '46%', minWidth: mobile ? 0 : 220,
      backgroundColor: t.input, borderWidth: 1, borderColor: t.line,
      borderRadius: 14, padding: 14, gap: 12,
    },
    gradeGroupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    gradeGroupLbl: { flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: '700', color: t.heading },

    // CardHeader (shared component) reads these
    cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    cardIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: t.infoBg, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontFamily: SERIF, fontSize: 21, fontWeight: '600', color: t.heading, letterSpacing: -0.2 },
    cardSub: { fontFamily: SANS, fontSize: 13.5, color: t.muted, marginTop: 2 },
    cardCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: t.success, alignItems: 'center', justifyContent: 'center' },

    fieldGroup: { gap: 7 },
    fieldRow: { flexDirection: mobile ? 'column' : 'row', gap: mobile ? 16 : 12 },
    lbl: { fontFamily: SANS, fontSize: 14, fontWeight: '600', color: t.heading },
    lblRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    locateBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: 999,
      borderWidth: 1.5, borderColor: t.heading, backgroundColor: t.card,
    },
    locateTxt: { fontFamily: SANS, fontSize: 14, fontWeight: '600', color: t.heading },
    // Shared SelectField / AutocompleteField read these
    input: {
      minHeight: 48, backgroundColor: t.input, borderWidth: 1.5, borderColor: t.inputLine,
      borderRadius: 12, paddingHorizontal: 14, fontFamily: SANS, fontSize: 16, color: t.text,
    },
    hintTxt: { fontFamily: SANS, fontSize: 12, color: t.muted },
    dropdown: {
      marginTop: 6, backgroundColor: t.card, borderWidth: 1, borderColor: t.line,
      borderRadius: 12, overflow: 'hidden',
    },
    dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.line },
    dropdownTxt: { fontFamily: SANS, fontSize: 15, color: t.text },
    dropdownHint: { fontFamily: SANS, fontSize: 13, color: t.muted, paddingHorizontal: 14, paddingVertical: 10 },
    warnTxt: { fontFamily: SANS, color: t.danger, fontSize: 13, lineHeight: 18, marginTop: 4 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    radioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    radioTile: {
      flexBasis: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, minHeight: 48, borderRadius: 12,
      borderWidth: 1.5, borderColor: t.inputLine, backgroundColor: t.input,
    },
    radioTileActive: { borderColor: t.primary, backgroundColor: t.primarySoft, borderWidth: 2 },
    radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: t.muted, alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.primary },
    tileTxt: { fontFamily: SANS, fontSize: 15, fontWeight: '600', color: t.text },
    tileTxtActive: { color: t.heading },

    infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
    infoTxt: { fontFamily: SANS, fontSize: 13, fontStyle: 'italic', color: t.muted },

    avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    avatarTile: {
      flexBasis: mobile ? '46%' : '22%', flexGrow: 1, minWidth: mobile ? 0 : 84, alignItems: 'center', gap: 6, paddingVertical: 12,
      borderRadius: 16, borderWidth: 2, borderColor: 'transparent', position: 'relative',
      ...colorTransition(180),
    },
    avatarTileActive: { borderColor: t.primary, backgroundColor: t.primarySoft },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    avatarLbl: { fontFamily: SANS, fontSize: 13, fontWeight: '600', color: t.muted, textAlign: 'center' },
    tileCheck: {
      position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9,
      backgroundColor: t.success, alignItems: 'center', justifyContent: 'center',
    },

    lsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    lsTile: {
      flexBasis: '46%', flexGrow: 1, minHeight: 112, padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: t.inputLine, backgroundColor: t.input, gap: 6, position: 'relative',
    },
    lsTileActive: { borderColor: t.primary, backgroundColor: t.primarySoft, borderWidth: 2 },
    lsCheck: {
      position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
      backgroundColor: t.success, alignItems: 'center', justifyContent: 'center',
    },
    lsLabel: { fontFamily: SANS, fontSize: 15, fontWeight: '700', color: t.heading, textAlign: 'center' },
    lsDesc: { fontFamily: SANS, fontSize: 12, color: t.muted, lineHeight: 16, textAlign: 'center' },

    errorBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, marginBottom: 12,
      backgroundColor: t.dangerSoft, borderWidth: 1, borderColor: t.danger,
    },
    errorTxt: { flex: 1, fontFamily: SANS, color: t.danger, fontSize: 14, lineHeight: 20 },

    footer: {
      flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'stretch' : 'center', justifyContent: 'space-between',
      gap: 14, marginTop: 4, paddingVertical: 14,
    },
    footerDivider: { width: 1, alignSelf: 'stretch', backgroundColor: t.line },
    footBrand: { fontFamily: SERIF, fontSize: 24, fontWeight: '500', color: t.heading, textAlign: 'center', marginTop: 18 },
    secureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    secureTxt: { fontFamily: SANS, fontSize: 14, color: t.muted },
    footerBtns: { flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'stretch' : 'center', gap: mobile ? 10 : 16 },
    requiredHint: { fontFamily: SANS, fontSize: 13, color: t.muted, maxWidth: mobile ? undefined : 260, textAlign: mobile ? 'left' : 'right' },
    completeBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50,
      backgroundColor: t.primary, paddingHorizontal: 28, borderRadius: 999,
    },
    completeTxt: { fontFamily: SANS, fontSize: 16, fontWeight: '700', color: t.onPrimary },

    confirmOverlay: { flex: 1, backgroundColor: 'rgba(16,24,39,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    confirmBox: {
      width: 380, maxWidth: '95%', borderRadius: 22, padding: 28, alignItems: 'center',
      backgroundColor: t.card, borderWidth: 1, borderColor: t.line,
    },
    confirmIcon: {
      width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.infoBg, marginBottom: 16,
    },
    confirmTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: '600', color: t.heading, marginBottom: 10, textAlign: 'center' },
    confirmBody: { fontFamily: SANS, fontSize: 14.5, color: t.muted, lineHeight: 21, textAlign: 'center', marginBottom: 22 },
    confirmPrimary: { width: '100%', minHeight: 48, justifyContent: 'center', backgroundColor: t.primary, borderRadius: 999, alignItems: 'center', marginBottom: 10 },
    confirmPrimaryTxt: { fontFamily: SANS, fontSize: 15, fontWeight: '700', color: t.onPrimary },
    confirmSecondary: { width: '100%', minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 999, borderWidth: 1.5, borderColor: t.heading },
    confirmSecondaryTxt: { fontFamily: SANS, fontSize: 14, fontWeight: '600', color: t.heading },
  });
}
