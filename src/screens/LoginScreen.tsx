import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { welcomeContent } from '../data/welcomeContent';
import { EmailCodeFlow } from '../components/auth/EmailCodeFlow';
import { ON_SHEET_MUTED } from '../components/auth/loginPalette';
import { RollingHeadline } from '../components/ui/RollingHeadline';
import { useAuth } from '../features/auth';
import { SUPPORTS_NATIVE_DRIVER, contentColors, dsFromTheme, useTheme, type AatosTheme } from '../theme';
import { tapLight, tapMedium } from '../utils/haptics';

const AATOS_IMAGOTYPE = require('../../assets/aatos-imagotype.png');

/** Staged boot reveal: blank white → logo → the ball → black login sheet. */
const STAGE = { WHITE: 0, LOGO: 1, BLOOM: 2, SHEET: 3 } as const;
type Stage = (typeof STAGE)[keyof typeof STAGE];

/** Beat timings (ms from mount) — each beat lands after the previous settles. */
const BOOT = { logo: 240, bloom: 820, sheet: 1320 } as const;

export function LoginScreen() {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(ds, theme, insets.bottom),
    [ds, theme, insets.bottom],
  );
  const { reason, clearReason } = useAuth();
  const [emailFlow, setEmailFlow] = useState(false);

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
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
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
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
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

  const startEmailFlow = () => {
    tapLight();
    clearReason();
    setEmailFlow(true);
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
          {emailFlow ? (
            <EmailCodeFlow onExit={() => setEmailFlow(false)} />
          ) : (
            <View style={styles.socialPanel}>
              {reason === 'session_ended' ? (
                <Animated.View style={cascade(0)}>
                  <Text style={styles.notice} accessibilityLiveRegion="polite">
                    Your session ended. Sign in again to continue.
                  </Text>
                </Animated.View>
              ) : null}

              <Animated.View style={cascade(0)}>
                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                  onPress={startEmailFlow}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with email"
                >
                  <Text style={styles.primaryButtonText}>Continue with email</Text>
                </Pressable>
              </Animated.View>

              <Animated.View style={cascade(0.12)}>
                <Text style={styles.footnote}>
                  New to AATOS? Use your work email and we’ll create your account.
                </Text>
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
    notice: {
      color: ON_SHEET_MUTED,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: ds.white,
      borderRadius: theme.radius.panel,
      minHeight: 52,
      paddingHorizontal: 20,
    },
    primaryButtonText: {
      color: contentColors.black,
      fontSize: 16,
      fontWeight: '600',
    },
    footnote: {
      color: ON_SHEET_MUTED,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      paddingHorizontal: 12,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.97 }],
    },
  });
}
