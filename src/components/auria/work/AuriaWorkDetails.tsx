import { StyleSheet, Text, View } from 'react-native';
import { visibleSections, type WorkRun } from '../../../features/auria/work/workRun';
import { runIntro, sectionNarrative } from '../../../features/auria/work/workText';
import { auriaTypography, useTheme } from '../../../theme';
import { AuriaIcon } from '../../icons';
import { AuriaWorkStepRow } from './AuriaWorkStepRow';

/** The opened panel: what the Auria did, section by section, with every step and the documents it delivered. */
export function AuriaWorkDetails({ run }: { run: WorkRun }) {
  const { ds } = useTheme();
  const text = [styles.narrative, { color: ds.gray900 }];

  return (
    <View style={styles.wrap}>
      <Text style={text}>{runIntro(run)}</Text>
      {visibleSections(run).map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={text}>{sectionNarrative(run, section.id)}</Text>
          {section.steps
            .filter((step) => step.status !== 'pending')
            .map((step) => (
              <AuriaWorkStepRow key={step.id} step={step} sectionId={section.id} />
            ))}
        </View>
      ))}
      {run.delivered.map((name, index) => (
        <View key={`${name}-${index}`} style={styles.delivered}>
          <AuriaIcon name="document" size={15} color={ds.gray500} strokeWidth={1.65} />
          <Text style={[styles.deliveredText, { color: ds.gray500 }]}>Created {name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 14,
  },
  section: {
    gap: 4,
  },
  narrative: {
    ...auriaTypography.body,
    fontSize: 14,
    lineHeight: 22,
  },
  delivered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deliveredText: {
    ...auriaTypography.label,
    fontSize: 13,
  },
});
