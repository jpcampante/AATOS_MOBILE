import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { welcomeContent } from '../data/welcomeContent';
import { AppleLogo, GoogleLogo } from '../components/ui/SocialLogos';
import { RollingHeadline } from '../components/ui/RollingHeadline';
import { contentColors, dsFromTheme, useTheme, type AatosTheme } from '../theme';
import { tapLight, tapMedium, tapSuccess } from '../utils/haptics';

type EmailMode = 'login' | 'register' | null;

type LoginScreenProps = {
  onContinue: () => void;
};

const AATOS_IMAGOTYPE = require('../../assets/aatos-imagotype.png');

/**
 * Fixed brand palette for the pre-auth login: a white hero over a pure-black
 * sheet, always light. These are deliberate white-on-black brand values, not
 * theme-driven — only the semantic whites/blacks/radii come from the theme.
 */
const SHEET_MUTED = '#2B2B2B';
const ON_SHEET_MUTED = 'rgba(255, 255, 255, 0.70)';
const ON_SHEET_FAINT = 'rgba(255, 255, 255, 0.45)';
const SHEET_BORDER = 'rgba(255, 255, 255, 0.35)';

/** Staged boot reveal: blank white → logo → the ball → black login sheet. */
const STAGE = { WHITE: 0, LOGO: 1, BLOOM: 2, SHEET: 3 } as const;
type Stage = (typeof STAGE)[keyof typeof STAGE];

/** Beat timings (ms from mount) — each beat lands after the previous settles. */
const BOOT = { logo: 240, bloom: 820, sheet: 1320 } as const;

export function LoginScreen({ onContinue }: LoginScreenProps) {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(ds, theme, insets.bottom),
    [ds, theme, insets.bottom],
  );
  const [emailMode, setEmailMode] = useState<EmailMode>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Boot stages decide what is visible; the animated values decide how it moves.
  const [stage, setStage] = useState<Stage>(STAGE.WHITE);
  const [sheetHeight, setSheetHeight] = useState(420);
  const logoIn = useRef(new Animated.Value(0)).current;
  const sheetIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo pops onto the blank white canvas (spring overshoot = weight).
    const toLogo = setTimeout(() => {
      setStage(STAGE.LOGO);
      Animated.spring(logoIn, {
        toValue: 1,
        stiffness: 170,
        damping: 13,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
    }, BOOT.logo);

    // 2. The ball + headline take over (handled inside BloomHeadline).
    const toBloom = setTimeout(() => setStage(STAGE.BLOOM), BOOT.bloom);

    // 3. The black sheet springs up from below; the buttons cascade with it.
    const toSheet = setTimeout(() => {
      setStage(STAGE.SHEET);
      tapMedium();
      Animated.spring(sheetIn, {
        toValue: 1,
        stiffness: 120,
        damping: 18,
        mass: 1,
        restDisplacementThreshold: 0.4,
        useNativeDriver: true,
      }).start();
    }, BOOT.sheet);

    return () => {
      clearTimeout(toLogo);
      clearTimeout(toBloom);
      clearTimeout(toSheet);
    };
  }, [logoIn, sheetIn]);

  const logoScale = logoIn.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const logoTranslate = logoIn.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  // Sheet starts fully below the screen edge (its own height) and springs to rest.
  const sheetTranslate = sheetIn.interpolate({ inputRange: [0, 1], outputRange: [sheetHeight, 0] });
  // Hero drifts up a touch as the sheet rises — keeps the scene alive, no reflow.
  const heroLift = sheetIn.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  // Each button fades + rises in sequence, driven by the sheet's own progress.
  const cascade = (start: number) => ({
    opacity: sheetIn.interpolate({
      inputRange: [start, start + 0.4],
      outputRange: [0, 1],
      extrapolate: 'clamp' as const,
    }),
    transform: [
      {
        translateY: sheetIn.interpolate({
          inputRange: [start, start + 0.4],
          outputRange: [20, 0],
          extrapolate: 'clamp' as const,
        }),
      },
    ],
  });

  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = Math.ceil(e.nativeEvent.layout.height);
    if (h > 0 && h !== sheetHeight) setSheetHeight(h);
  };

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
      <StatusBar style={theme.colors.statusBar} />

      <Animated.View style={[styles.hero, { transform: [{ translateY: heroLift }] }]}>
        <View style={styles.heroContent}>
          <Animated.View
            style={[
              styles.logoReveal,
              {
                opacity: logoIn,
                transform: [{ translateY: logoTranslate }, { scale: logoScale }],
              },
            ]}
          >
            <Image
              source={AATOS_IMAGOTYPE}
              resizeMode="contain"
              style={styles.logo}
              accessibilityLabel="AATOS"
            />
          </Animated.View>

          {/* Fixed-height slot reserves room so the logo never jumps. */}
          <View style={styles.heroTextSlot}>
            <RollingHeadline
              leadWords={welcomeContent.leadWords}
              trailWords={welcomeContent.trailWords}
              textStyle={styles.heroText}
              intervalMs={2400}
              started={stage >= STAGE.BLOOM}
            />
          </View>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <Animated.View
          onLayout={onSheetLayout}
          style={[
            styles.sheet,
            // Plain (non-animated) opacity tied to the stage so the sheet is
            // never painted before it should rise — kills the first-frame flash
            // where the transform isn't applied yet. It is fully off-screen at
            // the moment this flips to 1, so the flip itself is invisible.
            { opacity: stage >= STAGE.SHEET ? 1 : 0, transform: [{ translateY: sheetTranslate }] },
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
                    placeholderTextColor={ON_SHEET_FAINT}
                    style={styles.input}
                  />
                </View>
              ) : null}

              <View style={styles.field}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={ON_SHEET_FAINT}
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
                  placeholderTextColor={ON_SHEET_FAINT}
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
                  <ActivityIndicator color={ds.white} />
                ) : (
                  <Text style={styles.sheetButtonMutedText}>
                    {emailMode === 'login' ? 'Log in' : 'Sign up'}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.socialPanel}>
              <Animated.View style={cascade(0)}>
                <Pressable
                  style={({ pressed }) => [styles.appleButton, pressed && styles.pressed]}
                  onPress={handleSocial}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple"
                >
                  <AppleLogo size={18} color={contentColors.black} />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </Pressable>
              </Animated.View>

              <Animated.View style={cascade(0.12)}>
                <Pressable
                  style={({ pressed }) => [styles.sheetButtonMuted, pressed && styles.pressed]}
                  onPress={handleSocial}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  <GoogleLogo size={18} />
                  <Text style={styles.sheetButtonMutedText}>Continue with Google</Text>
                </Pressable>
              </Animated.View>

              <Animated.View style={cascade(0.24)}>
                <Pressable
                  style={({ pressed }) => [styles.sheetButtonMuted, pressed && styles.pressed]}
                  onPress={() => {
                    tapLight();
                    setEmailMode('register');
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.sheetButtonMutedText}>Sign up</Text>
                </Pressable>
              </Animated.View>

              <Animated.View style={cascade(0.36)}>
                <Pressable
                  style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
                  onPress={() => {
                    tapLight();
                    setEmailMode('login');
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.outlineButtonText}>Log in</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(ds: ReturnType<typeof dsFromTheme>, theme: AatosTheme, safeBottom: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: ds.white,
      overflow: 'hidden',
    },
    hero: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingTop: 8,
    },
    heroContent: {
      width: '100%',
      alignItems: 'center',
      gap: 22,
    },
    logoReveal: {
      width: '100%',
      alignItems: 'center',
    },
    heroTextSlot: {
      width: '100%',
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: '72%',
      maxWidth: 248,
      height: 52,
    },
    heroText: {
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '700',
      color: contentColors.black,
      letterSpacing: -0.5,
    },
    sheetWrap: {
      flexShrink: 0,
    },
    sheet: {
      backgroundColor: contentColors.black,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 20,
      paddingTop: 26,
      paddingBottom: Math.max(safeBottom, 16) + 14,
      // Keep the rounded layer crisp so its antialiased edge doesn't bleed a
      // 1px seam while the sheet is transformed up (a react-native-web artifact).
      backfaceVisibility: 'hidden',
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
      color: ON_SHEET_MUTED,
      fontSize: 15,
      fontWeight: '600',
    },
    appleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: ds.white,
      borderRadius: theme.radius.panel,
      minHeight: 52,
      paddingHorizontal: 20,
    },
    appleButtonText: {
      color: contentColors.black,
      fontSize: 16,
      fontWeight: '600',
    },
    sheetButtonMuted: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: SHEET_MUTED,
      borderRadius: theme.radius.panel,
      minHeight: 52,
      paddingHorizontal: 20,
    },
    sheetButtonMutedText: {
      color: ds.white,
      fontSize: 16,
      fontWeight: '600',
    },
    outlineButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.panel,
      minHeight: 52,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: SHEET_BORDER,
      backgroundColor: 'transparent',
    },
    outlineButtonText: {
      color: ds.white,
      fontSize: 16,
      fontWeight: '600',
    },
    field: {
      width: '100%',
    },
    input: {
      backgroundColor: SHEET_MUTED,
      borderRadius: theme.radius.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      color: ds.white,
      fontSize: 16,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    },
    buttonDisabled: {
      opacity: 0.7,
    },
  });
}
