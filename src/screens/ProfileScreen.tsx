import { useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../components/icons';
import { AuriaTopicChips } from '../components/auria/AuriaTopicChips';
import { cycleDiscoverTopic, useDiscoverPrefs } from '../features/auria/discoverPrefsStore';
import { clearAuriaPrefs } from '../features/auria/prefs';
import { useAuth } from '../features/auth';
import { auriaTypography, useTheme, type ThemePreference } from '../theme';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/** The Profile tab: the signed-in account, appearance and sign-out. Only things that work. */
export function ProfileScreen() {
  const { ds, theme, preference, setPreference } = useTheme();
  const { user, signOut } = useAuth();
  const discoverPrefs = useDiscoverPrefs();
  // A photo URL that fails to load falls back to the initials.
  const [photoFailed, setPhotoFailed] = useState(false);
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle} accessibilityRole="header">
        Profile
      </Text>

      <View style={styles.profile}>
        {user?.pictureUrl && !photoFailed ? (
          <Image
            source={{ uri: user.pictureUrl }}
            style={styles.avatar}
            onError={() => setPhotoFailed(true)}
            accessibilityIgnoresInvertColors
            accessibilityLabel={`Photo of ${user.name}`}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.initials}</Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name}</Text>
      </View>

      <Section title="Account" styles={styles}>
        <InfoRow icon="mail" title="Email" value={user?.email ?? ''} styles={styles} last />
      </Section>

      <Section title="Appearance" styles={styles}>
        <View style={styles.themeOptions} accessibilityRole="radiogroup">
          {THEME_OPTIONS.map(({ value, label }) => {
            const active = preference === value;
            return (
              <Pressable
                key={value}
                onPress={() => setPreference(value)}
                style={({ pressed }) => [
                  styles.themeOption,
                  active && styles.themeOptionActive,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="radio"
                accessibilityLabel={`${label} theme`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Discover interests" styles={styles}>
        <View style={styles.discover}>
          <Text style={styles.hint}>
            Tap a topic once to see it more in Discover, again to see it less.
          </Text>
          <AuriaTopicChips
            prefs={discoverPrefs}
            onCycle={cycleDiscoverTopic}
            showHeading={false}
            wrapChips
          />
        </View>
      </Section>

      <Pressable
        style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
        // The next account must not reopen this account's last chat.
        onPress={() => void clearAuriaPrefs().finally(() => signOut())}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <View style={styles.rowIcon}>
          <LogoutGlyph color={ds.danger} />
        </View>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

type Styles = ReturnType<typeof createStyles>;

function Section({ title, styles, children }: { title: string; styles: Styles; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  value,
  styles,
  last,
}: {
  icon: AuriaIconName;
  title: string;
  value: string;
  styles: Styles;
  last?: boolean;
}) {
  const { ds } = useTheme();
  return (
    <View style={[styles.row, last && styles.rowLast]} accessible accessibilityLabel={`${title}: ${value}`}>
      <View style={styles.rowIcon}>
        <AuriaIcon name={icon} size={AURIA_ICON_SIZE.sm} color={ds.gray900} strokeWidth={1.7} />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.valueText} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
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

function createStyles(ds: ReturnType<typeof useTheme>['ds'], theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
      gap: 22,
    },
    screenTitle: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 28,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.5,
      paddingHorizontal: 4,
    },
    profile: {
      alignItems: 'center',
      gap: 12,
      paddingBottom: 4,
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
    name: {
      ...auriaTypography.title,
      color: ds.gray900,
      fontSize: 19,
      fontWeight: theme.typography.fontWeight.bold,
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    section: {
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
    rowIcon: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTitle: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 16,
      letterSpacing: -0.2,
    },
    valueText: {
      ...auriaTypography.body,
      flex: 1,
      textAlign: 'right',
      color: ds.gray500,
      fontSize: 15,
      letterSpacing: -0.2,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 8,
      padding: 8,
    },
    themeOption: {
      flex: 1,
      minHeight: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeOptionActive: {
      backgroundColor: ds.gray100,
    },
    themeOptionText: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.medium,
    },
    themeOptionTextActive: {
      color: ds.gray900,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    discover: {
      padding: 14,
      gap: 8,
    },
    hint: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 13,
      lineHeight: 18,
    },
    logout: {
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
    pressed: {
      opacity: 0.7,
    },
  });
}
