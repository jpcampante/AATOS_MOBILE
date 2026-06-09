import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
  /** Background color the wipe matches (so only the dot stays visible). */
  coverColor: string;
  dotColor: string;
  dotSize?: number;
  /** Gap between the end of the text and the resting dot. */
  dotGap?: number;
  /** ms the phrase stays fully revealed before the next wipe. */
  holdMs?: number;
  /** ms before the very first reveal. */
  introMs?: number;
  singleLine?: boolean;
};

/**
 * ChatGPT / Superlist style headline.
 *
 * A physical dot wipes the text away (right → left) and reveals the next
 * phrase (left → right), riding the leading edge of a background-colored
 * cover. Between phrases it rests just past the last glyph and breathes.
 *
 * The dot lives OUTSIDE the clipped text layer, so it is never cut off at
 * the edges. Motion is spring-based for a natural, weighty feel.
 */
export function RotatingRevealText({
  phrases,
  textStyle,
  coverColor,
  dotColor,
  dotSize = 14,
  dotGap = 12,
  holdMs = 2200,
  introMs = 350,
  singleLine = false,
}: RotatingRevealTextProps) {
  const [index, setIndex] = useState(0);
  const [textWidth, setTextWidth] = useState(0);

  // progress: 1 = fully covered (text hidden, dot at left), 0 = revealed (dot resting at end)
  const progress = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const phrase = phrases[index];

  const flatTextStyle = StyleSheet.flatten(textStyle) ?? {};
  const lineHeight =
    typeof flatTextStyle.lineHeight === 'number'
      ? flatTextStyle.lineHeight
      : typeof flatTextStyle.fontSize === 'number'
        ? flatTextStyle.fontSize * 1.2
        : 40;

  // Re-measure whenever the phrase changes.
  useEffect(() => {
    setTextWidth(0);
  }, [phrase]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    if (w > 0 && w !== textWidth) setTextWidth(w);
  };

  // Resting dot "breathes" with a soft, springy pulse.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.spring(pulse, {
          toValue: 1.18,
          stiffness: 140,
          damping: 7,
          mass: 0.7,
          useNativeDriver: false,
        }),
        Animated.spring(pulse, {
          toValue: 1,
          stiffness: 120,
          damping: 9,
          mass: 0.7,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Reveal → hold → cover, then swap. Spring physics give it weight.
  useEffect(() => {
    if (textWidth <= 0) return;
    let cancelled = false;

    progress.setValue(1);

    const reveal = Animated.spring(progress, {
      toValue: 0,
      stiffness: 95,
      damping: 16,
      mass: 1,
      useNativeDriver: false,
    });
    const cover = Animated.spring(progress, {
      toValue: 1,
      stiffness: 130,
      damping: 20,
      mass: 0.9,
      useNativeDriver: false,
    });

    Animated.sequence([
      Animated.delay(introMs),
      reveal,
      Animated.delay(holdMs),
      cover,
    ]).start(({ finished }) => {
      if (!finished || cancelled) return;
      tapLight(); // haptic exactly on the phrase swap
      setIndex((i) => (i + 1) % phrases.length);
    });

    return () => {
      cancelled = true;
      progress.stopAnimation();
    };
  }, [holdMs, index, introMs, phrases.length, progress, textWidth]);

  // Cover is anchored to the right edge and grows leftward to hide the text.
  const coverWidth = useMemo(
    () => progress.interpolate({ inputRange: [0, 1], outputRange: [0, textWidth] }),
    [progress, textWidth],
  );

  // Dot leads the wipe; at rest it sits a clean `dotGap` past the last glyph.
  const dotLeft = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [textWidth + dotGap, -dotSize],
      }),
    [dotGap, dotSize, progress, textWidth],
  );

  const dotTop = (lineHeight - dotSize) / 2;
  const ready = textWidth > 0;

  return (
    <View style={styles.row}>
      <View style={[styles.phraseRow, { minHeight: lineHeight }]}>
        {/* Clipped text + wipe cover. Dot is intentionally NOT inside here. */}
        <View style={[styles.textClip, { minHeight: lineHeight }]}>
          <Text
            key={phrase}
            style={[styles.text, textStyle]}
            onLayout={onLayout}
            numberOfLines={singleLine ? 1 : undefined}
          >
            {phrase}
          </Text>
          {ready ? (
            <Animated.View
              style={[styles.cover, { backgroundColor: coverColor, width: coverWidth }]}
            />
          ) : null}
        </View>

        {/* The dot — free of the clip, so it never gets cut off. */}
        {ready ? (
          <Animated.View
            style={[
              styles.dot,
              styles.dotShadow,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: dotColor,
                top: dotTop,
                left: dotLeft,
                transform: [{ scale: pulse }],
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
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  textClip: {
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    textAlign: 'left',
  },
  cover: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  dot: {
    position: 'absolute',
    pointerEvents: 'none',
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
