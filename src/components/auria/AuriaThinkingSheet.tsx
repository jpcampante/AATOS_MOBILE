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
import type { AuriaThoughtSource, AuriaReasoning, AuriaThoughtStep } from '../../features/auria/types';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, type AuriaIconName } from '../icons';
import { AURIA_SCRIM } from './auriaLayout';

type AuriaThinkingSheetProps = {
  visible: boolean;
  onClose: () => void;
  reasoning: AuriaReasoning;
  /** Redirect to the files area when an internal document is opened. */
  onOpenFiles?: () => void;
};

const QUERY_PREVIEW = 4;
const SOURCE_PREVIEW = 4;

const FAVICON_TINTS = ['#E7EEF9', '#F3E8F7', '#E8F5EC', '#FBEFE3', '#EAF0F4', '#F6E9E9'];
const tintFor = (label: string) => FAVICON_TINTS[label.charCodeAt(0) % FAVICON_TINTS.length];

const DOC_ICON: Record<NonNullable<AuriaThoughtSource['docType']>, AuriaIconName> = {
  pdf: 'document',
  doc: 'document',
  sheet: 'grid',
};
const DOC_TYPE_LABEL: Record<NonNullable<AuriaThoughtSource['docType']>, string> = {
  pdf: 'PDF',
  doc: 'Document',
  sheet: 'Spreadsheet',
};

const sourceKind = (s: AuriaThoughtSource): 'web' | 'doc' => s.kind ?? 'web';

function openLink(url: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url).catch(() => {});
  }
}

/** The full "Thinking" timeline — opens when the thought chip is tapped. */
export function AuriaThinkingSheet({ visible, onClose, reasoning, onOpenFiles }: AuriaThinkingSheetProps) {
  const { ds, theme } = useTheme();
  const safe = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(
    () => createStyles(ds, theme, safe.bottom, windowHeight),
    [ds, theme, safe.bottom, windowHeight],
  );
  const [doc, setDoc] = useState<AuriaThoughtSource | null>(null);

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
                onOpenDoc={setDoc}
              />
            ))}
          </ScrollView>

          {doc ? (
            <View style={styles.docViewer}>
              <View style={styles.docHeader}>
                <Pressable
                  onPress={() => setDoc(null)}
                  style={({ pressed }) => [styles.docBack, pressed && styles.chipPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Back to thinking"
                >
                  <AuriaIcon name="chevronLeft" size={20} color={ds.gray700} strokeWidth={2} />
                </Pressable>
                <View style={styles.docIcon}>
                  <AuriaIcon
                    name={doc.docType ? DOC_ICON[doc.docType] : 'document'}
                    size={18}
                    color={ds.gray700}
                    strokeWidth={1.8}
                  />
                </View>
                <View style={styles.docHeaderText}>
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {doc.label}
                  </Text>
                  <Text style={styles.docMeta}>
                    {doc.docType ? DOC_TYPE_LABEL[doc.docType] : 'Document'} · Internal
                  </Text>
                </View>
              </View>

              <Text style={styles.docExcerptLabel}>Document</Text>
              <ScrollView style={styles.docScroll} contentContainerStyle={styles.docScrollContent}>
                <Text style={styles.docExcerpt}>
                  {doc.excerpt ??
                    'This internal document was consulted while answering. Open it in your files to read the full content.'}
                </Text>
              </ScrollView>

              {onOpenFiles ? (
                <Pressable
                  onPress={() => {
                    setDoc(null);
                    onClose();
                    onOpenFiles();
                  }}
                  style={({ pressed }) => [styles.openFiles, pressed && styles.openFilesPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Open in files"
                >
                  <AuriaIcon name="folder" size={16} color={ds.white} strokeWidth={1.9} />
                  <Text style={styles.openFilesText}>Open in files</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
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
  onOpenDoc,
}: {
  step: AuriaThoughtStep;
  isLast: boolean;
  styles: ReturnType<typeof createStyles>;
  ds: ReturnType<typeof useTheme>['ds'];
  onOpenDoc: (source: AuriaThoughtSource) => void;
}) {
  const [allQueries, setAllQueries] = useState(false);
  const [allSources, setAllSources] = useState(false);

  const queries = step.queries ?? [];
  const sources = step.sources ?? [];
  const shownQueries = allQueries ? queries : queries.slice(0, QUERY_PREVIEW);
  const shownSources = allSources ? sources : sources.slice(0, SOURCE_PREVIEW);
  const moreQueries = queries.length - shownQueries.length;
  const moreSources = sources.length - shownSources.length;

  const tapSource = (s: AuriaThoughtSource) => {
    if (sourceKind(s) === 'doc') onOpenDoc(s);
    else openLink(s.url ?? `https://${s.label}`);
  };

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
            {shownSources.map((s, si) => {
              const isDoc = sourceKind(s) === 'doc';
              return (
                <Pressable
                  key={`s-${si}`}
                  onPress={() => tapSource(s)}
                  style={({ pressed }) => [styles.sourcePill, pressed && styles.chipPressed]}
                  accessibilityRole={isDoc ? 'button' : 'link'}
                  accessibilityLabel={isDoc ? `Open document ${s.label}` : `Open ${s.label}`}
                >
                  {isDoc ? (
                    <View style={styles.docFavicon}>
                      <AuriaIcon
                        name={s.docType ? DOC_ICON[s.docType] : 'document'}
                        size={12}
                        color={ds.gray600}
                        strokeWidth={1.8}
                      />
                    </View>
                  ) : (
                    <View style={[styles.favicon, { backgroundColor: tintFor(s.label) }]}>
                      <Text style={styles.faviconText}>{s.label.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.sourceText} numberOfLines={1}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
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
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: AURIA_SCRIM },
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
    rail: { width: 24, alignItems: 'center' },
    marker: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
    },
    dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: ds.gray800 },
    connector: { flex: 1, width: 1.5, backgroundColor: ds.gray200, marginVertical: 2 },
    content: { flex: 1, paddingBottom: 22, gap: 10 },
    stepTitle: {
      ...auriaTypography.title,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray900,
      marginTop: 1,
    },
    body: { ...auriaTypography.body, fontSize: 15, lineHeight: 23, color: ds.gray600 },
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
    queryText: { ...auriaTypography.body, flex: 1, fontSize: 13.5, color: ds.gray700 },
    moreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 7,
      ...myceoCornerStyle('chip'),
    },
    sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
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
    favicon: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    docFavicon: {
      width: 18,
      height: 18,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
      borderWidth: 1,
      borderColor: ds.gray200,
    },
    faviconText: {
      ...auriaTypography.label,
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray700,
    },
    sourceText: { ...auriaTypography.body, fontSize: 13, color: ds.gray700 },
    moreChip: {
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: ds.gray100,
      borderRadius: 999,
    },
    moreText: { ...auriaTypography.label, fontSize: 13, color: ds.gray500 },

    /* Internal document viewer (drill-in) */
    docViewer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: ds.white,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingTop: 16,
      paddingHorizontal: 22,
      paddingBottom: Math.max(safeBottom, 12),
      gap: 12,
    },
    docHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    docBack: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -6,
      ...myceoCornerStyle('icon'),
    },
    docIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
      ...myceoCornerStyle('icon'),
    },
    docHeaderText: { flex: 1, gap: 2 },
    docTitle: {
      ...auriaTypography.title,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.gray900,
    },
    docMeta: { ...auriaTypography.label, fontSize: 12, color: ds.gray500 },
    docExcerptLabel: {
      ...auriaTypography.label,
      fontSize: 11,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: ds.gray400,
    },
    docScroll: { flex: 1 },
    docScrollContent: { paddingBottom: 12 },
    docExcerpt: { ...auriaTypography.body, fontSize: 14.5, lineHeight: 23, color: ds.gray800 },
    openFiles: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      backgroundColor: ds.offBlack,
      ...myceoCornerStyle('panel'),
    },
    openFilesPressed: { opacity: 0.85 },
    openFilesText: {
      ...auriaTypography.body,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.bold,
      color: ds.white,
    },
  });
}
