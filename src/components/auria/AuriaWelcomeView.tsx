import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { auriaWelcomeName } from '../../data/auriaMockData';
import { AURIA_CONTENT_HORIZONTAL_INSET } from './auriaLayout';
import { AnimatedScreenBlock } from '../navigation/AnimatedScreenBlock';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaBloomMark } from './AuriaBloomMark';

type AuriaWelcomeViewProps = {
  contentMaxWidth?: number;
  contentTopPadding?: number;
};

export function AuriaWelcomeView({
  contentMaxWidth,
  contentTopPadding = 56,
}: AuriaWelcomeViewProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(
    () => createStyles(ds, theme, contentMaxWidth, contentTopPadding),
    [contentMaxWidth, contentTopPadding, ds, theme],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.centerBlock}>
        <AnimatedScreenBlock index={0} centered>
          <View style={styles.columnWrap}>
            <View style={styles.greetingBlock}>
              <View style={styles.greetRow}>
                <View style={styles.greetLogo}>
                  <AuriaBloomMark size="md" />
                </View>
                <Text style={styles.greetHi}>Hi {auriaWelcomeName}</Text>
              </View>
              <Text style={styles.greetTitle}>Where should we start?</Text>
            </View>
          </View>
        </AnimatedScreenBlock>
      </View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  contentMaxWidth?: number,
  contentTopPadding = 56,
) {
  const column = contentMaxWidth
    ? { maxWidth: contentMaxWidth, width: '100%' as const }
    : { width: '100%' as const };
  return StyleSheet.create({
    wrap: {
      flex: 1,
    },
    centerBlock: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: AURIA_CONTENT_HORIZONTAL_INSET,
      paddingTop: contentTopPadding,
      gap: 14,
    },
    greetingBlock: {
      width: '100%',
      alignItems: 'center',
      gap: 6,
    },
    greetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    greetLogo: {
      marginTop: 1,
    },
    columnWrap: {
      ...column,
      alignSelf: 'center',
    },
    greetHi: {
      ...auriaTypography.body,
      fontSize: 17,
      fontWeight: theme.typography.fontWeight.normal,
      color: ds.gray500,
      letterSpacing: -0.2,
      textAlign: 'center',
    },
    greetTitle: {
      ...auriaTypography.title,
      fontSize: 24,
      fontWeight: theme.typography.fontWeight.normal,
      color: ds.gray700,
      letterSpacing: -0.5,
      lineHeight: 30,
      textAlign: 'center',
      width: '100%',
    },
  });
}
