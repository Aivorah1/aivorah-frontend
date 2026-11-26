import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import ActivityIndicator from '../../components/common/AivorahLoader';
import { Feather } from '@expo/vector-icons';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../config/firebase';
import {
  HomeThemeProvider, useHomeTheme, AuthShell, AuthCard, AuthField, PasswordEye, PrimaryButton, Notice, ShapeFrame,
  Decorative, PencilArt, SANS, SERIF,
} from './authTheme';

// Opened from the password-reset email. Same look as Sign In (Website Redesign, Phase 2).
export default function ResetPasswordScreen() {
  return (
    <HomeThemeProvider>
      <ResetPasswordContent />
    </HomeThemeProvider>
  );
}

function goHome() { if (typeof window !== 'undefined') window.location.replace('/'); }

function StatusIcon({ name, color, bg }: { name: string; color: string; bg: string }) {
  return (
    <View style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, alignSelf: 'center', marginBottom: 12 }}>
      <Feather name={name as any} size={26} color={color} />
    </View>
  );
}

function ResetPasswordContent() {
  const { t } = useHomeTheme();
  const [oobCode, setOobCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time init from URL on mount, external sync
    if (Platform.OS !== 'web' || typeof window === 'undefined') { setStatus('error'); setError('This page must be opened in a browser.'); return; }
    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    if (!code) { setStatus('error'); setError('Invalid or expired reset link.'); return; }
    setOobCode(code);
    verifyPasswordResetCode(auth, code)
      .then(em => { setEmail(em); setStatus('ready'); })
      .catch(() => { setStatus('error'); setError('This link has expired or already been used. Please request a new one.'); });
  }, []);

  async function handleReset() {
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true); setError('');
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus('success');
    } catch (e: any) {
      setError(e.message || 'Failed to reset password. Please try again.');
    } finally { setSaving(false); }
  }

  const title = { fontFamily: SERIF, fontSize: 30, lineHeight: 34, fontWeight: '600' as const, color: t.heading, textAlign: 'center' as const, marginBottom: 8 };
  const body = { fontFamily: SANS, fontSize: 15, lineHeight: 22, color: t.text, textAlign: 'center' as const, marginBottom: 18 };

  return (
    <AuthShell>
      <ShapeFrame style={{ maxWidth: 460, alignSelf: 'center' }}>
        <AuthCard maxWidth={460}>
          <Decorative style={{ position: 'absolute', top: -34, left: -12 }}><PencilArt width={52} /></Decorative>

          {status === 'loading' && (
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
              <ActivityIndicator color={t.primary} size="large" />
              <Text style={[body, { marginBottom: 0 }]}>Verifying link...</Text>
            </View>
          )}

          {status === 'error' && (
            <View>
              <StatusIcon name="alert-circle" color={t.danger} bg={t.dangerSoft} />
              <Text accessibilityRole="header" style={title}>Link Expired</Text>
              <Text style={body}>{error}</Text>
              <PrimaryButton label="Back to App" onPress={goHome} />
            </View>
          )}

          {status === 'ready' && (
            <View>
              <StatusIcon name="lock" color={t.heading} bg={t.infoBg} />
              <Text accessibilityRole="header" style={title}>Reset Password</Text>
              <Text style={body}>Setting new password for{'\n'}<Text style={{ color: t.heading, fontWeight: '700' }}>{email}</Text></Text>

              <AuthField
                label="New Password" value={password} onChangeText={v => { setPassword(v); setError(''); }}
                placeholder="Min. 6 characters" secureTextEntry={!showPw} autoFocus autoComplete="new-password" textContentType="newPassword"
                invalid={!!error && (!password || password.length < 6)}
                rightEl={<PasswordEye shown={showPw} onToggle={() => setShowPw(v => !v)} />}
              />
              <AuthField
                label="Confirm Password" value={confirm} onChangeText={v => { setConfirm(v); setError(''); }}
                placeholder="Re-enter your password" secureTextEntry={!showPw} autoComplete="new-password" textContentType="newPassword"
                onSubmitEditing={handleReset} returnKeyType="go"
                invalid={!!error && password !== confirm}
              />

              {error ? <Notice kind="error">{error}</Notice> : null}

              <PrimaryButton label="Save New Password" onPress={handleReset} loading={saving} />
            </View>
          )}

          {status === 'success' && (
            <View>
              <StatusIcon name="check-circle" color={t.success} bg={t.successSoft} />
              <Text accessibilityRole="header" style={title}>Password Updated!</Text>
              <Text style={body}>Your password has been reset successfully.</Text>
              <PrimaryButton label="Back to Sign In" onPress={goHome} />
            </View>
          )}
        </AuthCard>
      </ShapeFrame>
    </AuthShell>
  );
}
