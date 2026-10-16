import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../features/auth';
import { authErrorMessage, codeIsDead } from '../../features/auth/messages';
import { contentColors, dsFromTheme, useTheme, type AatosTheme } from '../../theme';
import { tapLight, tapSuccess } from '../../utils/haptics';
import { CodeInput, CODE_LENGTH, type CodeInputHandle } from './CodeInput';
import { ON_SHEET_FAINT, ON_SHEET_MUTED, SHEET_ERROR, SHEET_MUTED } from './loginPalette';

type Step =
  | { name: 'email' }
  | { name: 'fullName' }
  | { name: 'code'; challengeId: string; resendAt: number };

type EmailCodeFlowProps = {
  /** Leaves the flow (back to the welcome buttons). */
  onExit: () => void;
};

/** Email → (name, for new accounts) → 6-digit code, all inside the app. */
export function EmailCodeFlow({ onExit }: EmailCodeFlowProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const auth = useAuth();

  const [step, setStep] = useState<Step>({ name: 'email' });
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const verifying = useRef(false);
  const codeRef = useRef<CodeInputHandle>(null);

  const goBack = () => {
    setError(null);
    if (step.name === 'email') onExit();
    else {
      setCode('');
      setStep({ name: 'email' });
    }
    return true;
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  });

  // The field blurs while a request is in flight; give the keyboard back after.
  // Deferred: on Android the native field only accepts focus once `editable`
  // is back on, which lands a frame after this render.
  useEffect(() => {
    if (step.name !== 'code' || busy) return;
    const timer = setTimeout(() => codeRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [busy, step.name]);

  // Ticks the resend countdown while on the code step.
  useEffect(() => {
    if (step.name !== 'code') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step.name]);

  const sendCode = async (name?: string) => {
    const address = email.trim();
    if (!address) {
      setError('Enter your email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await auth.requestCode(address, name);
      if (result.kind === 'needName') {
        setStep({ name: 'fullName' });
      } else {
        tapLight();
        setCode('');
        setStep({ name: 'code', challengeId: result.challengeId, resendAt: Date.now() + result.resendAfter * 1000 });
        setNow(Date.now());
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value: string) => {
    if (step.name !== 'code' || verifying.current || value.length !== CODE_LENGTH) return;
    verifying.current = true;
    setBusy(true);
    setError(null);
    try {
      await auth.verifyCode(step.challengeId, value);
      tapSuccess();
      // App.tsx swaps this screen out as soon as the session is signed in.
    } catch (e) {
      setError(authErrorMessage(e));
      setCode('');
      if (codeIsDead(e)) setStep({ ...step, resendAt: 0 });
    } finally {
      verifying.current = false;
      setBusy(false);
    }
  };

  const resendIn = step.name === 'code' ? Math.max(0, Math.ceil((step.resendAt - now) / 1000)) : 0;
  const nameForResend = fullName.trim() || undefined;

  return (
    <View style={styles.panel}>
      <Pressable onPress={goBack} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {step.name === 'email' ? (
        <>
          <Text style={styles.title}>Continue with email</Text>
          <Text style={styles.subtitle}>We’ll send you a sign-in code.</Text>
          <TextInput
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (error) setError(null);
            }}
            placeholder="Email"
            placeholderTextColor={ON_SHEET_FAINT}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={() => sendCode()}
            editable={!busy}
            autoFocus
            accessibilityLabel="Email"
            style={styles.input}
          />
        </>
      ) : null}

      {step.name === 'fullName' ? (
        <>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>{email.trim()} is new to AATOS. What’s your name?</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={ON_SHEET_FAINT}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="send"
            onSubmitEditing={() => fullName.trim() && sendCode(fullName.trim())}
            editable={!busy}
            autoFocus
            accessibilityLabel="Full name"
            style={styles.input}
          />
        </>
      ) : null}

      {step.name === 'code' ? (
        <>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code we sent to {email.trim()}.</Text>
          <CodeInput
            ref={codeRef}
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            onComplete={verify}
            editable={!busy}
            hasError={!!error}
            colors={{ box: SHEET_MUTED, boxActive: ds.white, boxError: SHEET_ERROR, text: ds.white }}
          />
        </>
      ) : null}

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {step.name === 'code' ? (
        <View style={styles.codeActions}>
          {busy ? <ActivityIndicator color={ds.white} /> : null}
          <Pressable
            onPress={() => sendCode(nameForResend)}
            disabled={busy || resendIn > 0}
            accessibilityRole="button"
            style={styles.linkButton}
          >
            <Text style={[styles.linkText, (busy || resendIn > 0) && styles.linkDisabled]}>
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </Text>
          </Pressable>
          <Pressable onPress={goBack} accessibilityRole="button" style={styles.linkButton}>
            <Text style={styles.linkText}>Use a different email</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.primary, (busy || pressed) && styles.primaryDim]}
          onPress={() => sendCode(step.name === 'fullName' ? fullName.trim() || undefined : undefined)}
          disabled={busy || (step.name === 'fullName' && !fullName.trim())}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={contentColors.black} />
          ) : (
            <Text style={styles.primaryText}>Send code</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

function createStyles(ds: ReturnType<typeof dsFromTheme>, theme: AatosTheme) {
  return StyleSheet.create({
    panel: {
      gap: 12,
    },
    back: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
      minHeight: 32,
      justifyContent: 'center',
    },
    backText: {
      color: ON_SHEET_MUTED,
      fontSize: 15,
      fontWeight: '600',
    },
    title: {
      color: ds.white,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    subtitle: {
      color: ON_SHEET_MUTED,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 4,
    },
    input: {
      backgroundColor: SHEET_MUTED,
      borderRadius: theme.radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: ds.white,
      fontSize: 16,
    },
    error: {
      color: SHEET_ERROR,
      fontSize: 14,
      lineHeight: 20,
    },
    primary: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
      borderRadius: theme.radius.panel,
      minHeight: 52,
      paddingHorizontal: 20,
      marginTop: 4,
    },
    primaryDim: {
      opacity: 0.8,
    },
    primaryText: {
      color: contentColors.black,
      fontSize: 16,
      fontWeight: '600',
    },
    codeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    linkButton: {
      minHeight: 44,
      justifyContent: 'center',
    },
    linkText: {
      color: ds.white,
      fontSize: 15,
      fontWeight: '600',
    },
    linkDisabled: {
      color: ON_SHEET_FAINT,
    },
  });
}
