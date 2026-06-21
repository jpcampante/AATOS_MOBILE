import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { DiscoverArticle } from '../../features/auria/newsTypes';
import { timeAgo } from '../../features/auria/newsFormat';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';

type FeedbackState = 'like' | 'dislike' | null;

type AuriaDiscoverCardProps = {
  article: DiscoverArticle;
  expanded: boolean;
  reportMode: 'summary' | 'full';
  feedback: FeedbackState;
  listening: boolean;
  onToggleExpand: () => void;
  onToggleReport: () => void;
  onOpenSources: () => void;
  onAskFollowUp: () => void;
  onListen: () => void;
  onShare: () => void;
  onLike: () => void;
  onDislike: () => void;
  onMore: () => void;
};

const SUMMARY_CLAMP = 96;

/** A Discover story card. Collapsed it shows the hero, headline and a clamped
 *  teaser; tapping expands it INLINE (no navigation) to reveal the AI summary
 *  with source chips, a Summary/Full-report toggle, and the full action row
 *  (Ask follow up, like/dislike, Listen, share, ⋯). Mirrors Perplexity. */
export function AuriaDiscoverCard({
  article,
  expanded,
  reportMode,
  feedback,
  listening,
  onToggleExpand,
  onToggleReport,
  onOpenSources,
  onAskFollowUp,
  onListen,
  onShare,
  onLike,
  onDislike,
  onMore,
}: AuriaDiscoverCardProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  const clamped =
    article.summary.length > SUMMARY_CLAMP
      ? `${article.summary.slice(0, SUMMARY_CLAMP).trimEnd()}… `
      : `${article.summary} `;

  // Full-report paragraphs synthesised from the lead summary + each real source
  // excerpt, so "Full report" genuinely carries all the gathered information.
  const reportParas = useMemo(() => {
    if (reportMode !== 'full') return [];
    const others = Math.max(0, article.sources.length - 1);
    const lead = {
      text: article.summary,
      slug: article.sourceSlug,
      extra: Math.min(others, 2),
    };
    const rest = article.sources.slice(1).map((s) => ({
      text: s.excerpt,
      slug: s.slug,
      extra: 0,
    }));
    return [lead, ...rest];
  }, [article, reportMode]);

  const chipFor = (slug: string) => article.sources.find((s) => s.slug === slug) ?? article.sources[0];

  const SourceChip = ({ slug, extra }: { slug: string; extra: number }) => {
    const source = chipFor(slug);
    if (!source) return null;
    return (
      <Pressable onPress={onOpenSources} style={styles.sourceChip} accessibilityRole="button" accessibilityLabel={`Source: ${source.siteName}`}>
        <Image source={{ uri: source.favicon }} style={styles.chipFavicon} />
        <Text style={styles.chipLabel}>{source.slug}</Text>
        {extra > 0 ? <Text style={styles.chipPlus}>+{extra}</Text> : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggleExpand} accessibilityRole="button" accessibilityLabel={article.title}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.watermark}>
            <Image source={{ uri: article.sourceFavicon }} style={styles.watermarkIcon} />
            <Text style={styles.watermarkText} numberOfLines={1}>
              {article.sourceName}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, expanded && styles.titleExpanded]}>{article.title}</Text>

        {expanded ? (
          <Text style={styles.lead}>{article.summary}</Text>
        ) : (
          <Text style={styles.summary} numberOfLines={3}>
            {clamped}
            <Text style={styles.seeMore}>See more</Text>
          </Text>
        )}
      </Pressable>

      {expanded ? (
        <>
          {reportMode === 'summary' ? (
            <View style={styles.bullets}>
              {article.bullets.map((bullet, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{'•'}</Text>
                  <View style={styles.bulletBody}>
                    <Text style={styles.bulletText}>{bullet.text} </Text>
                    <SourceChip slug={bullet.sourceSlug} extra={bullet.extraSources} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.report}>
              {reportParas.map((para, i) => (
                <View key={i} style={styles.reportPara}>
                  <Text style={styles.reportText}>{para.text} </Text>
                  <SourceChip slug={para.slug} extra={para.extra} />
                </View>
              ))}
            </View>
          )}

          <View style={styles.ctaRow}>
            <Pressable
              onPress={onAskFollowUp}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              accessibilityRole="button"
              accessibilityLabel="Ask follow up"
            >
              <Image source={{ uri: article.sourceFavicon }} style={styles.ctaAvatar} />
              <Text style={styles.ctaText}>Ask follow up</Text>
            </Pressable>
            <Pressable
              onPress={onToggleReport}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              accessibilityRole="button"
              accessibilityLabel={reportMode === 'summary' ? 'Full report' : 'Summary'}
            >
              <AuriaIcon name="document" size={18} color={ds.gray700} strokeWidth={1.8} />
              <Text style={styles.ctaText}>{reportMode === 'summary' ? 'Full report' : 'Summary'}</Text>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.brand}>
              <Image source={{ uri: article.sourceFavicon }} style={styles.brandIcon} />
              <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable onPress={onLike} hitSlop={6} accessibilityRole="button" accessibilityLabel="Like" style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <AuriaIcon name="thumbUp" size={18} color={feedback === 'like' ? ds.auriaBlue : ds.gray600} strokeWidth={1.8} />
              </Pressable>
              <Pressable onPress={onDislike} hitSlop={6} accessibilityRole="button" accessibilityLabel="Dislike" style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <AuriaIcon name="thumbDown" size={18} color={feedback === 'dislike' ? ds.auriaBlue : ds.gray600} strokeWidth={1.8} />
              </Pressable>
              <View style={styles.divider} />
              <Pressable onPress={onListen} hitSlop={6} accessibilityRole="button" accessibilityLabel={listening ? 'Stop' : 'Listen'} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <AuriaIcon name={listening ? 'stop' : 'headphones'} size={18} color={listening ? ds.auriaBlue : ds.gray600} strokeWidth={1.8} />
              </Pressable>
              <Pressable onPress={onShare} hitSlop={6} accessibilityRole="button" accessibilityLabel="Share" style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <AuriaIcon name="upload" size={18} color={ds.gray600} strokeWidth={1.8} />
              </Pressable>
              <Pressable onPress={onMore} hitSlop={6} accessibilityRole="button" accessibilityLabel="More actions" style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                <AuriaIcon name="moreHorizontal" size={18} color={ds.gray600} strokeWidth={1.8} />
              </Pressable>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.metaRow}>
          <Text style={styles.time}>{timeAgo(article.publishedAt)}</Text>
          <View style={styles.metaRight}>
            <Pressable onPress={onListen} hitSlop={8} accessibilityRole="button" accessibilityLabel="Listen" style={({ pressed }) => [styles.listenBtn, pressed && styles.pressed]}>
              <AuriaIcon name={listening ? 'stop' : 'headphones'} size={18} color={listening ? ds.auriaBlue : ds.gray600} strokeWidth={1.8} />
              <Text style={[styles.listenText, listening && { color: ds.auriaBlue }]}>{listening ? 'Stop' : 'Listen'}</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={onShare} hitSlop={8} accessibilityRole="button" accessibilityLabel="Share" style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
              <AuriaIcon name="upload" size={18} color={ds.gray600} strokeWidth={1.8} />
            </Pressable>
            <Pressable onPress={onMore} hitSlop={8} accessibilityRole="button" accessibilityLabel="More actions" style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
              <AuriaIcon name="moreHorizontal" size={18} color={ds.gray600} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    card: { gap: 10, paddingBottom: 8 },
    imageWrap: {
      width: '100%',
      aspectRatio: 16 / 10,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: ds.gray200,
    },
    image: { width: '100%', height: '100%' },
    watermark: {
      position: 'absolute',
      right: 10,
      bottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    watermarkIcon: { width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.85)' },
    watermarkText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
      maxWidth: 160,
    },
    title: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.4,
    },
    titleExpanded: { fontSize: 24, lineHeight: 30 },
    summary: {
      ...auriaTypography.body,
      color: ds.gray600,
      fontSize: 15,
      lineHeight: 21,
    },
    seeMore: { color: ds.gray900, fontWeight: theme.typography.fontWeight.semibold },
    lead: {
      ...auriaTypography.body,
      color: ds.gray700,
      fontSize: 16,
      lineHeight: 23,
    },
    bullets: { gap: 14, marginTop: 2 },
    bulletRow: { flexDirection: 'row', gap: 10 },
    bulletDot: { color: ds.gray500, fontSize: 18, lineHeight: 25 },
    bulletBody: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    bulletText: { ...auriaTypography.body, color: ds.gray900, fontSize: 16, lineHeight: 25 },
    report: { gap: 16, marginTop: 2 },
    reportPara: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    reportText: { ...auriaTypography.body, color: ds.gray900, fontSize: 16, lineHeight: 25 },
    sourceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 7,
      backgroundColor: ds.sectionFill,
    },
    chipFavicon: { width: 13, height: 13, borderRadius: 3, backgroundColor: ds.gray200 },
    chipLabel: { ...auriaTypography.label, color: ds.gray600, fontSize: 12, fontWeight: theme.typography.fontWeight.medium },
    chipPlus: { ...auriaTypography.label, color: ds.gray500, fontSize: 12, fontWeight: theme.typography.fontWeight.medium },
    ctaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 42,
      paddingHorizontal: 14,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      backgroundColor: theme.colors.surface,
    },
    ctaPressed: { backgroundColor: ds.gray100 },
    ctaAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: ds.gray200 },
    ctaText: { ...auriaTypography.body, color: ds.gray900, fontSize: 15, fontWeight: theme.typography.fontWeight.semibold },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.divider,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    brandIcon: { width: 18, height: 18, borderRadius: 5, backgroundColor: ds.gray200 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    time: { ...auriaTypography.body, color: ds.gray500, fontSize: 13 },
    metaRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    listenBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 8,
    },
    listenText: { ...auriaTypography.body, color: ds.gray700, fontSize: 14, fontWeight: theme.typography.fontWeight.medium },
    divider: { width: 1, height: 18, backgroundColor: ds.gray300, marginHorizontal: 4 },
    iconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    pressed: { backgroundColor: ds.gray100 },
  });
}
