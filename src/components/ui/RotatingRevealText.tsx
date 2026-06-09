import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { tapLight } from '../../utils/haptics';

type RotatingRevealTextProps = {
  phrases: string[];
  textStyle?: StyleProp<TextStyle>;
  coverColor: string;
  dotColor: string;
  dotSize?: number;
  dotGap?: number;
  holdMs?: number;
  revealMs?: number;
  coverMs?: number;
  introMs?: number;
  singleLine?: boolean;
};

const REVEAL_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);
const COVER_EASING = Easing.bezier(0.4, 0, 0.2, 1);
/** Progress below this = dot rests beside text; above = dot follows the cover edge. */
const REST_PROGRESS = 0.025;

/**
 * ChatGPT-style headline: dot sweeps with the cover, then rests beside the phrase.
 */
export function RotatingRevealText({
  phrases,
  textStyle,
  coverColor,
  dotColor,
  dotSize = 12,
  dotGap = 10,
  holdMs = 2400,
  revealMs = 1700,
  coverMs = 1050,
  introMs = 350,
  singleLine = false,
}: RotatingRevealTextProps) {
  const [index, setIndex] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const progress = useRef(new Animated.Value(1)).current;
  const restPulse = useRef(new Animated.Value(1)).current;

  const phrase = phrases[index];

  const flatTextStyle = StyleSheet.flatten(textStyle) ?? {};
  const lineHeight =
    typeof flatTextStyle.lineHeight === 'number'
      ? flatTextStyle.lineHeight
      : typeof flatTextStyle.fontSize === 'number'
        ? flatTextStyle.fontSize * 1.2
        : 40;

  useEffect(() => {
    setTextWidth(0);
  }, [phrase]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    if (w > 0 && w !== textWidth) setTextWidth(w);
  };

  useEffect(() => {
    if (textWidth <= 0) return;
    let cancelled = false;

    progress.setValue(1);
    restPulse.setValue(1);

    const reveal = Animated.timing(progress, {
      toValue: 0,
      duration: revealMs,
      easing: REVEAL_EASING,
      useNativeDriver: false,
    });
    const cover = Animated.timing(progress, {
      toValue: 1,
      duration: coverMs,
      easing: COVER_EASING,
      useNativeDriver: false,
    });
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(restPulse, {
          toValue: 1.03,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(restPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );

    breathe.start();

    Animated.sequence([
      Animated.delay(introMs),
      reveal,
      Animated.delay(holdMs),
      cover,
    ]).start(({ finished }) => {
      breathe.stop();
      restPulse.setValue(1);
      if (!finished || cancelled) return;
      tapLight();
      setIndex((i) => (i + 1) % phrases.length);
    });

    return () => {
      cancelled = true;
      progress.stopAnimation();
      breathe.stop();
      restPulse.stopAnimation();
    };
  }, [coverMs, holdMs, index, introMs, phrases.length, progress, revealMs, restPulse, textWidth]);

  const coverWidth = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, textWidth || 1],
      }),
    [progress, textWidth],
  );

  const sweepLeft = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, REST_PROGRESS, 1],
        outputRange: [-dotSize * 2, REST_PROGRESS * (textWidth || 1) - dotSize / 2, (textWidth || 1) - dotSize / 2],
      }),
    [dotSize, progress, textWidth],
  );

  const isAnimating = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, REST_PROGRESS, REST_PROGRESS + 0.001, 1],
        outputRange: [0, 0, 1, 1],
        extrapolate: 'clamp',
      }),
    [progress],
  );

  const isResting = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, REST_PROGRESS],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [progress],
  );

  const dotTop = (lineHeight - dotSize) / 2;
  const ready = textWidth > 0;

  const dotStyle = {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: dotColor,
  };

  return (
    <View style={styles.row}>
      <View style={styles.phraseRow}>
        <View style={[styles.textClip, { minHeight: lineHeight }]}>
          <Text
            key={phrase}
            style={[styles.text, singleLine && styles.textSingleLine, textStyle]}
            onLayout={onLayout}
            numberOfLines={singleLine ? 1 : undefined}
            adjustsFontSizeToFit={singleLine}
            minimumFontScale={singleLine ? 0.85 : undefined}
          >
            {phrase}
          </Text>
          {ready ? (
            <>
              <Animated.View
                style={[styles.cover, { backgroundColor: coverColor, width: coverWidth }]}
              />
              <Animated.View
                style={[
                  styles.sweepDot,
                  dotStyle,
                  styles.dotShadow,
                  {
                    top: dotTop,
                    left: sweepLeft,
                    opacity: isAnimating,
                  },
                ]}
              />
            </>
          ) : null}
        </View>

        {ready ? (
          <Animated.View
            style={[
              styles.restDot,
              dotStyle,
              styles.dotShadow,
              {
                marginLeft: dotGap,
                opacity: isResting,
                transform: [{ scale: restPulse }],
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textClip: {
    position: 'relative',
    flexShrink: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    textAlign: 'left',
  },
  textSingleLine: {
    flexShrink: 0,
  },
  cover: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  sweepDot: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  restDot: {
    flexShrink: 0,
  },
  dotShadow: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
    default: {
      boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
    } as object,
  }),
});
