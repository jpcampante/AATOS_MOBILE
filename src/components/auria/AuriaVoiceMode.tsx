import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useMicLevel } from '../../features/auria/useMicLevel';
import { useWebSpeech } from '../../features/auria/useWebSpeech';

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
  { offset: '0%', color: '#6E9FE9', opacity: 0.92 },
  { offset: '26%', color: '#8FB4EF', opacity: 0.66 },
  { offset: '50%', color: '#B3CCF3', opacity: 0.4 },
  { offset: '74%', color: '#D4E3F8', opacity: 0.18 },
  { offset: '100%', color: '#FAFAF9', opacity: 0 },
] as const;
const PINK_STOPS = [
  { offset: '0%', color: '#E1A089', opacity: 0.92 },
  { offset: '26%', color: '#EAB7A4', opacity: 0.66 },
  { offset: '50%', color: '#F1CDBF', opacity: 0.4 },
  { offset: '74%', color: '#F7E2D9', opacity: 0.18 },
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
  const [recording, setRecording] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micNote, setMicNote] = useState<string | null>(null);
  const stepRef = useRef(1);
  const recordingRef = useRef(false);
  const liveTranscriptRef = useRef('');
  liveTranscriptRef.current = liveTranscript;

  // Bloom drivers: amplitude (shared) + a crossfade between blue and pink.
  const level = useRef(new Animated.Value(0.4)).current;
  const blueOpacity = useRef(new Animated.Value(0)).current;
  const pinkOpacity = useRef(new Animated.Value(1)).current;

  // Real microphone capture — the actual audio level drives the bloom.
  const onMicLevel = useCallback(
    (v: number) => {
      if (!recordingRef.current) return;
      level.setValue(0.15 + v * 0.85);
    },
    [level],
  );
  const mic = useMicLevel({ onLevel: onMicLevel });
  const speech = useWebSpeech({ lang: 'pt-PT', onTranscript: setLiveTranscript });

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

  // Simulated amplitude — drives the bloom until the real mic is capturing.
  useEffect(() => {
    if (!active || recording) return;
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
  }, [active, recording, level]);

  // Reveal + bloom colour for whatever Auria last said (demo or live reply).
  // Frozen while you record — then the bloom stays blue (you hold the floor).
  useEffect(() => {
    if (!active || recording || !last) return;
    if (last.role === 'auria') {
      setMode('speaking');
      setRevealCount(0);
      const total = last.text.split(' ').length;
      let i = 0;
      const iv = setInterval(() => {
        i += 1;
        if (i >= total) {
          setRevealCount(total + 5); // fully spoken — all black
          clearInterval(iv);
        } else {
          setRevealCount(i);
        }
      }, 190);
      const toListen = setTimeout(() => setMode('listening'), total * 190 + 200);
      return () => {
        clearInterval(iv);
        clearTimeout(toListen);
      };
    }
    setMode('listening');
    setRevealCount(99);
  }, [active, recording, last]);

  // Scripted auto-advance — only until you take over with the real mic.
  useEffect(() => {
    if (!active || interacted || recording || !last) return;
    const total = last.text.split(' ').length;
    const duration = last.role === 'auria' ? total * 190 + 200 + 1800 : 2200;
    const toNext = setTimeout(() => {
      stepRef.current += 1;
      const turn = SCRIPT[stepRef.current % SCRIPT.length];
      setMessages((prev) => {
        const next = [...prev, { id: `v-${stepRef.current}`, role: turn.role, text: turn.text }];
        return next.length > 3 ? next.slice(next.length - 3) : next;
      });
    }, duration);
    return () => clearTimeout(toNext);
  }, [active, interacted, recording, last]);

  const pushMessage = (role: Speaker, text: string) => {
    stepRef.current += 1;
    setMessages((prev) => {
      const next = [...prev, { id: `v-live-${stepRef.current}-${role}`, role, text }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
  };

  const ackReply = (text: string) => {
    if (/tarefa|task|organi|priorid/i.test(text)) {
      return 'Certo. Tens três tarefas em risco hoje — queres que comece pela mais urgente?';
    }
    if (/email|mail|responder/i.test(text)) {
      return 'Posso tratar disso. Diz-me o destinatário e o tom que queres dar.';
    }
    return 'Entendido. Vou tratar disso e aviso-te quando estiver pronto.';
  };

  const handleMic = async () => {
    if (recordingRef.current) {
      // Stop talking → finalize the transcript, then Auria replies.
      recordingRef.current = false;
      setRecording(false);
      speech.stop();
      mic.stop();
      const text = liveTranscriptRef.current.trim();
      setLiveTranscript('');
      if (text) {
        pushMessage('user', text);
        const reply = ackReply(text);
        setTimeout(() => pushMessage('auria', reply), 650);
      } else {
        setMode('listening');
      }
      return;
    }
    // Start talking → real capture drives the bloom + transcription.
    setMicNote(null);
    setInteracted(true);
    const ok = await mic.start();
    if (!ok) {
      setMicNote('Microfone indisponível ou sem permissão');
      setInteracted(false);
      return;
    }
    setLiveTranscript('');
    speech.start();
    recordingRef.current = true;
    setRecording(true);
    setMode('listening');
  };

  // The bloom reacts to the audio level: it glows brighter and rises taller.
  // Scale is anchored at the BOTTOM (transformOrigin) so the bottom edge stays
  // pinned to the screen edge — it grows upward only, never lifting into a line.
  const levelOpacity = level.interpolate({ inputRange: [0.2, 1], outputRange: [0.74, 1] });
  const levelScale = level.interpolate({ inputRange: [0.2, 1], outputRange: [0.9, 1.18] });
  const bloomHeight = Math.round(screenHeight * 0.82);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Audio-reactive bloom — bottom-anchored: grows upward, never seams. */}
      <View style={[styles.bloomWrap, { height: bloomHeight }]} pointerEvents="none">
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: levelOpacity, transformOrigin: 'center bottom', transform: [{ scaleY: levelScale }] },
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

        {recording ? (
          <View style={styles.userRow}>
            <View style={[styles.userBubble, styles.userBubbleLive]}>
              <Text style={styles.userText}>
                {liveTranscript || (speech.supported ? 'A ouvir…' : 'A ouvir o microfone…')}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {micNote ? (
        <View style={styles.micNote} pointerEvents="none">
          <Text style={styles.micNoteText}>{micNote}</Text>
        </View>
      ) : null}

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
            style={({ pressed }) => [
              styles.circleLight,
              recording && styles.circleRecording,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: recording }}
            accessibilityLabel={recording ? 'Stop talking' : 'Talk'}
          >
            <AuriaIcon name="mic" size={22} color={recording ? ds.white : ds.gray600} strokeWidth={1.7} />
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
        <RadialGradient id={id} cx="50%" cy="102%" rx="125%" ry="100%" fx="50%" fy="102%">
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
      {words.map((word, i) => {
        const wordStyle =
          i < revealCount - 1
            ? styles.auriaSpoken
            : i < revealCount
              ? styles.auriaCurrent
              : styles.auriaUpcoming;
        return (
          <Text key={`${word}-${i}`} style={wordStyle}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </Text>
        );
      })}
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
    userBubbleLive: {
      borderWidth: 1,
      borderColor: 'rgba(61, 123, 224, 0.55)',
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
    auriaCurrent: {
      fontFamily: SERIF,
      color: ds.gray600,
    },
    auriaUpcoming: {
      fontFamily: SERIF,
      color: ds.gray400,
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
    circleRecording: {
      backgroundColor: ds.auriaBlue,
    },
    pressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.92,
    },
    micNote: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: safeBottom + 88,
      alignItems: 'center',
    },
    micNoteText: {
      ...auriaTypography.body,
      fontSize: 12.5,
      color: ds.gray600,
      backgroundColor: ds.white,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 16,
      overflow: 'hidden',
    },
  });
}
