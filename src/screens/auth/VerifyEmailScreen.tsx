import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AUTH_SERVER_URL from '../../config/authServerUrl';
import {
  HomeThemeProvider, useHomeTheme, AuthShell, AuthCard, AuthHeading, Notice, PrimaryButton, OutlineButton, TextLink, EnvelopeArt, Decorative, ShapeFrame, Sparks, SANS,
} from './authTheme';

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function VerifyEmailScreen() {
  return (
    <HomeThemeProvider>
      <VerifyEmailContent />
    </HomeThemeProvider>
  );
}

function VerifyEmailContent() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useHomeTheme();

  const [cooldown, setCooldown] = useState(0);
  const [verifyError, setVerifyError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const verifiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (verifiedTimeoutRef.current) clearTimeout(verifiedTimeoutRef.current); }, []);

  // Poll every 2s — the moment user clicks the email link (any browser/device),
  // server marks them verified and this screen auto-advances to Onboarding.
  useEffect(() => {
    if (!user?.email) return;

    const checkVerified = async () => {
      try {
        const res = await fetch(`${AUTH_SERVER_URL}/user/check-verified?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.verified) {
            // A plain updateUser() merge only flips emailVerified on the
            // already-cached user object — onboardingComplete stays whatever
            // was cached (possibly stale), which can send a genuinely new
            // user to the wrong screen. A full reload re-triggers Firebase's
            // onAuthStateChanged, which re-derives onboardingComplete fresh
            // from Supabase — the same authoritative path Google sign-in
            // already uses (see VerifySuccessPage.goToApp in App.tsx, the
            // proven-working equivalent of this flow).
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.reload();
            } else {
              updateUser({ emailVerified: true });
            }
          }
        }
      } catch {}
    };

    const poll = setInterval(checkVerified, 2000);

    // Safari (macOS/iOS) throttles/suspends setInterval in background tabs —
    // when the user verifies in another tab and switches back here, re-check
    // immediately instead of waiting on a possibly-stalled interval.
    const onFocus = () => checkVerified();
    const onVisibility = () => { if (document.visibilityState === 'visible') checkVerified(); };
    // The /verify-success tab (opened from the email link) writes to
    // localStorage on success — the 'storage' event fires here even while
    // this tab is in the background, so we react the instant it's verified
    // instead of waiting for the user to switch back.
    const onStorage = (e: StorageEvent) => { if (e.key === 'aivorah_email_verified_ping') checkVerified(); };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('storage', onStorage);
    }

    return () => {
      clearInterval(poll);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('storage', onStorage);
      }
    };
  }, [user?.email]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || !user?.email) return;
    try {
      const frontendOrigin = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : 'https://aivorah.ai';
      await fetch(`${AUTH_SERVER_URL}/user/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.name || 'there', frontendOrigin }),
      });
      setCooldown(30);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: any) {
      setVerifyError('Failed to resend. Please try again.');
    }
  }

  async function handleVerified() {
    if (!user?.email) return;
    setChecking(true);
    setVerifyError('');
    try {
      // Only check our Supabase-based verification (accountStatus = 'active')
      // Do NOT fallback to Firebase emailVerified — Google SSO users are always
      // verified by Firebase but must still click the Aivorah activation link
      const res = await fetch(`${AUTH_SERVER_URL}/user/check-verified?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.verified) {
          setVerifiedSuccess(true);
          // See the poll handler above for why a reload (not a plain
          // updateUser merge) is needed on web to get a correct
          // onboardingComplete instead of a possibly-stale cached value.
          // Tracked in a ref and cleared on unmount so it can't fire after
          // this screen is gone (e.g. in tests, or if the user navigates
          // away in the 1.2s window) and touch stale/torn-down state.
          verifiedTimeoutRef.current = setTimeout(() => {
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.reload();
            } else {
              updateUser({ emailVerified: true });
            }
          }, 1200);
          return;
        }
      }
      setVerifyError('Email not yet verified. Please check your inbox and click the activation link.');
    } catch (err: any) {
      setVerifyError(err.message || 'Something went wrong.');
    } finally {
      setChecking(false);
    }
  }


  return (
    <AuthShell>
      <ShapeFrame style={{ maxWidth: 500, alignSelf: 'center' }}>
        <AuthCard maxWidth={500} style={{ alignItems: 'center' }}>
          {/* Illustration: the envelope opens once */}
          <Decorative style={{ marginBottom: 14, marginTop: 4, flexDirection: 'row', alignItems: 'flex-start' }}>
            <EnvelopeArt width={120} />
            <View style={{ marginLeft: 2, marginTop: -6 }}><Sparks size={28} /></View>
          </Decorative>

          <View style={{ width: '100%' }}>
            <AuthHeading title="Check your inbox" subtitle="We sent a verification link to" ornament={false} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.infoBg, borderRadius: 999, borderWidth: 1, borderColor: t.infoLine, paddingHorizontal: 16, paddingVertical: 8, marginTop: -8, marginBottom: 14, maxWidth: '100%' }}>
            <Text style={{ fontFamily: SANS, fontSize: 15, fontWeight: '700', color: t.heading, flexShrink: 1 }} numberOfLines={1}>{user?.email || 'your email'}</Text>
          </View>
          <Text style={{ fontFamily: SANS, fontSize: 15, lineHeight: 22, color: t.muted, textAlign: 'center', marginBottom: 18 }}>
            Open the email and click the link to verify your account, then come back here.
          </Text>

          <View style={{ width: '100%' }}>
            {/* Spam folder warning */}
            <Notice kind="warn">
              <Text style={{ fontFamily: SANS, fontSize: 14, fontWeight: '700', color: t.accent, marginBottom: 3 }}>Can&apos;t find the email?</Text>
              <Text style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 20, color: t.text }}>
                Check your <Text style={{ fontWeight: '700' }}>Spam</Text> or <Text style={{ fontWeight: '700' }}>Junk</Text> folder.
                Gmail and Outlook sometimes filter verification emails. If you find it there, mark it as &quot;Not Spam&quot; to receive future emails.
              </Text>
            </Notice>

            {/* Error or success */}
            {verifyError !== '' && <Notice kind="error">{verifyError}</Notice>}
            {resendSuccess && <Notice kind="success">Verification email sent!</Notice>}
            {verifiedSuccess && <Notice kind="success">Email verified! Taking you in...</Notice>}

            {/* I've Verified */}
            <PrimaryButton
              label={checking ? 'Checking...' : "I've Verified My Email"}
              icon={checking ? undefined : 'check'}
              onPress={handleVerified}
              disabled={checking}
              style={{ marginBottom: 12 }}
            />

            {/* Resend */}
            <OutlineButton
              label={cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Email'}
              icon="refresh-cw"
              onPress={handleResend}
              disabled={cooldown > 0}
            />
          </View>

          {/* Sign out */}
          <View style={{ marginTop: 18 }}>
            <TextLink label="Sign out" onPress={logout} />
          </View>
        </AuthCard>
      </ShapeFrame>
    </AuthShell>
  );
}
