import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type TextStyle } from 'react-native';

type ShimmerTextProps = {
  text: string;
  style?: TextStyle | TextStyle[];
  color: string;
  /** When false the text is static (no sweep). */
  active?: boolean;
};

/**
 * A "Thinking" shimmer — a bright band sweeps left→right across the letters,
 * like ChatGPT's thinking label. Per-letter opacity (reliably animated on web
 * and native) so a wave of brightness moves across the word.
 */
export function ShimmerText({ text, style, color, active = true }: ShimmerTextProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [active, progress]);

  const chars = [...text];
  const n = chars.length;

  return (
    <View style={styles.row}>
      {chars.map((ch, i) => {
        const center = n > 1 ? i / (n - 1) : 0.5;
        const lo = Math.max(0, center - 0.3);
        const hi = Math.min(1, center + 0.3);
        let opacity: Animated.AnimatedInterpolation<number> | number = 1;
        if (active) {
          let inputRange: number[];
          let outputRange: number[];
          if (center <= 0) {
            inputRange = [0, hi];
            outputRange = [1, 0.4];
          } else if (center >= 1) {
            inputRange = [lo, 1];
            outputRange = [0.4, 1];
          } else {
            inputRange = [lo, center, hi];
            outputRange = [0.4, 1, 0.4];
          }
          opacity = progress.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
        }
        return (
          <Animated.Text key={`${ch}-${i}`} style={[style, { color, opacity }]}>
            {ch === ' ' ? ' ' : ch}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' },
});
