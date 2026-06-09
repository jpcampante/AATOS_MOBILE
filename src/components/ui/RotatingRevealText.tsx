import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
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
  /** ms the phrase stays fully revealed before the next wipe. */
  holdMs?: number;
};

/**
 * A line of text that is revealed by a small dot ("bola preta") sweeping
 * right → left. When the dot finishes covering, the phrase swaps and a
 * light haptic fires. Then the dot reveals the new phrase.
 */
export function RotatingRevealText({
  phrases,
  textStyle,
  coverColor,
  dotColor,
  dotSize = 9,
  holdMs = 1600,
}: RotatingRevealTextProps) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  // progress: 1 = fully covered, 0 = fully revealed
  const progress = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(index);
  indexRef.current = index;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - width) > 0.5) setWidth(w);
  };

  useEffect(() => {
    if (width <= 0) return;
    let cancelled = false;

    progress.setValue(1); // start covered
    const reveal = Animated.timing(progress, {
      toValue: 0,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    const cover = Animated.timing(progress, {
      toValue: 1,
      duration: 440,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    });

    Animated.sequence([reveal, Animated.delay(holdMs), cover]).start(({ finished }) => {
      if (!finished || cancelled) return;
      tapLight(); // vibrate exactly when the phrase swaps
      setIndex((i) => (i + 1) % phrases.length);
    });

    return () => {
      cancelled = true;
      progress.stopAnimation();
    };
  }, [index, width, holdMs, phrases.length, progress]);

  // Cover width shrinks from `width` (covered) to 0 (revealed).
  const coverStyle = useMemo(
    () => ({
      width: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, width || 1],
      }),
    }),
    [progress, width],
  );

  const phrase = phrases[index];

  return (
    <View style={styles.row}>
      <View>
        <Text style={[styles.text, textStyle]} onLayout={onLayout}>
          {phrase}
        </Text>

        {/* Wipe cover (matches background) with the dot riding its right edge. */}
        <Animated.View
          style={[styles.cover, { backgroundColor: coverColor }, coverStyle]}
        >
          <View
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: dotColor,
                right: -dotSize / 2,
                marginTop: -dotSize / 2,
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  cover: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'visible',
    pointerEvents: 'none',
  },
  dot: {
    position: 'absolute',
    top: '50%',
  },
});
