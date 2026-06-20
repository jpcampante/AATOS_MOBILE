import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { auriaPromptSuggestions } from '../../data/auriaPromptSuggestions';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AURIA_CONTENT_HORIZONTAL_INSET } from './auriaLayout';

type AuriaPromptSuggestionsProps = {
  /** Sends the card's prompt when tapped. */
  onSelect: (prompt: string) => void;
};

/** Horizontally-scrolling starter cards, docked just above the composer. */
export function AuriaPromptSuggestions({ onSelect }: AuriaPromptSuggestionsProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {auriaPromptSuggestions.map((suggestion) => (
        <Pressable
          key={suggestion.id}
          onPress={() => onSelect(suggestion.prompt)}
          accessibilityRole="button"
          accessibilityLabel={`${suggestion.title}. ${suggestion.subtitle}`}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <Text style={styles.title} numberOfLines={1}>
            {suggestion.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {suggestion.subtitle}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    scroll: {
      flexGrow: 0,
      marginBottom: 4,
    },
    content: {
      paddingHorizontal: AURIA_CONTENT_HORIZONTAL_INSET + 4,
      gap: 8,
    },
    card: {
      width: 180,
      minHeight: 72,
      paddingHorizontal: 14,
      paddingVertical: 12,
      justifyContent: 'flex-start',
      backgroundColor: ds.gray200,
      ...myceoCornerStyle('menu'),
    },
    cardPressed: {
      backgroundColor: ds.gray300,
      transform: [{ scale: 0.98 }],
    },
    title: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
    },
    subtitle: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: theme.typography.fontWeight.normal,
      color: ds.gray500,
      marginTop: 3,
    },
  });
}
