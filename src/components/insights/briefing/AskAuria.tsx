import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { myceoCornerStyle, useTheme } from '../../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../../icons';
import type { NavigateFn } from '../../../data/productNavigation';

const SUGGESTIONS = [
  'What is blocking Legal this week?',
  'Which emails should I reply to first?',
  'Where did Auria save the most time?',
  'Show work at risk today',
];

type AskAuriaProps = {
  onNavigate: NavigateFn;
};

/** Zone 5 — a short prompt that deep-links to the Auria tab, pre-filled. */
export function AskAuria({ onNavigate }: AskAuriaProps) {
  const { insights, theme } = useTheme();
  const styles = useMemo(() => createStyles(insights, theme), [insights, theme]);
  const [prompt, setPrompt] = useState('');

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onNavigate('auria', { prompt: trimmed });
    setPrompt('');
  };

  return (
    <View style={styles.card}>
      <View style={styles.searchRow}>
        <AuriaIcon name="search" size={AURIA_ICON_SIZE.xs} color={insights.textHint} strokeWidth={2} />
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ask Auria about your company…"
          placeholderTextColor={insights.textHint}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={() => ask(prompt)}
        />
        <Pressable
          onPress={() => ask(prompt)}
          disabled={!prompt.trim()}
          style={({ pressed }) => [styles.sparkButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Ask Auria"
        >
          <AuriaIcon
            name="sparkles"
            size={AURIA_ICON_SIZE.xs}
            color={prompt.trim() ? '#2563EB' : insights.textHint}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            onPress={() => ask(suggestion)}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.chipText} numberOfLines={1}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(
  insights: ReturnType<typeof useTheme>['insights'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: insights.surface,
      ...myceoCornerStyle('card'),
      ...theme.shadow.card,
      padding: theme.spacing.lg,
      gap: 12,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: insights.page,
      ...myceoCornerStyle('inset'),
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    input: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      color: insights.text,
      paddingVertical: 0,
    },
    sparkButton: {
      width: 28,
      height: 28,
      ...myceoCornerStyle('icon'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EEF3FF',
    },
    pressed: { opacity: 0.6 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    chip: {
      backgroundColor: insights.page,
      ...myceoCornerStyle('chip'),
      paddingHorizontal: 12,
      paddingVertical: 8,
      maxWidth: '100%',
    },
    chipText: { fontSize: 12, fontWeight: '600', color: insights.textMuted },
  });
}
