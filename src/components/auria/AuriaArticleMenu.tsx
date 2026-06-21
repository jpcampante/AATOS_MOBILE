import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../icons';

export type ArticleMenuAction = 'copy' | 'share' | 'save' | 'hide' | 'report';

type AuriaArticleMenuProps = {
  visible: boolean;
  onClose: () => void;
  onAction: (action: ArticleMenuAction) => void;
};

const ITEMS: { id: ArticleMenuAction; label: string; icon: AuriaIconName }[] = [
  { id: 'copy', label: 'Copy link', icon: 'copy' },
  { id: 'share', label: 'Share', icon: 'upload' },
  { id: 'save', label: 'Save', icon: 'pin' },
  { id: 'hide', label: 'See less like this', icon: 'noSymbol' },
  { id: 'report', label: 'Report', icon: 'flag' },
];

/** The "⋯" action sheet for a Discover story. */
export function AuriaArticleMenu({ visible, onClose, onAction }: AuriaArticleMenuProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme, safe.bottom), [ds, theme, safe.bottom]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, anim]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
          },
        ]}
      >
        <View style={styles.handle} />
        {ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onAction(item.id)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <AuriaIcon name={item.icon} size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={1.8} />
            <Text style={styles.label}>{item.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  bottomInset: number,
) {
  return StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 55 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 8,
      paddingBottom: bottomInset + 12,
      paddingHorizontal: 10,
    },
    handle: {
      alignSelf: 'center',
      width: 38,
      height: 5,
      borderRadius: 3,
      backgroundColor: ds.gray300,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 15,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
    rowPressed: { backgroundColor: ds.gray100 },
    label: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.medium,
    },
  });
}
