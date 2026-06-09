import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { welcomeContent } from '../data/welcomeContent';
import { AppleLogo, GoogleLogo } from '../components/ui/SocialLogos';
import { RotatingRevealText } from '../components/ui/RotatingRevealText';
import { FadeInUp } from '../components/ui/transitions';
import { tapMedium, tapSuccess } from '../utils/haptics';

type EmailMode = 'login' | 'register' | null;

type LoginScreenProps = {
  onContinue: () => void;
  onBack?: () => void;
};

const SHEET_BG = '#000000';
const SHEET_MUTED = '#2B2B2B';
const HERO_BG = '#FFFFFF';

const SHEET_EASE = Easing.bezier(0.32, 0.72, 0, 1); // iOS drawer curve

export function LoginScreen({ onBack, onContinue }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.bottom), [insets.bottom]);
  const [emailMode, setEmailMode] = useState<EmailMode>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Sheet slides up from the bottom edge once the hero has settled.
  const sheetIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(sheetIn, {
      toValue: 1,
      duration: 520,
      delay: 120,
      easing: SHEET_EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [sheetIn]);

  const sheetTranslate = sheetIn.interpolate({ inputRange: [0, 1], outputRange: [64, 0] });

  const handleSocial = () => {
    tapMedium();
    tapSuccess();
    onContinue();
  };

  const handleEmailSubmit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);
    onContinue();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.hero}>
        {onBack ? (
          <Pressable
            style={styles.closeButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        ) : null}

        <RotatingRevealText
          phrases={welcomeContent.loginPhrases}
          textStyle={styles.heroText}
          coverColor={HERO_BG}
          dotColor="#000000"
          dotSize={40}
          dotGap={12}
          holdMs={3200}
          revealMs={1900}
          coverMs={1200}
          introMs={450}
          singleLine
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <Animated.View
          style={[
            styles.sheet,
            { opacity: sheetIn, transform: [{ translateY: sheetTranslate }] },
          ]}
        >
          {emailMode ? (
            <View style={styles.emailPanel}>
              <Pressable
                onPress={() => setEmailMode(null)}
                style={styles.emailBack}
                accessibilityRole="button"
              >
                <Text style={styles.emailBackText}>← Back</Text>
              </Pressable>

              {emailMode === 'register' ? (
                <View style={styles.field}>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Full name"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                  />
                </View>
              ) : null}

              <View style={styles.field}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <Pressable
                style={[styles.sheetButtonMuted, loading && styles.buttonDisabled]}
                onPress={handleEmailSubmit}
                disabled={loading}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.sheetButtonMutedText}>
                    {emailMode === 'login' ? 'Log in' : 'Sign up'}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.socialPanel}>
              <FadeInUp delay={240} distance={14}>
                <Pressable
                  style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}
                  onPress={handleSocial}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple"
                >
                  <AppleLogo size={18} color="#000000" />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </Pressable>
              </FadeInUp>

              <FadeInUp delay={300} distance={14}>
                <Pressable
                  style={({ pressed }) => [styles.sheetButtonMuted, pressed && styles.pressed]}
                  onPress={handleSocial}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  <GoogleLogo size={18} />
                  <Text style={styles.sheetButtonMutedText}>Continue with Google</Text>
                </Pressable>
              </FadeInUp>

              <FadeInUp delay={360} distance={14}>
                <Pressable
                  style={({ pressed }) => [styles.sheetButtonMuted, pressed && styles.pressed]}
                  onPress={() => setEmailMode('register')}
                  accessibilityRole="button"
                >
                  <Text style={styles.sheetButtonMutedText}>Sign up</Text>
                </Pressable>
              </FadeInUp>

              <FadeInUp delay={420} distance={14}>
                <Pressable
                  style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
                  onPress={() => setEmailMode('login')}
                  accessibilityRole="button"
                >
                  <Text style={styles.outlineButtonText}>Log in</Text>
                </Pressable>
              </FadeInUp>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>

      <SafeAreaView edges={['bottom']} style={styles.safeBottom} />
    </View>
  );
}

function createStyles(safeBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: HERO_BG,
    },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingTop: 8,
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeIcon: {
      fontSize: 22,
      lineHeight: 24,
      color: '#333333',
      fontWeight: '300',
    },
    heroText: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '700',
      color: '#000000',
      letterSpacing: -0.5,
    },
    sheetWrap: {
      flexShrink: 0,
    },
    sheet: {
      backgroundColor: SHEET_BG,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: Math.max(safeBottom, 20) + 12,
    },
    socialPanel: {
      gap: 12,
    },
    emailPanel: {
      gap: 12,
    },
    emailBack: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
      marginBottom: 4,
    },
    emailBackText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 15,
      fontWeight: '600',
    },
    appleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      minHeight: 52,
      paddingHorizontal: 20,
    },
    appleButtonText: {
      color: '#000000',
      fontSize: 16,
      fontWeight: '600',
    },
    sheetButtonMuted: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: SHEET_MUTED,
      borderRadius: 28,
      minHeight: 52,
      paddingHorizontal: 20,
    },
    sheetButtonMutedText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    outlineButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 28,
      minHeight: 52,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      backgroundColor: 'transparent',
    },
    outlineButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    field: {
      width: '100%',
    },
    input: {
      backgroundColor: SHEET_MUTED,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: '#FFFFFF',
      fontSize: 16,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    safeBottom: {
      backgroundColor: SHEET_BG,
    },
  });
}
