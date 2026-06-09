import { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaWelcomeName, auriaWelcomeSuggestionPool } from '../../data/auriaMockData';
import { AURIA_CONTENT_HORIZONTAL_INSET } from './auriaLayout';
import { AnimatedScreenBlock } from '../navigation/AnimatedScreenBlock';
import {
  auriaTypography,
  liquidGlassTokens,
  useTheme,
} from '../../theme';
import { AuriaLogoMark } from './AuriaLogoMark';
import { AuriaRefreshButton } from './AuriaRefreshButton';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

type AuriaWelcomeViewProps = {
  contentMaxWidth?: number;
  contentTopPadding?: number;
  onSuggestion: (text: string) => void;
  onRefreshSuggestions?: () => void;
};

function pickSuggestions(count = 3) {
  const pool = [...auriaWelcomeSuggestionPool];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function AuriaWelcomeView({
  contentMaxWidth,
  contentTopPadding = 56,
  onSuggestion,
  onRefreshSuggestions,
}: AuriaWelcomeViewProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(
    () => createStyles(ds, theme, contentMaxWidth, contentTopPadding),
    [contentMaxWidth, contentTopPadding, ds, theme],
  );

  const [suggestions, setSuggestions] = useState(() => pickSuggestions());
  const [refreshKey, setRefreshKey] = useState(0);
  const listOpacity = useRef(new Animated.Value(1)).current;
  const listShift = useRef(new Animated.Value(0)).current;

  const refreshTransitionId = useRef(0);

  const handleRefresh = () => {
    const transitionId = refreshTransitionId.current + 1;
    refreshTransitionId.current = transitionId;

    Animated.parallel([
      Animated.timing(listOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(listShift, {
        toValue: 8,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(({ finished }) => {
      if (!finished || refreshTransitionId.current !== transitionId) {
        return;
      }

      setSuggestions(pickSuggestions());
      setRefreshKey((key) => key + 1);
      listShift.setValue(-8);

      Animated.parallel([
        Animated.timing(listOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(listShift, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    });

    onRefreshSuggestions?.();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.centerBlock}>
        <AnimatedScreenBlock index={0} centered>
          <View style={styles.columnWrap}>
            <View style={styles.greetingBlock}>
              <View style={styles.greetRow}>
                <View style={styles.greetLogo}>
                  <AuriaLogoMark size="md" />
                </View>
                <Text style={styles.greetHi}>Hi {auriaWelcomeName}</Text>
              </View>
              <Text style={styles.greetTitle}>Where should we start?</Text>
            </View>
          </View>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={1} centered>
          <View style={styles.columnWrap}>
            <Animated.View
              style={[
                styles.suggestions,
                {
                  opacity: Platform.OS === 'ios' ? 1 : listOpacity,
                  transform: [{ translateY: listShift }],
                },
              ]}
            >
              {suggestions.map((suggestion) => (
                <Pressable
                  key={`${refreshKey}-${suggestion}`}
                  style={({ pressed }) => [styles.suggestionPressable, pressed && styles.suggestionPillPressed]}
                  onPress={() => onSuggestion(suggestion)}
                  accessibilityRole="button"
                >
                  <LiquidGlassSurface
                    borderRadius={22}
                    elevationLevel="card"
                    interactive
                    style={styles.suggestionPill}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </LiquidGlassSurface>
                </Pressable>
              ))}
            </Animated.View>
          </View>
        </AnimatedScreenBlock>

        <AnimatedScreenBlock index={2} centered>
          <View style={styles.columnWrap}>
            <View style={styles.refreshWrap}>
              <AuriaRefreshButton onPress={handleRefresh} />
            </View>
          </View>
        </AnimatedScreenBlock>
      </View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  contentMaxWidth?: number,
  contentTopPadding = 56,
) {
  const column = contentMaxWidth ? { maxWidth: contentMaxWidth, width: '100%' as const } : { width: '100%' as const };
  const glass = liquidGlassTokens(theme);
  return StyleSheet.create({
    wrap: {
      flex: 1,
    },
    centerBlock: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: AURIA_CONTENT_HORIZONTAL_INSET,
      paddingTop: contentTopPadding,
      gap: 14,
    },
    logoBlock: {
      width: '100%',
      alignItems: 'center',
    },
    greetingBlock: {
      width: '100%',
      alignItems: 'center',
      gap: 6,
    },
    greetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    greetLogo: {
      marginTop: 1,
    },
    columnWrap: {
      ...column,
      alignSelf: 'center',
    },
    greetHi: {
      ...auriaTypography.body,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.normal,
      color: ds.gray500,
      letterSpacing: -0.2,
      textAlign: 'center',
      width: '100%',
    },
    greetTitle: {
      ...auriaTypography.title,
      fontSize: 24,
      fontWeight: theme.typography.fontWeight.normal,
      color: ds.gray700,
      letterSpacing: -0.5,
      lineHeight: 30,
      textAlign: 'center',
      width: '100%',
    },
    suggestions: {
      ...column,
      gap: 10,
      alignItems: 'stretch',
    },
    suggestionPressable: {
      width: '100%',
      borderRadius: 22,
    },
    suggestionPill: {
      paddingHorizontal: 18,
      paddingVertical: 15,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    suggestionPillPressed: {
      backgroundColor: glass.pressed,
      transform: [{ scale: 0.985 }],
    },
    suggestionText: {
      ...auriaTypography.body,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
      textAlign: 'center',
    },
    refreshWrap: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
  });
}
