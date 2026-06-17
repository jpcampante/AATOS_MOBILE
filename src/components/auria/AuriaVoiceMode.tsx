import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type AuriaVoiceModeProps = {
  visible: boolean;
  onClose: () => void;
};

type Speaker = 'user' | 'auria';
type VoiceMessage = { id: string; role: Speaker; text: string };

const USE_NATIVE = Platform.OS !== 'web';

/** A serif voice — the AI line uses the platform serif, like the reference. */
const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, "Times New Roman", serif',
}) as string;

/** The bloom palettes — blue while you speak, warm peach while Auria speaks. */
const BLUE_STOPS = [
  { offset: '0%', color: '#6E9FE9', opacity: 0.82 },
  { offset: '30%', color: '#93B6EF', opacity: 0.5 },
  { offset: '58%', color: '#BCD4F4', opacity: 0.26 },
  { offset: '80%', color: '#DDE9F9', opacity: 0.1 },
  { offset: '100%', color: '#FAFAF9', opacity: 0 },
] as const;
const PINK_STOPS = [
  { offset: '0%', color: '#E2A089', opacity: 0.82 },
  { offset: '30%', color: '#ECBBA8', opacity: 0.5 },
  { offset: '58%', color: '#F3D3C6', opacity: 0.26 },
  { offset: '80%', color: '#F8E6DE', opacity: 0.1 },
  { offset: '100%', color: '#FAFAF9', opacity: 0 },
] as const;

const SCRIPT: ReadonlyArray<{ role: Speaker; text: string }> = [
  { role: 'user', text: 'Olá.' },
  { role: 'auria', text: 'Olá, Joao! Tudo bem? Como posso te ajudar hoje?' },
  { role: 'user', text: 'Preciso de organizar as tarefas de hoje.' },
  { role: 'auria', text: 'Tens três tarefas em risco hoje. Queres que comece pela mais urgente?' },
  { role: 'user', text: 'Sim, vamos a isso.' },
  { role: 'auria', text: 'E aí! Como vai? O que precisa?' },
];

export function AuriaVoiceMode({ visible, onClose }: AuriaVoiceModeProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <VoiceModeContent active={visible} onClose={onClose} />
    </Modal>
  );
}

function VoiceModeContent({ active, onClose }: { active: boolean; onClose: () => void }) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(ds, theme, safe.top, safe.bottom), [ds, theme, safe.top, safe.bottom]);
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<VoiceMessage[]>(() => [
    { id: 'v-0', role: 'user', text: SCRIPT[0].text },
    { id: 'v-1', role: 'auria', text: SCRIPT[1].text },
  ]);
  const [mode, setMode] = useState<'speaking' | 'listening'>('speaking');
  const [revealCount, setRevealCount] = useState(0);
  const stepRef = useRef(1);

  // Bloom drivers: amplitude (shared) + a crossfade between blue and pink.
  const level = useRef(new Animated.Value(0.4)).current;
  const blueOpacity = useRef(new Animated.Value(0)).current;
  const pinkOpacity = useRef(new Animated.Value(1)).current;

  const last = messages[messages.length - 1];

  // Crossfade the bloom: pink while Auria speaks, blue while listening to you.
  useEffect(() => {
    Animated.timing(blueOpacity, {
      toValue: mode === 'listening' ? 1 : 0,
      duration: 480,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: USE_NATIVE,
    }).start();
    Animated.timing(pinkOpacity, {
      toValue: mode === 'speaking' ? 1 : 0,
      duration: 480,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: USE_NATIVE,
    }).start();
  }, [mode, blueOpacity, pinkOpacity]);

  // Simulated audio amplitude — organic jitter while the conversation is live.
  useEffect(() => {
    if (!active) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      Animated.timing(level, {
        toValue: 0.4 + Math.random() * 0.6,
        duration: 150 + Math.random() * 190,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: USE_NATIVE,
      }).start(() => tick());
    };
    tick();
    return () => {
      running = false;
      level.stopAnimation();
    };
  }, [active, level]);

  // Turn-taking. Auria speaks (pink + word reveal), then it listens for you
  // (blue) before the next turn arrives — mirrors the real voice cadence.
  useEffect(() => {
    if (!active || !last) return;

    const advance = () => {
      stepRef.current += 1;
      const turn = SCRIPT[stepRef.current % SCRIPT.length];
      setMessages((prev) => {
        const next = [...prev, { id: `v-${stepRef.current}`, role: turn.role, text: turn.text }];
        return next.length > 3 ? next.slice(next.length - 3) : next;
      });
    };

    if (last.role === 'auria') {
      setMode('speaking');
      setRevealCount(0);
      const total = last.text.split(' ').length;
      let i = 0;
      const iv = setInterval(() => {
        i += 1;
        setRevealCount(i);
        if (i >= total) clearInterval(iv);
      }, 210);
      const revealMs = total * 210 + 200;
      const toListen = setTimeout(() => setMode('listening'), revealMs);
      const toNext = setTimeout(advance, revealMs + 1800);
      return () => {
        clearInterval(iv);
        clearTimeout(toListen);
        clearTimeout(toNext);
      };
    }

    // You are speaking — blue, no reveal.
    setMode('listening');
    setRevealCount(99);
    const toNext = setTimeout(advance, 2200);
    return () => clearTimeout(toNext);
  }, [active, last]);

  const handleMic = () => {
    setMessages((prev) => {
      const next = [...prev, { id: `v-mic-${Date.now()}`, role: 'user' as Speaker, text: 'Mostra-me o que precisa de atenção.' }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
  };

  const levelScale = level.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1.08] });
  const levelTranslate = level.interpolate({ inputRange: [0, 1], outputRange: [10, -26] });
  const levelOpacity = level.interpolate({ inputRange: [0, 1], outputRange: [0.74, 1] });
  const bloomHeight = Math.round(screenHeight * 0.66);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Audio-reactive bloom — sits behind the transcript and controls. */}
      <View style={[styles.bloomWrap, { height: bloomHeight }]} pointerEvents="none">
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: levelOpacity, transform: [{ translateY: levelTranslate }, { scaleY: levelScale }] },
          ]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: blueOpacity }]}>
            <BloomLayer id="voiceBloomBlue" stops={BLUE_STOPS} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: pinkOpacity }]}>
            <BloomLayer id="voiceBloomPink" stops={PINK_STOPS} />
          </Animated.View>
        </Animated.View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          if (message.role === 'user') {
            return (
              <View key={message.id} style={styles.userRow}>
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{message.text}</Text>
                </View>
              </View>
            );
          }
          return (
            <View key={message.id} style={styles.auriaBlock}>
              <AssistantLine text={message.text} revealCount={isLast ? revealCount : 99} styles={styles} />
              <View style={styles.feedbackRow}>
                <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Good response">
                  <AuriaIcon name="thumbUp" size={22} color={ds.gray400} strokeWidth={1.6} />
                </Pressable>
                <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Bad response">
                  <View style={styles.thumbDown}>
                    <AuriaIcon name="thumbUp" size={22} color={ds.gray400} strokeWidth={1.6} />
                  </View>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.controls} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => [styles.circleLight, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Voice settings"
        >
          <AuriaIcon name="settings" size={22} color={ds.gray600} strokeWidth={1.7} />
        </Pressable>

        <View style={styles.controlsRight}>
          <Pressable
            onPress={handleMic}
            style={({ pressed }) => [styles.circleLight, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Talk"
          >
            <AuriaIcon name="mic" size={22} color={ds.gray600} strokeWidth={1.7} />
          </Pressable>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.circleDark, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="End voice conversation"
          >
            <AuriaIcon name="close" size={20} color={ds.white} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function BloomLayer({
  id,
  stops,
}: {
  id: string;
  stops: ReadonlyArray<{ offset: string; color: string; opacity: number }>;
}) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="100%" rx="92%" ry="76%" fx="50%" fy="100%">
          {stops.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
          ))}
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function AssistantLine({
  text,
  revealCount,
  styles,
}: {
  text: string;
  revealCount: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const words = text.split(' ');
  return (
    <Text style={styles.auriaText}>
      {words.map((word, i) => (
        <Text key={`${word}-${i}`} style={i < revealCount ? styles.auriaSpoken : styles.auriaUpcoming}>
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </Text>
      ))}
    </Text>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeTop: number,
  safeBottom: number,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: ds.gray50,
    },
    bloomWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: safeTop + 18,
      paddingHorizontal: 24,
      paddingBottom: 200,
      gap: 22,
    },
    userRow: {
      alignItems: 'flex-end',
    },
    userBubble: {
      maxWidth: '80%',
      backgroundColor: theme.colors.pill,
      borderRadius: 19,
      paddingHorizontal: 17,
      paddingVertical: 10,
    },
    userText: {
      ...auriaTypography.body,
      fontSize: 17,
      color: theme.colors.pillText,
    },
    auriaBlock: {
      gap: 14,
    },
    auriaText: {
      fontFamily: SERIF,
      fontSize: 28,
      lineHeight: 37,
      letterSpacing: -0.2,
    },
    auriaSpoken: {
      fontFamily: SERIF,
      color: ds.gray900,
    },
    auriaUpcoming: {
      fontFamily: SERIF,
      color: '#BBB9B3',
    },
    feedbackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
    },
    thumbDown: {
      transform: [{ rotate: '180deg' }],
    },
    controls: {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: safeBottom + 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    controlsRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    circleLight: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: ds.white,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1A1A17',
      shadowOpacity: 0.1,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
    },
    circleDark: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: ds.offBlack,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1A1A17',
      shadowOpacity: 0.16,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
    },
    pressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.92,
    },
  });
}
