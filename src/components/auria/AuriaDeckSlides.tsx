import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DeckDocument } from '../../features/auria/documentContent';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';

/**
 * A presentation the Auria wrote, read only (A040): one card per slide, in the
 * deck's order, with the text each slide carries. The phone does not draw the
 * template's layout — it shows what is written.
 */
export function AuriaDeckSlides({ deck }: { deck: DeckDocument }) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <View style={styles.wrap}>
      {deck.slides.map((slide, index) => (
        <View key={index} style={[styles.slide, myceoCornerStyle('inset')]}>
          <Text style={styles.number}>Slide {index + 1}</Text>
          {slide.eyebrow ? <Text style={styles.eyebrow}>{slide.eyebrow}</Text> : null}
          {slide.title ? <Text style={styles.title}>{slide.title}</Text> : null}
          {slide.lead ? <Text style={styles.lead}>{slide.lead}</Text> : null}
          {slide.points.map((point, pointIndex) => (
            <View key={pointIndex} style={styles.point}>
              <Text style={styles.pointTitle}>{point.title}</Text>
              {point.body ? <Text style={styles.pointBody}>{point.body}</Text> : null}
            </View>
          ))}
          {slide.outcome ? <Text style={styles.outcome}>{slide.outcome}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: { gap: 10 },
    slide: {
      padding: 14,
      gap: 6,
      backgroundColor: ds.sectionFill,
    },
    number: {
      ...auriaTypography.label,
      fontSize: 11,
      letterSpacing: 0,
      color: ds.gray500,
    },
    eyebrow: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      color: ds.auriaBlue,
    },
    title: {
      ...auriaTypography.title,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: theme.typography.fontWeight.semibold,
      color: ds.gray900,
    },
    lead: {
      ...auriaTypography.body,
      fontSize: 14,
      lineHeight: 20,
      color: ds.gray700 ?? ds.gray600,
    },
    point: {
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: ds.gray200,
      gap: 2,
    },
    pointTitle: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    pointBody: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 19,
      color: ds.gray600,
    },
    outcome: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 19,
      fontStyle: 'italic',
      color: ds.gray600,
    },
  });
}
