import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { WorkSectionId, WorkStep } from '../../../features/auria/work/workRun';
import { stepLabel } from '../../../features/auria/work/workText';
import { auriaTypography, typography, useTheme } from '../../../theme';
import { AuriaIcon, type AuriaIconName } from '../../icons';
import { AuriaServiceMark } from './AuriaServiceMark';

/** Same glyphs as the web: plan, research, create, deliver. */
const SECTION_ICON: Record<WorkSectionId, AuriaIconName> = {
  plan: 'lightBulb',
  research: 'search',
  create: 'pencil',
  deliver: 'cube',
};

type AuriaWorkStepRowProps = {
  step: WorkStep;
  sectionId: WorkSectionId;
};

/** One step in the work details: what it did ("Checked your calendar") with the service's mark. */
export function AuriaWorkStepRow({ step, sectionId }: AuriaWorkStepRowProps) {
  const { ds } = useTheme();
  const running = step.status === 'running';
  const error = step.status === 'error';

  let icon;
  if (running) icon = <ActivityIndicator size="small" color={ds.gray500} style={styles.spinner} />;
  else if (error) icon = <AuriaIcon name="exclaimCircle" size={15} color={ds.danger} strokeWidth={1.8} />;
  else if (step.status === 'done' && step.service) icon = <AuriaServiceMark service={step.service} size={15} />;
  else icon = <AuriaIcon name={SECTION_ICON[sectionId]} size={15} color={ds.gray500} strokeWidth={1.65} />;

  return (
    <View style={styles.row}>
      <View style={styles.icon}>{icon}</View>
      <Text
        style={[styles.label, { color: error ? ds.danger : ds.gray500 }, running && styles.labelRunning]}
        numberOfLines={2}
      >
        {stepLabel(step)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  icon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    transform: [{ scale: 0.7 }],
  },
  label: {
    ...auriaTypography.label,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  labelRunning: {
    fontWeight: typography.fontWeight.medium,
  },
});
