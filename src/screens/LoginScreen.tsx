import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { AppleLogo, GoogleLogo } from '../components/ui/SocialLogos';
import { tapMedium, tapSuccess } from '../utils/haptics';

type Tab = 'login' | 'register';

type LoginScreenProps = {
  onBack: () => void;
  onContinue: () => void;
};

export function LoginScreen({ onBack, onContinue }: LoginScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSuccess(null);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);
    setSuccess(tab === 'login' ? 'Sign-in simulated. Redirecting...' : 'Account created. Redirecting...');
    setTimeout(onContinue, 700);
  };

  // Apple / Google → enter the system directly, with an Apple-style haptic.
  const handleSocial = () => {
    tapMedium();
    tapSuccess();
    onContinue();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={theme.colors.statusBar} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backButtonText}>{'\u2190 Back'}</Text>
          </Pressable>

          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Text style={styles.logoEmoji}>{'\uD83D\uDCCB'}</Text>
              </View>
              <Text style={styles.title}>AATOS</Text>
              <Text style={styles.subtitle}>Project management</Text>
            </View>

            <View style={styles.socialGroup}>
              <Pressable
                style={({ pressed }) => [styles.appleButton, pressed && styles.socialPressed]}
                onPress={handleSocial}
                accessibilityRole="button"
                accessibilityLabel="Continue with Apple"
              >
                <AppleLogo size={18} color={theme.colors.surface} />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.googleButton, pressed && styles.socialPressed]}
                onPress={handleSocial}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                <GoogleLogo size={18} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.tabRow}>
              {(['login', 'register'] as Tab[]).map((value) => {
                const active = tab === value;
                return (
                  <Pressable
                    key={value}
                    style={[styles.tabButton, active && styles.tabButtonActive]}
                    onPress={() => {
                      setTab(value);
                      setSuccess(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                      {value === 'login' ? 'Sign in' : 'Register'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {tab === 'register' ? (
              <View style={styles.field}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Jane Smith"
                  placeholderTextColor={theme.colors.textHint}
                  style={styles.input}
                />
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="jane@company.com"
                placeholderTextColor={theme.colors.textHint}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={'\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                  placeholderTextColor={theme.colors.textHint}
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput]}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((value) => !value)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeButtonText}>{showPassword ? '\u25CF' : '\u25CB'}</Text>
                </Pressable>
              </View>
            </View>

            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {tab === 'login' ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={onContinue} accessibilityRole="button">
              <Text style={styles.skipText}>Continue without signing in (offline mode)</Text>
            </Pressable>

            <Text style={styles.noteText}>
              Authentication is not connected yet. These controls currently simulate the UI.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const { colors } = theme;
  const border = { borderWidth: 1, borderColor: colors.border } as const;
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.page },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    backButton: { alignSelf: 'flex-start', marginBottom: 16, paddingVertical: 8 },
    backButtonText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      gap: 16,
      ...border,
    },
    header: { alignItems: 'center' },
    logoBox: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.input,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      ...border,
    },
    logoEmoji: { fontSize: 24 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textTertiary, marginTop: 4 },
    socialGroup: {
      gap: 10,
    },
    appleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      ...border,
    },
    appleButtonText: {
      color: colors.surface,
      fontSize: 15,
      fontWeight: '700',
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.borderInput,
    },
    googleButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    socialPressed: {
      opacity: 0.85,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.divider,
    },
    dividerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.input,
      borderRadius: 14,
      padding: 4,
      gap: 4,
      ...border,
    },
    tabButton: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    tabButtonActive: { backgroundColor: colors.surface, ...border },
    tabButtonText: { fontSize: 13, fontWeight: '700', color: colors.textTertiary },
    tabButtonTextActive: { color: colors.text },
    field: { gap: 6 },
    label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    input: {
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.borderInput,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 15,
    },
    passwordRow: { position: 'relative' },
    passwordInput: { paddingRight: 48 },
    eyeButton: { position: 'absolute', right: 12, top: 10, padding: 4 },
    eyeButtonText: { fontSize: 16, color: colors.textSecondary },
    successBox: {
      backgroundColor: colors.hover,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: 10,
      padding: 12,
    },
    successText: { color: colors.success, fontSize: 13, lineHeight: 18 },
    submitButton: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
      ...border,
    },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
    skipText: {
      textAlign: 'center',
      color: colors.textTertiary,
      fontSize: 12,
      textDecorationLine: 'underline',
    },
    noteText: {
      textAlign: 'center',
      color: colors.textHint,
      fontSize: 11,
      lineHeight: 16,
    },
  });
}
