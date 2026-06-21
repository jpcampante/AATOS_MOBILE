import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DISCOVER_TOPICS } from '../../features/auria/newsTypes';
import type { DiscoverTopic, TopicPreference } from '../../features/auria/newsTypes';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type AuriaTopicChipsProps = {
  prefs: Partial<Record<DiscoverTopic, TopicPreference>>;
  onCycle: (topic: DiscoverTopic) => void;
  /** Hide the "Help us fine-tune your feed" heading (e.g. inside Settings). */
  showHeading?: boolean;
  /** Wrap chips instead of horizontal scroll (better for Settings). */
  wrapChips?: boolean;
};

/** The "Help us fine-tune your feed" row — preference chips. Tap once to see a
 *  topic more, tap again to see it less, tap a third time to reset. */
export function AuriaTopicChips({
  prefs,
  onCycle,
  showHeading = true,
  wrapChips = false,
}: AuriaTopicChipsProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  const chips = DISCOVER_TOPICS.map((topic) => renderChip(topic));

  function renderChip(topic: DiscoverTopic) {
    const pref = prefs[topic] ?? 'neutral';
    const more = pref === 'more';
    const less = pref === 'less';
    return (
      <Pressable
        key={topic}
        onPress={() => onCycle(topic)}
        accessibilityRole="button"
        accessibilityLabel={`${topic}${more ? ', see more' : less ? ', see less' : ''}`}
        style={({ pressed }) => [
          styles.chip,
          more && styles.chipMore,
          less && styles.chipLess,
          pressed && styles.chipPressed,
        ]}
      >
        {more ? <AuriaIcon name="plus" size={13} color={ds.white} strokeWidth={2.4} /> : null}
        {less ? <AuriaIcon name="close" size={13} color={ds.gray500} strokeWidth={2.4} /> : null}
        <Text style={[styles.chipText, more && styles.chipTextMore, less && styles.chipTextLess]}>
          {topic}
        </Text>
      </Pressable>
    );
  }

  if (wrapChips) {
    return (
      <View style={styles.wrap}>
        {showHeading ? (
          <>
            <Text style={styles.heading}>Help us fine-tune your feed</Text>
            <Text style={styles.sub}>Tap a topic once to see it more. Tap again to see it less.</Text>
          </>
        ) : null}
        <View style={styles.wrapRow}>{chips}</View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {showHeading ? (
        <>
          <Text style={styles.heading}>Help us fine-tune your feed</Text>
          <Text style={styles.sub}>Tap a topic once to see it more. Tap again to see it less.</Text>
        </>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {chips}
      </ScrollView>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: {
      gap: 8,
      paddingTop: 4,
    },
    heading: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 20,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
    },
    sub: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 15,
      lineHeight: 21,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 4,
      paddingRight: 12,
    },
    wrapRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingVertical: 4,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 40,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: ds.sectionFill,
    },
    chipMore: {
      backgroundColor: ds.offBlack,
    },
    chipLess: {
      backgroundColor: ds.sectionFill,
      opacity: 0.55,
    },
    chipPressed: {
      transform: [{ scale: 0.97 }],
    },
    chipText: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.medium,
    },
    chipTextMore: {
      color: ds.white,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    chipTextLess: {
      color: ds.gray500,
      textDecorationLine: 'line-through',
    },
  });
}
