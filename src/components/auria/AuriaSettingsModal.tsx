import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  auriaTypography,
  myceoCornerStyle,
  useTheme,
} from '../../theme';
import { auriaProfileInitials, auriaWelcomeName } from '../../data/auriaMockData';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../icons';
import { AURIA_SCRIM } from './auriaLayout';
import { AuriaTopicChips } from './AuriaTopicChips';
import { cycleDiscoverTopic, useDiscoverPrefs } from '../../features/auria/discoverPrefsStore';

type AuriaSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const HANDLE = 'mcampante';
const EMAIL = 'martinscampante@gmail.com';
const PHONE = '+358 46 891 5660';
const PLAN = 'AATOS Pro';

export function AuriaSettingsModal({ visible, onClose }: AuriaSettingsModalProps) {
  const { ds, theme } = useTheme();
  const safeArea = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(ds, theme, safeArea.top, safeArea.bottom),
    [ds, theme, safeArea.top, safeArea.bottom],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close settings"
        />
        <View style={styles.sheet}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
            accessibilityRole="button"
            accessibilityLabel="Close settings"
            hitSlop={8}
          >
            <CloseGlyph color={ds.gray900} />
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{auriaProfileInitials}</Text>
                <View style={styles.editBadge}>
                  <AuriaIcon name="squarePen" size={14} color={ds.gray700} />
                </View>
              </View>
              <Text style={styles.handle}>{HANDLE}</Text>
            </View>

            <Section title={`Customize ${auriaWelcomeName ? 'Auria' : 'Auria'}`}>
              <NavRow icon="squarePen" title="Personalization" />
              <NavRow icon="clock" title="Memory" />
              <NavRow icon="grid" title="Apps" last />
            </Section>

            <DiscoverInterests />

            <Section title="Account">
              <ValueRow icon="mail" title="Email" value={EMAIL} />
              <ValueRow icon="idCard" title="Phone number" value={PHONE} />
              <ValueRow icon="star" title="Subscription" value={PLAN} />
              <NavRow icon="arrowPath" title="Restore purchases" chevron={false} />
              <AccentRow icon="sparkles" title="Upgrade to AATOS Ultra" last />
            </Section>

            <Section title="Theme">
              <ValueRow
                icon="sun"
                title="Appearance"
                value="System"
                trailing={<UpDownGlyph color={ds.gray500} />}
              />
              <NavRow
                icon="paintBrush"
                title="Accent color"
                trailing={
                  <View style={styles.accentTrailing}>
                    <View style={styles.accentDot} />
                    <Text style={styles.valueText}>Default</Text>
                  </View>
                }
                chevron={false}
                last
              />
            </Section>

            <Section title="App settings">
              <NavRow icon="settings" title="General" />
              <NavRow icon="bell" title="Notifications" />
              <NavRow icon="mic" title="Voice" />
              <NavRow icon="shieldCheck" title="Safety and security" />
              <NavRow icon="folder" title="Data controls" />
              <NavRow icon="users" title="Parental controls" />
              <NavRow icon="database" title="Storage" last />
            </Section>

            <Section title="Get help">
              <NavRow icon="flag" title="Report app issue" />
              <NavRow icon="messageSquare" title="Help Center" />
              <NavRow icon="exclaimCircle" title="About" last />
            </Section>

            <LogoutCard />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DiscoverInterests() {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, 0, 0), [ds, theme]);
  const prefs = useDiscoverPrefs();
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>Discover interests</Text>
      <View style={[styles.card, styles.discoverCard]}>
        <Text style={styles.discoverHint}>
          Tap a topic once to see it more in Discover, again to see it less.
        </Text>
        <AuriaTopicChips prefs={prefs} onCycle={cycleDiscoverTopic} showHeading={false} wrapChips />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, 0, 0), [ds, theme]);
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

type RowBaseProps = {
  icon: AuriaIconName;
  title: string;
  last?: boolean;
};

function NavRow({
  icon,
  title,
  last,
  chevron = true,
  trailing,
}: RowBaseProps & { chevron?: boolean; trailing?: React.ReactNode }) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, 0, 0), [ds, theme]);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.rowIcon}>
        <AuriaIcon name={icon} size={AURIA_ICON_SIZE.sm} color={ds.gray900} strokeWidth={1.7} />
      </View>
      <Text style={styles.rowTitle} numberOfLines={1}>
        {title}
      </Text>
      {trailing ?? null}
      {chevron ? (
        <AuriaIcon name="chevronRight" size={16} color={ds.gray400} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}

function ValueRow({
  icon,
  title,
  value,
  last,
  trailing,
}: RowBaseProps & { value: string; trailing?: React.ReactNode }) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, 0, 0), [ds, theme]);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${value}`}
    >
      <View style={styles.rowIcon}>
        <AuriaIcon name={icon} size={AURIA_ICON_SIZE.sm} color={ds.gray900} strokeWidth={1.7} />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.valueText} numberOfLines={1}>
        {value}
      </Text>
      {trailing ?? (
        <AuriaIcon name="chevronRight" size={16} color={ds.gray400} strokeWidth={2} />
      )}
    </Pressable>
  );
}

function AccentRow({ icon, title, last }: RowBaseProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, 0, 0), [ds, theme]);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.rowIcon}>
        <AuriaIcon name={icon} size={AURIA_ICON_SIZE.sm} color={ds.auriaBlue} strokeWidth={1.7} />
      </View>
      <Text style={[styles.rowTitle, { color: ds.auriaBlue }]}>{title}</Text>
    </Pressable>
  );
}

function LogoutCard() {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, 0, 0), [ds, theme]);
  return (
    <View style={styles.logoutWrap}>
      <Pressable
        style={({ pressed }) => [styles.logoutCard, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <View style={styles.rowIcon}>
          <LogoutGlyph color={ds.danger} />
        </View>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

function CloseGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6 6 18"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function UpDownGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={16} viewBox="0 0 14 16" fill="none">
      <Path
        d="M3.5 6 7 2.5 10.5 6 M3.5 10 7 13.5 10.5 10"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LogoutGlyph({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 12H4m11 0-3-3m3 3-3 3M9 3h9.4A1.6 1.6 0 0 1 20 4.6v14.8a1.6 1.6 0 0 1-1.6 1.6H9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeTop: number,
  safeBottom: number,
) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: AURIA_SCRIM,
    },
    sheet: {
      flex: 1,
      marginTop: Math.max(safeTop + 14, 60),
      backgroundColor: theme.colors.input,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      overflow: 'hidden',
    },
    closeButton: {
      position: 'absolute',
      top: 18,
      right: 18,
      zIndex: 2,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
      shadowColor: '#0F1216',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    closePressed: {
      opacity: 0.72,
      transform: [{ scale: 0.94 }],
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: Math.max(safeBottom + 24, 36),
      gap: 22,
    },
    profile: {
      alignItems: 'center',
      gap: 12,
      paddingTop: 24,
      paddingBottom: 8,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: ds.auriaBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...auriaTypography.title,
      color: ds.white,
      fontSize: 30,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.5,
    },
    editBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.white,
      borderWidth: 2,
      borderColor: theme.colors.input,
    },
    handle: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
    },
    sectionWrap: {
      gap: 8,
    },
    sectionTitle: {
      ...auriaTypography.body,
      paddingHorizontal: 18,
      color: ds.gray500,
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.medium,
      letterSpacing: -0.1,
    },
    card: {
      backgroundColor: ds.white,
      borderRadius: 14,
      overflow: 'hidden',
    },
    discoverCard: {
      padding: 14,
      gap: 8,
    },
    discoverHint: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 13,
      lineHeight: 18,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 52,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ds.gray200,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowPressed: {
      backgroundColor: ds.gray100,
    },
    rowIcon: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTitle: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.normal,
      letterSpacing: -0.2,
    },
    valueText: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.normal,
      letterSpacing: -0.2,
      maxWidth: 200,
    },
    accentTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    accentDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: ds.gray500,
    },
    logoutWrap: {
      marginTop: 2,
    },
    logoutCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: ds.white,
      borderRadius: 14,
      minHeight: 56,
    },
    logoutText: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.danger,
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.semibold,
      letterSpacing: -0.2,
    },
  });
}
