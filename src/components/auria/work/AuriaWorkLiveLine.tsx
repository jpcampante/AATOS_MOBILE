import { StyleSheet, Text, View } from 'react-native';
import type { WorkStep } from '../../../features/auria/work/workRun';
import { stepLabel } from '../../../features/auria/work/workText';
import { auriaTypography, typography, useTheme } from '../../../theme';
import { AuriaBloomMark } from '../AuriaBloomMark';
import { ShimmerText } from '../ShimmerText';

type AuriaWorkLiveLineProps = {
  /** The step in front now (null before the first one shows). */
  current: WorkStep | null;
  /** The step just before it, shown faded underneath. */
  previous: WorkStep | null;
  elapsedSec: number;
};

/**
 * While the Auria works: one line that changes in place — what it is doing now
 * and, underneath, what it just did — with the seconds running.
 */
export function AuriaWorkLiveLine({ current, previous, elapsedSec }: AuriaWorkLiveLineProps) {
  const { ds } = useTheme();
  // The line shows a step as happening now; the one underneath as already done.
  const now = current ? stepLabel(current.status === 'error' ? current : { ...current, status: 'running' }) : 'Reading your request';
  const before = previous ? stepLabel(previous.status === 'error' ? previous : { ...previous, status: 'done' }) : null;

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`Auria is working. ${now}`}
      // Not a live region: the steps change too often to be read aloud (only the end is announced).
      accessibilityLiveRegion="none"
    >
      <View style={styles.line}>
        <AuriaBloomMark size="xs" decorative />
        <View style={styles.label}>
          <ShimmerText key={current?.id ?? 'reading'} text={now} color={ds.gray800} style={styles.labelText} />
        </View>
        <Text style={[styles.seconds, { color: ds.gray500 }]}>{elapsedSec}s</Text>
      </View>
      {before ? (
        <Text style={[styles.previous, { color: ds.gray400 }]} numberOfLines={1}>
          {before}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 24,
  },
  label: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  labelText: {
    ...auriaTypography.label,
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
  },
  seconds: {
    ...auriaTypography.label,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  previous: {
    ...auriaTypography.label,
    fontSize: 12.5,
    lineHeight: 19,
    paddingLeft: 26,
  },
});
