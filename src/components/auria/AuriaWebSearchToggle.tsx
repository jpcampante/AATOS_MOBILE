import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuriaIcon } from '../icons';
import { auriaTypography, useTheme } from '../../theme';
import type { WebSearchButtonView } from '../../features/auria/webSearchChoice';

type AuriaWebSearchToggleProps = {
  view: WebSearchButtonView;
  /** Turns the preference on (`auto`) or off for the open chat. */
  onChoose: (next: 'auto' | 'off') => void;
  /** Pressed while it can't be toggled: the reason has to be said out loud. */
  onBlocked: (reason: string) => void;
  /** Reads the settings again after a failure. */
  onRetry: () => void;
};

/**
 * The "Web" button in the composer: the person's web search preference for the
 * open chat, next to the answer-mode pill (A034). On/Off is the choice for the
 * next messages; what each turn actually goes out with is decided right before
 * sending. When search is off for the company or unavailable on the server, the
 * button stays Off and a tap says why instead of doing nothing.
 */
export function AuriaWebSearchToggle({ view, onChoose, onBlocked, onRetry }: AuriaWebSearchToggleProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const { on, blocked, retry, reason } = view;

  const handlePress = () => {
    if (retry) return onRetry();
    if (blocked) {
      // Busy with no reason to give (the choice is being saved): nothing to say.
      if (reason) onBlocked(reason);
      return;
    }
    onChoose(on ? 'off' : 'auto');
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={view.accessibilityLabel}
      accessibilityState={{ selected: on, disabled: blocked }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.pill,
        on && styles.pillOn,
        blocked && styles.pillBlocked,
        pressed && styles.pillPressed,
      ]}
    >
      <AuriaIcon name="globe" size={14} color={on ? ds.white : ds.gray600} strokeWidth={2} />
      <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
        {retry ? 'Web · Retry' : on ? 'Web · On' : 'Web'}
      </Text>
      {blocked && reason ? <View style={styles.blockedDot} /> : null}
    </Pressable>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 34,
      borderRadius: 17,
      paddingHorizontal: 11,
      backgroundColor: ds.sectionFill,
    },
    pillOn: {
      backgroundColor: ds.auriaBlue,
    },
    pillBlocked: {
      opacity: 0.55,
    },
    pillPressed: {
      transform: [{ scale: 0.98 }],
    },
    label: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    labelOn: {
      color: ds.white,
    },
    blockedDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: ds.gray500,
    },
  });
}
