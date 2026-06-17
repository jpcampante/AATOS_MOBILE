import { useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaWelcomeName, auriaWelcomeSuggestionPool } from '../../data/auriaMockData';
import { AURIA_CONTENT_HORIZONTAL_INSET } from './auriaLayout';
import { AnimatedScreenBlock } from '../navigation/AnimatedScreenBlock';
import {
  SUPPORTS_NATIVE_DRIVER,
  auriaTypography,
  motionDuration,
  motionEasing,
  myceoCornerStyle,
  useTheme,
} from '../../theme';
import { AuriaBloomMark } from './AuriaBloomMark';
import { AuriaRefreshButton } from './AuriaRefreshButton';

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

function getSuggestionWidth(text: string, contentMaxWidth?: number) {
  const availableWidth = contentMaxWidth ?? 320;
  return Math.min(availableWidth, 310, Math.max(176, text.length * 7 + 34));
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
        duration: motionDuration.micro,
        easing: motionEasing.decelerate,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      }),
      Animated.timing(listShift, {
        toValue: 8,
        duration: motionDuration.micro,
        easing: motionEasing.decelerate,
        useNativeDriver: SUPPORTS_NATIVE_DRIVER,
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
          duration: motionDuration.swift,
          easing: motionEasing.standard,
          useNativeDriver: SUPPORTS_NATIVE_DRIVER,
        }),
        Animated.timing(listShift, {
          toValue: 0,
          duration: motionDuration.swift,
          easing: motionEasing.standard,
          useNativeDriver: SUPPORTS_NATIVE_DRIVER,
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
                  <AuriaBloomMark size="md" />
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
                  style={({ pressed }) => [
                    styles.suggestionPressable,
                    { width: getSuggestionWidth(suggestion, contentMaxWidth) },
                    pressed && styles.suggestionPillPressed,
                  ]}
                  onPress={() => onSuggestion(suggestion)}
                  accessibilityRole="button"
                >
                  <Text style={styles.suggestionText} numberOfLines={1} ellipsizeMode="tail">
                    {suggestion}
                  </Text>
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
      gap: 9,
      alignItems: 'center',
    },
    suggestionPressable: {
      minHeight: 40,
      paddingHorizontal: 16,
      paddingVertical: 9,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray200,
      ...myceoCornerStyle('menu'),
    },
    suggestionPillPressed: {
      backgroundColor: ds.gray300,
      transform: [{ scale: 0.98 }],
    },
    suggestionText: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.normal,
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
