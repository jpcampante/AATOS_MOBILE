import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { myceoCornerStyle, useTheme } from '../../../theme';
import { AuriaIcon, AURIA_ICON_SIZE, type AuriaIconName } from '../../icons';
import type { InsightAction, Severity, Signal, SignalDomain } from '../../../data/insights/types';
import { resolveActions } from '../../../data/insights/actions';
import { DataSourceBadge } from '../DataSourceBadge';

export const DOMAIN_ICON: Record<SignalDomain, AuriaIconName> = {
  tasks: 'checkCircle',
  email: 'mail',
  auria: 'sparkles',
  calendar: 'calendar',
  projects: 'briefcase',
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  high: '#E5484D',
  medium: '#B45309',
  low: '#9CA3AF',
};

type SignalRowProps = {
  signal: Signal;
  onAction: (action: InsightAction) => void;
  /** Surface the icon tile sits on (so it contrasts with the row background). */
  tileBg?: string;
};

/** One signal: severity + domain + title/detail + source, with its actions. */
export function SignalRow({ signal, onAction, tileBg }: SignalRowProps) {
  const { insights } = useTheme();
  const styles = useMemo(() => createStyles(insights), [insights]);
  const actions = resolveActions(signal.actionIds);

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={[styles.sevDot, { backgroundColor: SEVERITY_COLOR[signal.severity] }]} />
        <View style={[styles.iconTile, tileBg ? { backgroundColor: tileBg } : null]}>
          <AuriaIcon
            name={DOMAIN_ICON[signal.domain]}
            size={AURIA_ICON_SIZE.xs}
            color={insights.textMuted}
            strokeWidth={1.8}
          />
        </View>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle} numberOfLines={1}>{signal.title}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {signal.detail ?? signal.delta ?? signal.domain}
          </Text>
        </View>
        <DataSourceBadge source={signal.source} />
      </View>

      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onAction(action)}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(insights: ReturnType<typeof useTheme>['insights']) {
  return StyleSheet.create({
    row: {
      backgroundColor: insights.page,
      ...myceoCornerStyle('inset'),
      padding: 11,
      gap: 9,
    },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    sevDot: { width: 8, height: 8, borderRadius: 4 },
    iconTile: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: insights.surface,
      ...myceoCornerStyle('iconSm'),
    },
    rowCopy: { flex: 1, gap: 1, minWidth: 0 },
    rowTitle: { fontSize: 13.5, fontWeight: '700', color: insights.text, letterSpacing: -0.1 },
    rowMeta: { fontSize: 11.5, color: insights.textMuted },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingLeft: 47 },
    actionBtn: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      backgroundColor: insights.surface,
      borderWidth: 1,
      borderColor: insights.divider,
      ...myceoCornerStyle('chip'),
    },
    actionText: { fontSize: 11.5, fontWeight: '600', color: insights.text },
    pressed: { opacity: 0.6 },
  });
}
