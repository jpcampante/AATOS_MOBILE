import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AuriaProposal } from '../../features/auria/proposals';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type AuriaProposalCardProps = {
  proposal: AuriaProposal;
  /** The decision is with the server right now. */
  busy?: boolean;
  onApply: (proposal: AuriaProposal) => void;
  onReject: (proposal: AuriaProposal) => void;
};

/**
 * A change the Auria proposed to a document (A041): what it would change and
 * the two buttons that decide it. Nothing is saved until the person applies
 * it — the card says so, like the web does.
 */
export function AuriaProposalCard({ proposal, busy = false, onApply, onReject }: AuriaProposalCardProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <View style={[styles.card, myceoCornerStyle('inset')]}>
      <View style={styles.header}>
        <AuriaIcon name="squarePen" size={14} color={ds.auriaBlue} strokeWidth={1.8} />
        <Text style={styles.eyebrow} numberOfLines={1}>
          Proposed change · {proposal.documentTitle}
        </Text>
      </View>
      <Text style={styles.summary}>{proposal.summary}</Text>
      {proposal.title ? <Text style={styles.detail}>New name: {proposal.title}</Text> : null}
      {proposal.formatChanges ? <Text style={styles.detail}>The document's format changes too.</Text> : null}
      <Text style={styles.detail}>Not saved yet.</Text>

      <View style={styles.actions}>
        {busy ? <ActivityIndicator size="small" color={ds.gray500} /> : null}
        <Pressable
          onPress={() => onReject(proposal)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Reject the change to ${proposal.documentTitle}`}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </Pressable>
        <Pressable
          onPress={() => onApply(proposal)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Apply the change to ${proposal.documentTitle}`}
          accessibilityState={{ disabled: busy }}
          style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed, busy && styles.disabled]}
        >
          <Text style={[styles.buttonText, styles.primaryText]}>Apply</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: {
      padding: 12,
      gap: 6,
      backgroundColor: ds.sectionFill,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    eyebrow: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      color: ds.gray600,
      flexShrink: 1,
    },
    summary: {
      ...auriaTypography.body,
      fontSize: 14,
      lineHeight: 20,
      color: ds.gray900,
    },
    detail: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      color: ds.gray500,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      paddingTop: 4,
    },
    button: {
      height: 34,
      paddingHorizontal: 14,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray200,
    },
    primary: { backgroundColor: ds.offBlack },
    buttonText: {
      ...auriaTypography.label,
      fontSize: 13,
      letterSpacing: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    primaryText: { color: ds.white },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.5 },
  });
}
