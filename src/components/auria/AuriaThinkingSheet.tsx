import { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuriaReasoning, AuriaThoughtStep } from '../../features/auria/types';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type AuriaThinkingSheetProps = {
  visible: boolean;
  onClose: () => void;
  reasoning: AuriaReasoning;
};

const QUERY_PREVIEW = 4;
const SOURCE_PREVIEW = 4;

const FAVICON_TINTS = ['#E7EEF9', '#F3E8F7', '#E8F5EC', '#FBEFE3', '#EAF0F4', '#F6E9E9'];
const tintFor = (label: string) => FAVICON_TINTS[label.charCodeAt(0) % FAVICON_TINTS.length];

function openLink(url: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url).catch(() => {});
  }
}

/** The full "Thinking" timeline — opens when the thought chip is tapped. */
export function AuriaThinkingSheet({ visible, onClose, reasoning }: AuriaThinkingSheetProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(ds, theme, safe.bottom, windowHeight),
    [ds, theme, safe.bottom, windowHeight],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Thinking</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {reasoning.steps.map((step, i) => (
              <Step
                key={`${i}-${step.title.slice(0, 10)}`}
                step={step}
                isLast={i === reasoning.steps.length - 1}
                styles={styles}
                ds={ds}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Step({
  step,
  isLast,
  styles,
  ds,
}: {
  step: AuriaThoughtStep;
  isLast: boolean;
  styles: ReturnType<typeof createStyles>;
  ds: ReturnType<typeof useTheme>['ds'];
}) {
  const [allQueries, setAllQueries] = useState(false);
  const [allSources, setAllSources] = useState(false);

  const queries = step.queries ?? [];
  const sources = step.sources ?? [];
  const shownQueries = allQueries ? queries : queries.slice(0, QUERY_PREVIEW);
  const shownSources = allSources ? sources : sources.slice(0, SOURCE_PREVIEW);
  const moreQueries = queries.length - shownQueries.length;
  const moreSources = sources.length - shownSources.length;

  return (
    <View style={styles.step}>
      <View style={styles.rail}>
        <View style={styles.marker}>
          {step.kind === 'search' ? (
            <AuriaIcon name="globe" size={15} color={ds.gray600} strokeWidth={1.7} />
          ) : (
            <View style={styles.dot} />
          )}
        </View>
        {!isLast ? <View style={styles.connector} /> : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.stepTitle}>{step.title}</Text>

        {step.body ? <Text style={styles.body}>{step.body}</Text> : null}

        {queries.length > 0 ? (
          <View style={styles.queries}>
            {shownQueries.map((q, qi) => (
              <Pressable
                key={`q-${qi}`}
                onPress={() => openLink(`https://www.google.com/search?q=${encodeURIComponent(q)}`)}
                style={({ pressed }) => [styles.queryChip, pressed && styles.chipPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Search ${q}`}
              >
                <AuriaIcon name="search" size={13} color={ds.gray500} strokeWidth={1.8} />
                <Text style={styles.queryText} numberOfLines={1}>
                  {q}
                </Text>
              </Pressable>
            ))}
            {moreQueries > 0 ? (
              <Pressable
                onPress={() => setAllQueries(true)}
                style={({ pressed }) => [styles.moreRow, pressed && styles.chipPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Show ${moreQueries} more searches`}
              >
                <Text style={styles.moreText}>{moreQueries} more</Text>
                <AuriaIcon name="chevronDown" size={13} color={ds.gray500} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {sources.length > 0 ? (
          <View style={styles.sources}>
            {shownSources.map((s, si) => (
              <Pressable
                key={`s-${si}`}
                onPress={() => openLink(s.url ?? `https://${s.label}`)}
                style={({ pressed }) => [styles.sourcePill, pressed && styles.chipPressed]}
                accessibilityRole="link"
                accessibilityLabel={`Open ${s.label}`}
              >
                <View style={[styles.favicon, { backgroundColor: tintFor(s.label) }]}>
                  <Text style={styles.faviconText}>{s.label.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.sourceText} numberOfLines={1}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
            {moreSources > 0 ? (
              <Pressable
                onPress={() => setAllSources(true)}
                style={({ pressed }) => [styles.moreChip, pressed && styles.chipPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Show ${moreSources} more sources`}
              >
                <Text style={styles.moreText}>{moreSources} more</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeBottom: number,
  windowHeight: number,
) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,18,22,0.32)' },
    sheet: {
      maxHeight: Math.round(windowHeight * 0.9),
      backgroundColor: ds.white,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingTop: 10,
      paddingBottom: Math.max(safeBottom, 12),
      overflow: 'hidden',
    },
    grabber: {
      alignSelf: 'center',
      width: 38,
      height: 5,
      borderRadius: 3,
      backgroundColor: ds.gray200,
      marginBottom: 10,
    },
    title: {
      ...auriaTypography.title,
      fontSize: 21,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray900,
      paddingHorizontal: 22,
      paddingBottom: 8,
    },
    scroll: { flexGrow: 0 },
    scrollContent: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 },
    step: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 12,
    },
    rail: {
      width: 24,
      alignItems: 'center',
    },
    marker: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: ds.gray800,
    },
    connector: {
      flex: 1,
      width: 1.5,
      backgroundColor: ds.gray200,
      marginVertical: 2,
    },
    content: {
      flex: 1,
      paddingBottom: 22,
      gap: 10,
    },
    stepTitle: {
      ...auriaTypography.title,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray900,
      marginTop: 1,
    },
    body: {
      ...auriaTypography.body,
      fontSize: 15,
      lineHeight: 23,
      color: ds.gray600,
    },
    queries: { gap: 7 },
    queryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('chip'),
    },
    chipPressed: { backgroundColor: ds.gray200 },
    queryText: {
      ...auriaTypography.body,
      flex: 1,
      fontSize: 13.5,
      color: ds.gray700,
    },
    moreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 7,
      ...myceoCornerStyle('chip'),
    },
    sources: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 2,
    },
    sourcePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingLeft: 5,
      paddingRight: 13,
      paddingVertical: 5,
      backgroundColor: ds.gray100,
      borderWidth: 1,
      borderColor: ds.gray200,
      borderRadius: 999,
    },
    favicon: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    faviconText: {
      ...auriaTypography.label,
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray700,
    },
    sourceText: {
      ...auriaTypography.body,
      fontSize: 13,
      color: ds.gray700,
    },
    moreChip: {
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: ds.gray100,
      borderRadius: 999,
    },
    moreText: {
      ...auriaTypography.label,
      fontSize: 13,
      color: ds.gray500,
    },
  });
}
