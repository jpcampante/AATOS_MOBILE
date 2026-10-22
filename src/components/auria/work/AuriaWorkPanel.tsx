import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAnnounceWhenFinished } from '../../../features/auria/work/useAnnounceWhenFinished';
import { useElapsed } from '../../../features/auria/work/useElapsed';
import { useStepReveal } from '../../../features/auria/work/useStepReveal';
import { isWorkRunActive, usedServices, visibleSteps, type WorkRun } from '../../../features/auria/work/workRun';
import { disclosureLabel } from '../../../features/auria/work/workText';
import { auriaTypography, useTheme } from '../../../theme';
import { AuriaIcon } from '../../icons';
import { AuriaServiceMark } from './AuriaServiceMark';
import { AuriaWorkDetails } from './AuriaWorkDetails';
import { AuriaWorkLiveLine } from './AuriaWorkLiveLine';

/**
 * The "Working for 6s" panel above the answer (same as the web): while the
 * Auria works, one live line with the current step; when it ends, a closed
 * line ("Reasoned for 8 seconds · Fast") with the services it touched, which
 * opens the details.
 */
export function AuriaWorkPanel({ run }: { run: WorkRun }) {
  const { ds } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const elapsed = useElapsed(run);
  const active = isWorkRunActive(run.status);
  const steps = visibleSteps(run);
  const { shown, settled } = useStepReveal(steps.length, active, run.mode);
  const summary = disclosureLabel(run, elapsed);
  useAnnounceWhenFinished(active, summary);

  if (!settled) {
    return (
      <AuriaWorkLiveLine
        current={shown > 0 ? steps[shown - 1] : null}
        previous={shown > 1 ? steps[shown - 2] : null}
        elapsedSec={Math.floor(elapsed / 1000)}
      />
    );
  }

  const services = usedServices(run);
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityHint={expanded ? 'Hides what the Auria did' : 'Shows what the Auria did'}
        accessibilityState={{ expanded }}
      >
        {services.length ? (
          <View style={styles.services}>
            {services.map((service) => (
              <AuriaServiceMark key={service} service={service} size={14} />
            ))}
          </View>
        ) : null}
        <Text style={[styles.summary, { color: ds.gray500 }]} numberOfLines={1}>
          {summary}
        </Text>
        <View style={expanded && styles.chevronOpen}>
          <AuriaIcon name="chevronRight" size={14} color={ds.gray400} strokeWidth={2} />
        </View>
        <View style={[styles.rule, { backgroundColor: ds.gray200 }]} />
      </Pressable>
      {expanded ? <AuriaWorkDetails run={run} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 6,
  },
  header: {
    flexDirection: 'row',
    overflow: 'hidden',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  headerPressed: {
    opacity: 0.7,
  },
  services: {
    flexDirection: 'row',
    gap: 4,
  },
  summary: {
    ...auriaTypography.label,
    flexShrink: 1,
    fontSize: 13,
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    minWidth: 0,
  },
});
