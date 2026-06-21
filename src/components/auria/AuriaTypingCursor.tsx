import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type TextStyle } from 'react-native';

type AuriaTypingCursorProps = {
  color: string;
  style?: TextStyle | TextStyle[];
};

/** A soft, slowly-blinking caret shown while Auria is still writing. */
export function AuriaTypingCursor({ color, style }: AuriaTypingCursorProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return <Animated.Text style={[style, { color, opacity }]}>▌</Animated.Text>;
}
