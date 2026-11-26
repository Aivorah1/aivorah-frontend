import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, Modal, BackHandler, Pressable } from 'react-native';
import ActivityIndicator from '../../components/common/AivorahLoader';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useAuth, UserRole } from '../../context/AuthContext';
import { validateLoginForm, validateSignupForm } from './utils/validation';
import PROFILE_SERVER_URL from '../../config/profileServerUrl';
import AUTH_SERVER_URL from '../../config/authServerUrl';
import { AUTH_PAGE_PATHS, AuthPage, authPageFromPath } from './authRoutes';
import {
  HomeThemeProvider, useHomeTheme, useAuthLayout, AuthShell, AuthCard, AuthHeading, AuthField, FieldLabel,
  PasswordEye, PrimaryButton, OutlineButton, OrDivider, Notice, TextLink, SelectChip, RoleTile,
  ShapeFrame, PencilArt, GlidingPlane, RulerArt, Sparks, FadeIn, Decorative, focusRing, SANS, SERIF,
} from './authTheme';

// Cards switch to two columns when the page is wide enough (desktop / TV boards).
const SplitContext = createContext(false);
const useSplit = () => useContext(SplitContext);

// Page headings (shown beside the card on wide screens, inside it on phones).
const PAGE_COPY = {
  signin: { title: 'Welcome back', subtitle: 'Sign in to your Aivorah account' },
  signup: { title: 'Create your account', subtitle: undefined as string | undefined },
  forgot: { title: 'Reset your password', subtitle: "Enter your email and we'll send you a reset link" },
};

const IS_WEB = Platform.OS === 'web';

// ─────────────────────────────────────────────────────────
// Google SVG Icon (Google's own mark — keep its branding)
// ─────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <Path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <Path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <Path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" />
    </Svg>
  );
}

function GoogleButton({ label, loading, onPress }: { label: string; loading: boolean; onPress: () => void }) {
  const { t } = useHomeTheme();
  return (
    <OutlineButton
      label={label}
      onPress={onPress}
      leading={loading ? <ActivityIndicator size="small" color={t.heading} /> : <GoogleIcon />}
    />
  );
}

function FooterLine({ text, link, onPress, tone = 'accent' }: { text: string; link: string; onPress: () => void; tone?: 'accent' | 'primary' }) {
  const { t } = useHomeTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 18 }}>
      <Text style={{ fontFamily: SANS, fontSize: 15, color: t.text }}>{text}</Text>
      <TextLink label={link} onPress={onPress} tone={tone} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Roles: sign-up offers all three (students 14+ may self-register)
// ─────────────────────────────────────────────────────────
const ROLE_LABELS: UserRole[] = ['student', 'teacher', 'parent'];
const ROLE_ICONS: Record<string, string> = { student: 'account-outline', teacher: 'school-outline', parent: 'account-group-outline' };

// ─────────────────────────────────────────────────────────
// Date of birth picker (themed calendar; outputs DD/MM/YYYY)
// ─────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function DobPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { t } = useHomeTheme();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'days' | 'years'>('days');
  const today = new Date();
  // Parse existing value (DD/MM/YYYY) or default the view to ~10 years ago.
  const parsed = (() => {
    const p = value.split('/').map(Number);
    if (p.length === 3 && p[0] && p[1] && p[2]) return { d: p[0], m: p[1] - 1, y: p[2] };
    return null;
  })();
  const [view, setView] = useState({ y: parsed ? parsed.y : today.getFullYear() - 10, m: parsed ? parsed.m : 0 });

  const pad = (n: number) => String(n).padStart(2, '0');
  const selDay = parsed ? parsed.d : null;
  const selMonth = parsed ? parsed.m : null;
  const selYear = parsed ? parsed.y : null;

  function pick(d: number) {
    onChange(`${pad(d)}/${pad(view.m + 1)}/${view.y}`);
    setOpen(false);
  }
  function shiftMonth(delta: number) {
    let m = view.m + delta, y = view.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setView({ y, m });
  }
  function shiftYear(delta: number) {
    setView(v => ({ ...v, y: Math.min(today.getFullYear(), Math.max(1950, v.y + delta)) }));
  }

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const years: number[] = [];
  for (let y = today.getFullYear(); y >= 1950; y--) years.push(y);

  const displayText = parsed ? `${pad(parsed.d)} ${MONTH_NAMES[parsed.m].slice(0,3)} ${parsed.y}` : 'Select your date of birth';
  const navBtn = { width: 36, height: 36, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const, borderWidth: 1, borderColor: t.line };

  return (
    <View style={{ marginBottom: 18 }}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        onPress={() => { setOpen(o => !o); setMode('days'); }}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayText}`}
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, borderRadius: 12,
          borderWidth: 1.5, borderColor: open ? t.focus : t.inputLine, backgroundColor: t.input, paddingHorizontal: 14,
        }}
      >
        <Text style={{ fontFamily: SANS, fontSize: 16, color: parsed ? t.text : t.placeholder }}>{displayText}</Text>
        <Feather name="calendar" size={17} color={t.muted} />
      </Pressable>

      {open && (
        <View style={{ marginTop: 8, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity accessibilityLabel="Previous year" onPress={() => shiftYear(-1)} style={navBtn}><Feather name="chevrons-left" size={16} color={t.heading} /></TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Previous month" onPress={() => shiftMonth(-1)} style={navBtn}><Feather name="chevron-left" size={16} color={t.heading} /></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setMode(mode === 'years' ? 'days' : 'years')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: SANS, fontSize: 15, fontWeight: '600', color: t.heading }}>{MONTH_NAMES[view.m]} {view.y}</Text>
              <Feather name="chevron-down" size={14} color={t.muted} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity accessibilityLabel="Next month" onPress={() => shiftMonth(1)} style={navBtn}><Feather name="chevron-right" size={16} color={t.heading} /></TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Next year" onPress={() => shiftYear(1)} style={navBtn}><Feather name="chevrons-right" size={16} color={t.heading} /></TouchableOpacity>
            </View>
          </View>

          {mode === 'years' ? (
            <View style={{ maxHeight: 220, overflow: 'scroll' as any }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {years.map(y => (
                  <TouchableOpacity key={y} onPress={() => { setView(v => ({ ...v, y })); setMode('days'); }}
                    style={{ width: '23%', paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: y === view.y ? t.primary : 'transparent' }}>
                    <Text style={{ fontFamily: SANS, fontSize: 14, color: y === view.y ? t.onPrimary : t.text, fontWeight: y === view.y ? '700' : '400' }}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row' }}>
                {WEEKDAYS.map(w => <Text key={w} style={{ flex: 1, textAlign: 'center', fontFamily: SANS, fontSize: 12, color: t.muted, paddingVertical: 4 }}>{w}</Text>)}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {cells.map((d, i) => {
                  if (d === null) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 40 }} />;
                  const isFuture = new Date(view.y, view.m, d) > today;
                  const isSel = d === selDay && view.m === selMonth && view.y === selYear;
                  return (
                    <TouchableOpacity key={d} disabled={isFuture} onPress={() => pick(d)}
                      style={{ width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: isSel ? t.primary : 'transparent' }}>
                      <Text style={{ fontFamily: SANS, fontSize: 14, color: isSel ? t.onPrimary : t.text, opacity: isFuture ? 0.35 : 1, fontWeight: isSel ? '700' : '400' }}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// SIGN IN form
// ─────────────────────────────────────────────────────────
function LoginForm({ onDone, onSwitchSignup, onSwitchForgot, signInEmail, signInGoogle, addParentRoleSSO, externalError }: {
  onDone: () => void; onSwitchSignup: () => void; onSwitchForgot: () => void;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signInGoogle: (role?: UserRole) => Promise<void>;
  addParentRoleSSO: (email: string) => Promise<void>;
  externalError?: string | null;
}) {
  // Sign-in needs NO role — returning users' role comes from their account.
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Show external error (e.g. role mismatch from Google SSO)
  useEffect(() => {
    // Don't show internal signals as error text — LandingScreen handles these via Alert
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs an externally-owned error signal, external sync
    if (externalError && !externalError.startsWith('TEACHER_ADD_PARENT:')) setError(externalError);
  }, [externalError]);

  async function submit() {
    setError('');
    const emailTrim = email.replace(/\s+/g, '');
    const passTrim = pass.replace(/\s+/g, '');
    const validation = validateLoginForm({ email: emailTrim, pass: passTrim });
    if (!validation.valid) { setError(validation.error!); return; }
    setLoading(true);
    try { await signInEmail(emailTrim, passTrim); onDone(); }
    catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    }
    finally { setLoading(false); }
  }

  async function googleSignIn() {
    setError('');
    setGoogleLoading(true);
    try { await signInGoogle(); onDone(); }   // no role — returning user uses their stored role
    catch (e: any) {
      // Brand-new Google user used "Welcome back" → send them to Sign-Up
      // to pick a role. Returning users never hit this (they have a stored role).
      if (e.message?.startsWith('NEW_GOOGLE_USER:')) {
        setGoogleLoading(false);
        onSwitchSignup();
        return;
      }
      if (e.message?.startsWith('TEACHER_ADD_PARENT:')) {
        const teacherEmail = e.message.replace('TEACHER_ADD_PARENT:', '');
        setGoogleLoading(false);
        Alert.alert(
          'Teacher Account Found',
          'This email is already registered as a Teacher. Would you like to add a Parent profile so you can switch between both?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes, Add Parent Profile',
              onPress: async () => {
                setGoogleLoading(true);
                try { await addParentRoleSSO(teacherEmail); onDone(); }
                catch { setError('Could not add Parent profile. Please try again.'); }
                finally { setGoogleLoading(false); }
              },
            },
          ]
        );
        return;
      }
      setError(e.message || 'An error occurred during Google signin.');
    }
    finally { setGoogleLoading(false); }
  }

  return (
    <>
      <GoogleButton label="Sign in with Google" loading={googleLoading} onPress={googleSignIn} />

      <OrDivider />

      <AuthField
        label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com"
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
        invalid={!!error && !email.trim()}
      />
      <AuthField
        label="Password" value={pass} onChangeText={setPass} placeholder="••••••••"
        secureTextEntry={!showPass} autoCapitalize="none" autoComplete="current-password" textContentType="password"
        onSubmitEditing={submit} returnKeyType="go" style={{ marginBottom: 8 }}
        invalid={!!error && !pass.trim()}
        rightEl={<PasswordEye shown={showPass} onToggle={() => setShowPass(!showPass)} />}
      />
      <View style={{ alignItems: 'flex-end', marginBottom: 18 }}>
        <TextLink label="Forgot password?" onPress={onSwitchForgot} />
      </View>

      {!!error && <Notice kind="error">{error}</Notice>}

      <PrimaryButton label="Sign In" onPress={submit} loading={loading} />
      <FooterLine text="Don't have an account?" link="Sign up free" onPress={onSwitchSignup} />
    </>
  );
}

// ─────────────────────────────────────────────────────────
// CREATE ACCOUNT form
// ─────────────────────────────────────────────────────────
// CBSE follows the NCERT syllabus, so NCERT is not a separate board option (#157).
const CURRICULA = ['IB PYP', 'IB MYP', 'IB DP', 'CBSE', 'ICSE', 'Cambridge'];

function SignupForm({ onDone, onSwitchLogin, signUpEmail, signInGoogle, addParentRole, addParentRoleSSO }: {
  onDone: () => void; onSwitchLogin: () => void;
  signUpEmail: (name: string, email: string, pass: string, role: UserRole, curriculum?: string) => Promise<void>;
  signInGoogle: (role: UserRole) => Promise<void>;
  addParentRole: (email: string, password: string) => Promise<void>;
  addParentRoleSSO: (email: string) => Promise<void>;
}) {
  const { t } = useHomeTheme();
  const { width } = useAuthLayout();
  const split = useSplit();
  const twoCol = !split && width >= 760;
  const [role, setRole]             = useState<UserRole>('student');
  const [curriculum, setCurriculum] = useState('CBSE');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [pass, setPass]             = useState('');
  const [dob, setDob]               = useState('');   // DD/MM/YYYY — only for students
  const [showPass, setShowPass]     = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const showCurriculum = role === 'student' || role === 'teacher';
  async function submit() {
    setError('');
    const emailTrim = email.trim();
    const nameTrim  = name.trim();

    const validation = validateSignupForm({ name: nameTrim, email: emailTrim, pass, role, dob });
    if (!validation.valid) { setError(validation.error!); return; }

    setLoading(true);
    try {
      await signUpEmail(nameTrim, emailTrim, pass, role, showCurriculum ? curriculum : undefined);
      // Persist the student's date of birth (collected here, not in onboarding).
      if (role === 'student' && dob.trim()) {
        fetch(`${PROFILE_SERVER_URL}/user/preferences`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailTrim.toLowerCase(), role: 'student', dob: dob.trim() }),
        }).catch(() => {});
      }
      onDone();
    } catch (e: any) {
      // Teacher trying to sign up as Parent → offer to add Parent profile
      if (e.message?.startsWith('TEACHER_ADD_PARENT:')) {
        setLoading(false);
        Alert.alert(
          'Teacher Account Found',
          'This email is already registered as a Teacher. Would you like to add a Parent profile so you can switch between both?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes, Add Parent Profile',
              onPress: async () => {
                setLoading(true);
                try {
                  await addParentRole(emailTrim, pass);
                  onDone();
                } catch {
                  setError('Could not add Parent profile. Please check your password and try again.');
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
        return;
      }
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setError('');
    setGoogleLoading(true);
    try { await signInGoogle(role); onDone(); }
    catch (e: any) {
      // Teacher signing in as Parent via Google SSO → offer to club profiles
      if (e.message?.startsWith('TEACHER_ADD_PARENT:')) {
        const teacherEmail = e.message.replace('TEACHER_ADD_PARENT:', '');
        setGoogleLoading(false);
        Alert.alert(
          'Teacher Account Found',
          'This email is already registered as a Teacher. Would you like to add a Parent profile so you can switch between both?',
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes, Add Parent Profile',
              onPress: async () => {
                setGoogleLoading(true);
                try {
                  await addParentRoleSSO(teacherEmail);
                  onDone();
                } catch {
                  setError('Could not add Parent profile. Please try again.');
                } finally {
                  setGoogleLoading(false);
                }
              },
            },
          ]
        );
        return;
      }
      setError(e.message || 'An error occurred during Google signin.');
    } finally { setGoogleLoading(false); }
  }

  const row = { flexDirection: twoCol ? 'row' as const : 'column' as const, gap: twoCol ? 16 : 0 };
  const cell = twoCol ? { flex: 1 } : null;

  const passwordField = (
    <AuthField
      label="Password" value={pass} onChangeText={setPass} placeholder="At least 6 characters"
      secureTextEntry={!showPass} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword"
      style={cell} invalid={!!error && !pass}
      rightEl={<PasswordEye shown={showPass} onToggle={() => setShowPass(!showPass)} />}
    />
  );

  const roleGroup = (
    <>
      {/* Role FIRST — chosen before Google SSO (and used for email signup too) */}
      <FieldLabel>I&apos;m creating an account as</FieldLabel>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14, marginTop: 4 }}>
        {ROLE_LABELS.map(r => (
          <RoleTile key={r} label={r.charAt(0).toUpperCase() + r.slice(1)} selected={role === r}
            icon={(c) => <MaterialCommunityIcons name={ROLE_ICONS[r] as any} size={22} color={c} />}
            onPress={() => { setRole(r); setError(''); setDob(''); }} />
        ))}
      </View>

      {/* Under-14 notice — shown when student role selected */}
      {role === 'student' && (
        <Notice kind="info">
          {'Students aged 14 and above can register here.\nIf you are under 14, ask your parent or teacher to create your account.'}
        </Notice>
      )}

      <GoogleButton label="Sign up with Google" loading={googleLoading} onPress={googleSignIn} />

      <OrDivider />

      {showCurriculum && (
        <FadeIn style={{ marginBottom: 18 }}>
          <FieldLabel>Curriculum</FieldLabel>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {CURRICULA.map(c => (
              <SelectChip key={c} label={c} selected={curriculum === c} onPress={() => setCurriculum(c)} />
            ))}
          </View>
        </FadeIn>
      )}
    </>
  );

  const detailsGroup = (
    <>
      <View style={row}>
        <AuthField label="Full name" value={name} onChangeText={setName} placeholder="Jane Smith"
          autoCapitalize="words" autoComplete="name" textContentType="name" style={cell}
          invalid={!!error && !name.trim()} />
        <AuthField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com"
          keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" style={cell}
          invalid={!!error && !email.trim()} />
      </View>

      {/* DOB — only for students; shares a row with the password when it fits */}
      {role === 'student' ? (
        <View style={row}>
          <FadeIn style={cell}><DobPicker label="Date of birth" value={dob} onChange={setDob} /></FadeIn>
          {passwordField}
        </View>
      ) : passwordField}

      {!!error && <Notice kind="error">{error}</Notice>}

      <PrimaryButton label="Create Free Account" onPress={submit} loading={loading} style={{ marginTop: 6 }} />
      <FooterLine text="Already have an account?" link="Sign in" onPress={onSwitchLogin} tone="primary" />
    </>
  );

  if (split) {
    return (
      <View style={{ flexDirection: 'row', gap: 28 }}>
        <View style={{ flex: 1, minWidth: 0 }}>{roleGroup}</View>
        <View style={{ width: 1, backgroundColor: t.line }} />
        <View style={{ flex: 1, minWidth: 0 }}>{detailsGroup}</View>
      </View>
    );
  }
  return (
    <>
      {roleGroup}
      {detailsGroup}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD form
// ─────────────────────────────────────────────────────────
function ForgotForm({ onSwitchLogin }: { onSwitchLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const frontendOrigin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'https://aivorah.ai';
      const res = await fetch(`${AUTH_SERVER_URL}/user/send-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), frontendOrigin }),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
    } catch (e) {
      Alert.alert('Error', 'Could not send reset email. Check the address and try again.');
    } finally { setLoading(false); }
  }

  return (
    <>
      {sent ? (
        <Notice kind="success">{`Reset link sent to ${email}. Check your inbox.`}</Notice>
      ) : (
        <>
          <AuthField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com"
            keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
            onSubmitEditing={submit} returnKeyType="send" />
          <PrimaryButton label="Send Reset Link" onPress={submit} loading={loading} />
        </>
      )}
      <FooterLine text="Remembered it?" link="Back to Sign in" onPress={onSwitchLogin} />
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Page layouts: heading + artwork beside the card on wide screens,
// heading inside the card on phones and tablets.
// ─────────────────────────────────────────────────────────
type Copy = { title: string; subtitle?: string };

function IntroPanel({ copy, art, width: w }: { copy: Copy; art: React.ReactNode; width: number }) {
  const { headingSize } = useAuthLayout();
  return (
    <View style={{ width: w, flexShrink: 0 }}>
      <AuthHeading title={copy.title} subtitle={copy.subtitle} align="left" size={Math.round(headingSize * 1.15)} />
      <Decorative style={{ marginTop: 8 }}>{art}</Decorative>
    </View>
  );
}

function AuthPageLayout({ copy, onBack, children, cardMax, splitMax, art, cornerArt, canSplit = true }: {
  copy: Copy; onBack: () => void; children: React.ReactNode; canSplit?: boolean;
  /** card width in one column / in two columns */
  cardMax: number; splitMax: number;
  art: React.ReactNode; cornerArt: React.ReactNode;
}) {
  const { width, isWide, isTV } = useAuthLayout();
  const introW = isTV ? 420 : width >= 1280 ? 330 : 280;
  // Two columns inside the card once the card itself has room for both.
  const split = canSplit && isWide && width - introW - 160 >= splitMax;
  const cardW = split ? splitMax : cardMax;
  return (
    <AuthShell onBack={onBack} contentMaxWidth={isWide ? introW + cardW + 120 : undefined}>
      <SplitContext.Provider value={split}>
        <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: isWide ? 64 : 0, paddingVertical: isWide ? 24 : 16 }}>
          {isWide && <IntroPanel copy={copy} art={art} width={introW} />}
          <ShapeFrame style={{ maxWidth: cardW, flexShrink: 1 }}>
            <AuthCard maxWidth={cardW}>
              {!isWide && (
                <View>
                  <Decorative style={{ position: 'absolute', top: -38, left: -14 }}>{cornerArt}</Decorative>
                  <AuthHeading title={copy.title} subtitle={copy.subtitle} />
                </View>
              )}
              {children}
            </AuthCard>
          </ShapeFrame>
        </View>
      </SplitContext.Provider>
    </AuthShell>
  );
}

function SignInLayout({ children, onBack, copy = PAGE_COPY.signin }: { children: React.ReactNode; onBack: () => void; copy?: Copy }) {
  const { isTV } = useAuthLayout();
  const art = (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 8 }}>
      <GlidingPlane width={isTV ? 150 : 120} />
      <View style={{ marginLeft: -20, marginBottom: -18 }}><PencilArt width={isTV ? 120 : 96} /></View>
    </View>
  );
  return (
    <AuthPageLayout copy={copy} onBack={onBack} cardMax={480} splitMax={isTV ? 900 : 760} art={art} cornerArt={<PencilArt width={46} />} canSplit={false}>
      {children}
    </AuthPageLayout>
  );
}

function SignUpLayout({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  const { isTV } = useAuthLayout();
  const art = (
    <View style={{ marginTop: 10 }}>
      <RulerArt width={isTV ? 220 : 180} />
      <View style={{ position: 'absolute', right: 30, top: -26 }}><Sparks size={34} /></View>
    </View>
  );
  return (
    <AuthPageLayout copy={PAGE_COPY.signup} onBack={onBack} cardMax={720} splitMax={isTV ? 1120 : 920} art={art} cornerArt={<RulerArt width={70} />}>
      {children}
    </AuthPageLayout>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN SCREEN — homepage + the signed-out pages
// ─────────────────────────────────────────────────────────
export default function LandingScreen() {
  return (
    <HomeThemeProvider>
      <LandingRoutes />
    </HomeThemeProvider>
  );
}

function initialPage(): AuthPage {
  if (!IS_WEB || typeof window === 'undefined') return 'home';
  // ?signin=1 (used after email verification in another browser) opens Sign In.
  if (new URLSearchParams(window.location.search).get('signin') === '1') return 'signin';
  return authPageFromPath(window.location.pathname);
}

function LandingRoutes() {
  const { t } = useHomeTheme();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, demoLogin, addParentRoleToTeacher, addParentRoleToTeacherSSO, authError, clearAuthError, logout } = useAuth();
  const [page, setPage] = useState<AuthPage>(initialPage);
  const [teacherAddParentEmail, setTeacherAddParentEmail] = useState<string | null>(null);
  const [addingParentRole, setAddingParentRole] = useState(false);

  // Navigate between the homepage and the signed-out pages. On web each page
  // has its own URL, so browser Back/Forward and direct visits work.
  function go(next: AuthPage, replace = false) {
    if (page === 'signin' && next !== 'signin') clearAuthError();
    if (IS_WEB && typeof window !== 'undefined') {
      const url = next === 'home' ? '/' : AUTH_PAGE_PATHS[next];
      if (window.location.pathname + window.location.search !== url) {
        if (replace) window.history.replaceState(null, '', url);
        else window.history.pushState(null, '', url);
      }
      window.scrollTo?.(0, 0);
    }
    setPage(next);
  }

  // Normalise ?signin=1 to /signin so a refresh doesn't keep re-opening it.
  useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('signin') === '1') {
      window.history.replaceState(null, '', AUTH_PAGE_PATHS.signin);
    }
  }, []);

  // Browser Back / Forward between pages.
  useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return;
    const onPop = () => setPage(authPageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Android hardware Back on a page → homepage.
  useEffect(() => {
    if (IS_WEB || page === 'home') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setPage('home'); return true; });
    return () => sub.remove();
  }, [page]);

  // Hidden demo access for sales/testing (the public buttons were removed).
  // e.g. localhost:3006/?demo=student | teacher | parent | super_admin
  useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return;
    const d = new URLSearchParams(window.location.search).get('demo');
    if (d && ['student', 'teacher', 'parent', 'super_admin'].includes(d)) {
      demoLogin(d as UserRole);
    }
  }, []);

  // Remove the browser's default body margin so the embedded landing iframe
  // sits flush to the viewport edges (no thin gaps on the left/right).
  useEffect(() => {
    if (!IS_WEB || typeof document === 'undefined') return;
    if (document.getElementById('aivorah-reset')) return;
    const style = document.createElement('style');
    style.id = 'aivorah-reset';
    style.textContent = 'html,body,#root{margin:0!important;padding:0!important;width:100%;overflow-x:hidden;background:#0B0B0B}';
    document.head.appendChild(style);
  }, []);

  // Embedded HTML pages (homepage, Book a Demo) → open the real pages.
  // The homepage posts {type:'aivorah-auth', mode} for Login / Join buttons and
  // {type:'aivorah-nav', page} for Book a Demo / Back to home.
  useEffect(() => {
    if (!IS_WEB || typeof window === 'undefined') return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e?.data?.type === 'aivorah-auth') {
        go(e.data.mode === 'login' ? 'signin' : 'signup');
      } else if (e?.data?.type === 'aivorah-nav') {
        const target = e.data.page;
        if (target === 'home' || target === 'book-demo' || target === 'signin' || target === 'signup') go(target);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  });

  // Show Sign In when authError is set (e.g. Google SSO role mismatch)
  useEffect(() => {
    if (!authError) return;
    // Teacher trying to add Parent via Google SSO → show custom confirmation modal
    if (authError.startsWith('TEACHER_ADD_PARENT:')) {
      const teacherEmail = authError.replace('TEACHER_ADD_PARENT:', '');
      clearAuthError();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs an externally-owned auth-error signal, external sync
      setTeacherAddParentEmail(teacherEmail);
      return;
    }
    if (page !== 'signin') go('signin');
  }, [authError]);

  const toHome = () => go('home');
  let content: React.ReactNode;
  if (page === 'signin') {
    content = (
      <SignInLayout onBack={toHome}>
        <LoginForm
          onDone={clearAuthError}
          onSwitchSignup={() => go('signup')}
          onSwitchForgot={() => go('forgot')}
          signInEmail={signInWithEmail}
          signInGoogle={signInWithGoogle}
          addParentRoleSSO={addParentRoleToTeacherSSO}
          externalError={authError}
        />
      </SignInLayout>
    );
  } else if (page === 'signup') {
    content = (
      <SignUpLayout onBack={toHome}>
        <SignupForm
          onDone={() => {}}
          onSwitchLogin={() => go('signin')}
          signUpEmail={signUpWithEmail}
          signInGoogle={signInWithGoogle}
          addParentRole={addParentRoleToTeacher}
          addParentRoleSSO={addParentRoleToTeacherSSO}
        />
      </SignUpLayout>
    );
  } else if (page === 'forgot') {
    content = (
      <SignInLayout onBack={toHome} copy={PAGE_COPY.forgot}>
        <ForgotForm onSwitchLogin={() => go('signin')} />
      </SignInLayout>
    );
  } else if (page === 'book-demo' && IS_WEB) {
    // Book a Demo is a standalone public page (public/book-demo.html) that keeps
    // the original demo-request form and script. Its "Back to home" posts
    // {type:'aivorah-nav', page:'home'}.
    content = React.createElement('iframe', {
      src: '/book-demo.html',
      title: 'Book a Demo · Aivorah',
      style: { border: 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
    });
  } else if (IS_WEB) {
    // Marketing landing is the standalone HTML (public/landing.html), embedded
    // full-screen. Its Login / Join / Book a Demo buttons postMessage (above).
    content = React.createElement('iframe', {
      src: '/landing.html',
      title: 'Aivorah',
      style: { border: 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
    });
  } else {
    content = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
        <Text style={{ fontFamily: SERIF, fontSize: 32, fontWeight: '600', color: t.heading, marginBottom: 12 }}>Aivorah</Text>
        <PrimaryButton label="Login" onPress={() => go('signin')} style={{ alignSelf: 'stretch' }} />
        <OutlineButton label="Join Early Access" onPress={() => go('signup')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {content}

      {/* ── TEACHER → PARENT CLUB MODAL ──────────────────── */}
      <Modal visible={!!teacherAddParentEmail} transparent animationType="fade" onRequestClose={() => { setTeacherAddParentEmail(null); logout(); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(16,24,39,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: t.card, borderRadius: 22, borderWidth: 1, borderColor: t.line, padding: 30, width: '100%', maxWidth: 420, alignItems: 'center', gap: 16 }}>
            {/* Icon */}
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.infoBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.infoLine }}>
              <Feather name="users" size={26} color={t.heading} />
            </View>
            {/* Title */}
            <Text style={{ fontFamily: SERIF, fontSize: 24, fontWeight: '600', color: t.heading, textAlign: 'center' }}>
              Teacher Account Found
            </Text>
            {/* Body */}
            <Text style={{ fontFamily: SANS, fontSize: 15, color: t.text, textAlign: 'center', lineHeight: 22 }}>
              This email is already registered as a{' '}
              <Text style={{ color: t.heading, fontWeight: '700' }}>Teacher</Text>.
              {'\n\n'}
              Would you like to add a{' '}
              <Text style={{ color: t.heading, fontWeight: '700' }}>Parent</Text>
              {' '}profile? Both profiles will be linked and you can switch between them anytime.
            </Text>
            {/* Yes button */}
            <PrimaryButton
              label={addingParentRole ? 'Setting up...' : 'Yes, Add Parent Profile'}
              disabled={addingParentRole}
              style={{ alignSelf: 'stretch', marginTop: 4 }}
              onPress={async () => {
                if (!teacherAddParentEmail) return;
                setAddingParentRole(true);
                try {
                  await addParentRoleToTeacherSSO(teacherAddParentEmail);
                  setTeacherAddParentEmail(null);
                } catch {
                  setTeacherAddParentEmail(null);
                } finally {
                  setAddingParentRole(false);
                }
              }}
            />
            {/* No button */}
            <Pressable accessibilityRole="button" style={(st: any) => [{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }, focusRing(t, st.focused)]} onPress={() => { setTeacherAddParentEmail(null); logout(); }}>
              <Text style={{ fontFamily: SANS, color: t.text, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' }}>No, sign out</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
