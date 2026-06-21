import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DiscoverSource } from '../../features/auria/newsTypes';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';

type AuriaSourcesSheetProps = {
  visible: boolean;
  sources: DiscoverSource[];
  onClose: () => void;
};

/** Bottom sheet listing the real sources behind a story — number, headline,
 *  excerpt and the publisher favicon. Tapping a row opens the article. */
export function AuriaSourcesSheet({ visible, sources, onClose }: AuriaSourcesSheetProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(ds, theme, safe.bottom), [ds, theme, safe.bottom]);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 240 : 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, anim]);

  if (!visible) return null;

  const openSource = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close sources" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { maxHeight: height * 0.78 },
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.5, 0] }) },
            ],
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <AuriaIcon name="close" size={AURIA_ICON_SIZE.sm} color={ds.gray700} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.title}>Sources</Text>
          <View style={styles.closeBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          {sources.map((source) => (
            <Pressable
              key={source.id}
              onPress={() => openSource(source.url)}
              accessibilityRole="link"
              accessibilityLabel={source.title}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowHead}>
                <View style={styles.indexBadge}>
                  <Text style={styles.indexText}>{source.index}</Text>
                </View>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {source.title}
                </Text>
              </View>
              <Text style={styles.excerpt} numberOfLines={2}>
                {source.excerpt}
              </Text>
              <View style={styles.siteRow}>
                <Image source={{ uri: source.favicon }} style={styles.favicon} />
                <Text style={styles.siteName}>{source.siteName}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
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
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      zIndex: 50,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 8,
      paddingBottom: bottomInset + 8,
      ...Platform.select({
        web: { boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' } as object,
        default: {
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: -8 },
          elevation: 24,
        },
      }),
    },
    handle: {
      alignSelf: 'center',
      width: 38,
      height: 5,
      borderRadius: 3,
      backgroundColor: ds.gray300,
      marginBottom: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.sectionFill,
    },
    title: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 18,
      fontWeight: theme.typography.fontWeight.bold,
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    row: {
      paddingVertical: 16,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.divider,
    },
    rowPressed: {
      backgroundColor: ds.gray100,
    },
    rowHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    indexBadge: {
      width: 22,
      height: 22,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.sectionFill,
    },
    indexText: {
      ...auriaTypography.label,
      color: ds.gray600,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    rowTitle: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    excerpt: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 14,
      lineHeight: 19,
    },
    siteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    favicon: {
      width: 16,
      height: 16,
      borderRadius: 4,
      backgroundColor: ds.gray200,
    },
    siteName: {
      ...auriaTypography.body,
      color: ds.gray600,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
    },
  });
}
