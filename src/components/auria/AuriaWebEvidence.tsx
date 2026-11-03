import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { siteName, sourceDate, webEvidenceView } from '../../features/auria/webEvidence';
import type { WebResult, WebSource } from '../../features/auria/webResult';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';
import { AuriaSiteBadge } from './AuriaSiteBadge';
import { AuriaWebSourceCover } from './AuriaWebSourceCover';

type AuriaWebEvidenceProps = {
  result: WebResult;
  /** Opens a source; defaults to the browser. */
  onOpenSource?: (source: WebSource) => void;
};

/**
 * What the web search did for this answer (A035): the state while it runs, up
 * to four source cards, and the full list of sources behind a disclosure. Same
 * content and texts as the web's `WebEvidence`; a card's picture and the site
 * logos never come from the site itself: the
 * images come through the server's signed route (A036).
 */
export function AuriaWebEvidence({ result, onOpenSource }: AuriaWebEvidenceProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [expanded, setExpanded] = useState(false);
  const view = webEvidenceView(result);
  const open = (source: WebSource) => (onOpenSource ? onOpenSource(source) : void Linking.openURL(source.url));

  return (
    <View style={styles.wrap} accessibilityLabel="Web evidence">
      {view.sources.length > 0 ? (
        <View style={styles.header}>
          <AuriaIcon name="globe" size={15} color={ds.gray600} strokeWidth={1.8} />
          <Text style={styles.headerTitle}>Web sources</Text>
          <Text style={styles.count}>{view.sources.length}</Text>
        </View>
      ) : null}

      {view.showLabel ? (
        <Text style={styles.status} accessibilityLiveRegion={view.searching ? 'polite' : 'none'}>
          {view.label}
        </Text>
      ) : null}
      {view.failure ? <Text style={styles.note}>{view.failure}</Text> : null}
      {view.keptNote ? <Text style={styles.note}>Sources found earlier in this turn are kept.</Text> : null}

      {view.cards.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardRow}
          accessibilityLabel="Web source cards"
        >
          {view.cards.map((source) => (
            <Pressable
              key={source.index}
              onPress={() => open(source)}
              accessibilityRole="button"
              accessibilityLabel={`Open source ${source.index}: ${source.title}`}
              style={({ pressed }) => [styles.card, myceoCornerStyle('inset'), pressed && styles.pressed]}
            >
              <AuriaWebSourceCover source={source} />
              <View style={styles.cardSite}>
                <AuriaSiteBadge source={source} size={16} />
                <Text style={styles.cardSiteName} numberOfLines={1}>
                  {siteName(source)}
                </Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={3}>
                {source.title}
              </Text>
              {source.date ? <Text style={styles.cardDate}>{sourceDate(source.date)}</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {view.sources.length > 0 ? (
        <View>
          <Pressable
            onPress={() => setExpanded((open_) => !open_)}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${view.summary}, ${expanded ? 'hide' : 'show'} the list`}
            hitSlop={6}
            style={styles.summaryRow}
          >
            <Text style={styles.summary}>{view.summary}</Text>
            <View style={expanded ? styles.chevronUp : null}>
              <AuriaIcon name="chevronDown" size={12} color={ds.gray500} strokeWidth={1.8} />
            </View>
          </Pressable>
          {expanded ? (
            <View style={styles.list}>
              {view.uncertainNote ? <Text style={styles.note}>{view.uncertainNote}</Text> : null}
              {view.sources.map((source) => (
                <Pressable
                  key={source.index}
                  onPress={() => open(source)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open source ${source.index}: ${source.title}`}
                  style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
                >
                  <AuriaSiteBadge source={source} size={16} />
                  <View style={styles.listBody}>
                    <Text style={styles.listTitle} numberOfLines={2}>
                      [{source.index}] {source.title}
                    </Text>
                    <Text style={styles.listMeta} numberOfLines={1}>
                      {[siteName(source), sourceDate(source.date)].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: {
      marginTop: 10,
      gap: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerTitle: {
      ...auriaTypography.label,
      fontSize: 13,
      letterSpacing: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    count: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      color: ds.gray500,
    },
    status: {
      ...auriaTypography.body,
      fontSize: 13,
      color: ds.gray600,
    },
    note: {
      ...auriaTypography.body,
      fontSize: 12,
      color: ds.gray500,
    },
    cardRow: {
      gap: 8,
      paddingRight: 4,
    },
    card: {
      width: 180,
      padding: 10,
      gap: 6,
      backgroundColor: ds.sectionFill,
    },
    cardSite: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardSiteName: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      color: ds.gray600,
      flexShrink: 1,
    },
    cardTitle: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray900,
    },
    cardDate: {
      ...auriaTypography.label,
      fontSize: 11,
      letterSpacing: 0,
      color: ds.gray500,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
    },
    summary: {
      ...auriaTypography.label,
      fontSize: 12,
      letterSpacing: 0,
      fontWeight: theme.typography.fontWeight.medium,
      color: ds.gray600,
    },
    list: {
      gap: 8,
      paddingTop: 2,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    listBody: {
      flex: 1,
      gap: 2,
    },
    listTitle: {
      ...auriaTypography.body,
      fontSize: 13,
      lineHeight: 18,
      color: ds.gray900,
    },
    listMeta: {
      ...auriaTypography.label,
      fontSize: 11,
      letterSpacing: 0,
      color: ds.gray500,
    },
    chevronUp: {
      transform: [{ rotate: '180deg' }],
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
