import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuriaIcon } from '../icons';
import { auriaTypography, useTheme } from '../../theme';

/**
 * A top-anchored confirmation pill ("Message copied") shown after a message
 * action. Sits at the top so it stays visible even while the keyboard covers
 * the composer — matching ChatGPT's copy feedback. Driven by a transient
 * message string (see useAuriaToast); clears itself when the message goes null.
 */
export function AuriaActionToast({ message }: { message: string | null }) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme, safe.top), [ds, theme, safe.top]);
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setShown(message);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
        speed: 18,
        bounciness: 7,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) setShown(null);
      });
    }
  }, [message, anim]);

  if (!shown) return null;

  return (
    <View style={styles.layer} pointerEvents="none">
      <Animated.View
        style={[
          styles.pill,
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
            ],
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <AuriaIcon name="checkCircle" size={16} color={ds.white} strokeWidth={2} />
        </View>
        <Text style={styles.text} numberOfLines={1}>
          {shown}
        </Text>
      </Animated.View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  topInset: number,
) {
  return StyleSheet.create({
    layer: {
      position: 'absolute',
      top: topInset + 10,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 60,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      ...Platform.select({
        web: { boxShadow: '0 10px 28px rgba(0,0,0,0.16)' } as object,
        default: {
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        },
      }),
    },
    iconWrap: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.offBlack,
    },
    text: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
}
