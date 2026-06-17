import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { tapLight } from '../../utils/haptics';
import { SUPPORTS_NATIVE_DRIVER, motionDuration, motionEasing } from '../../theme';

type RollingHeadlineProps = {
  /** Left column — rolls upward. */
  leadWords: string[];
  /** Right column — rolls downward. */
  trailWords: string[];
  textStyle?: StyleProp<TextStyle>;
  /** ms each pair holds before the next roll. */
  intervalMs?: number;
  /** Gate — only starts rolling once true (drives the boot sequence beat). */
  started?: boolean;
};

/** Headline fade-in once the boot sequence reaches its beat. */
const ENTER_DURATION = 420;

/**
 * Two-word slot machine: the lead word rolls up and the trail word rolls down,
 * in sync, so each beat lands a fresh combination ("Move faster" → "Think
 * bigger" → …). Each column is clipped to one line, so words roll in and out
 * like a split-flap. No measuring guesswork — each column is sized to its
 * widest word so the pair never jitters horizontally.
 */
export function RollingHeadline({
  leadWords,
  trailWords,
  textStyle,
  intervalMs = 2400,
  started = true,
}: RollingHeadlineProps) {
  const flat = StyleSheet.flatten(textStyle) ?? {};
  const lineHeight =
    typeof flat.lineHeight === 'number'
      ? flat.lineHeight
      : typeof flat.fontSize === 'number'
        ? Math.round(flat.fontSize * 1.2)
        : 40;
  const gap = typeof flat.fontSize === 'number' ? Math.round(flat.fontSize * 0.28) : 10;

  const [leadWidth, setLeadWidth] = useState(0);
  const [trailWidth, setTrailWidth] = useState(0);
  const measured = leadWidth > 0 && trailWidth > 0;

  const [step, setStep] = useState(0);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!started) return;
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_DURATION,
      easing: motionEasing.emphasized,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [started, enter]);

  useEffect(() => {
    if (!started || !measured) return;
    const id = setInterval(() => {
      setStep((s) => s + 1);
      tapLight();
    }, intervalMs);
    return () => clearInterval(id);
  }, [started, measured, intervalMs]);

  const widen = (set: (fn: (prev: number) => number) => void) => (e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width) + 1;
    set((prev) => (w > prev ? w : prev));
  };

  return (
    <View style={styles.wrap}>
      {/* Hidden pass: the widest word fixes each column's width. */}
      <View style={styles.measure} pointerEvents="none">
        {leadWords.map((w) => (
          <Text key={`l-${w}`} numberOfLines={1} style={textStyle} onLayout={widen(setLeadWidth)}>
            {w}
          </Text>
        ))}
        {trailWords.map((w) => (
          <Text key={`t-${w}`} numberOfLines={1} style={textStyle} onLayout={widen(setTrailWidth)}>
            {w}
          </Text>
        ))}
      </View>

      {measured ? (
        <Animated.View style={[styles.row, { gap, opacity: enter }]}>
          <RollingWord
            words={leadWords}
            direction="up"
            align="right"
            step={step}
            width={leadWidth}
            height={lineHeight}
            textStyle={textStyle}
          />
          <RollingWord
            words={trailWords}
            direction="down"
            align="left"
            step={step}
            width={trailWidth}
            height={lineHeight}
            textStyle={textStyle}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

type RollingWordProps = {
  words: string[];
  direction: 'up' | 'down';
  /** Inner edge the word hugs so the pair reads as one tight phrase. */
  align: 'left' | 'right';
  step: number;
  width: number;
  height: number;
  textStyle?: StyleProp<TextStyle>;
};

function RollingWord({ words, direction, align, step, width, height, textStyle }: RollingWordProps) {
  const [index, setIndex] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const mounted = useRef(false);

  useEffect(() => {
    // Skip the very first run (step 0) so the initial pair sits still.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    let alive = true;
    const roll = Animated.timing(anim, {
      toValue: 1,
      duration: motionDuration.roll,
      easing: motionEasing.emphasized,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
    });
    roll.start(({ finished }) => {
      if (!finished || !alive) return;
      setIndex((i) => (i + 1) % words.length);
      anim.setValue(0);
    });
    return () => {
      alive = false;
      roll.stop();
    };
  }, [step, anim, words.length]);

  // Lead rolls up (exits top); trail rolls down (exits bottom).
  const exit = direction === 'up' ? -height : height;
  const currentY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, exit] });
  const nextY = anim.interpolate({ inputRange: [0, 1], outputRange: [-exit, 0] });

  const current = words[index];
  const next = words[(index + 1) % words.length];

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Animated.Text
        numberOfLines={1}
        style={[textStyle, styles.word, { textAlign: align, transform: [{ translateY: currentY }] }]}
      >
        {current}
      </Animated.Text>
      <Animated.Text
        numberOfLines={1}
        style={[textStyle, styles.word, { textAlign: align, transform: [{ translateY: nextY }] }]}
      >
        {next}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  measure: {
    position: 'absolute',
    opacity: 0,
  },
  word: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
