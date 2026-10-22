import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../icons';
import { auriaTypography, MYCEO_CORNER_RADIUS, useTheme } from '../../theme';
import { markdownToPlainText } from '../../features/auria/markdownBlocks';

type MenuItem = {
  id: 'retry';
  label: string;
  icon: AuriaIconName;
};

const MENU_ITEMS: MenuItem[] = [{ id: 'retry', label: 'Retry', icon: 'arrowPath' }];

type AuriaMessageActionsProps = {
  /** The reply text — copied, read aloud, or shared. */
  text: string;
  /** Model label shown in the menu footer (e.g. "Used Opus 4.8"). */
  modelLabel?: string;
  onRetry?: () => void;
  /** Drawn first in the row (the version switcher `< 2/3 >`). */
  leading?: ReactNode;
  /** Transient feedback ("Copied", "Speaking…") surfaced as a toast. */
  onFeedback?: (message: string) => void;
};

/** A short "Today, 19.35"-style stamp for the menu header. */
function nowStamp(): string {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `Today, ${hh}.${mm}`;
}

/**
 * The action affordances under every finished Auria reply — copy, read aloud,
 * share, plus a "•••" menu (Retry) when the answer can be retried. Mirrors the
 * ChatGPT message toolbar. Actions are functional where the platform allows
 * (clipboard / speech / native share on web), and degrade to a toast otherwise.
 */
export function AuriaMessageActions({
  text,
  modelLabel = 'Used Auria',
  onRetry,
  leading,
  onFeedback,
}: AuriaMessageActionsProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // The answer is Markdown; copy, read aloud and share use it without the marks.
  const plain = useMemo(() => markdownToPlainText(text), [text]);
  // Each menu item shows only when its action is wired.
  const menuHandlers: Record<MenuItem['id'], (() => void) | undefined> = { retry: onRetry };
  const menuItems = MENU_ITEMS.filter((item) => menuHandlers[item.id]);

  // Never leave speech running after this reply unmounts.
  useEffect(
    () => () => {
      Speech.stop();
    },
    [],
  );

  const copy = async () => {
    try {
      // expo-clipboard works on iOS, Android and web (uses the async
      // Clipboard API with a document.execCommand fallback under the hood).
      await Clipboard.setStringAsync(plain);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onFeedback?.('Message copied');
    } catch {
      onFeedback?.('Copy failed');
    }
  };

  const readAloud = async () => {
    try {
      // Toggle: a second tap stops the current narration.
      if (speaking || (await Speech.isSpeakingAsync())) {
        await Speech.stop();
        setSpeaking(false);
        return;
      }
      setSpeaking(true);
      Speech.speak(plain, {
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
      onFeedback?.('Reading aloud');
    } catch {
      setSpeaking(false);
      onFeedback?.('Read aloud not available');
    }
  };

  const share = async () => {
    try {
      if (Platform.OS === 'web') {
        const nav =
          typeof navigator !== 'undefined'
            ? (navigator as Navigator & { share?: (d: { text: string }) => Promise<void> })
            : null;
        if (nav?.share) {
          await nav.share({ text: plain });
        } else {
          // No Web Share API (most desktop browsers) — copy instead so the
          // user still walks away with the text.
          await Clipboard.setStringAsync(plain);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onFeedback?.('Copied to clipboard');
        }
        return;
      }
      await Share.share({ message: plain });
    } catch {
      // User dismissed the share sheet — not an error worth surfacing.
    }
  };

  const runMenu = (id: MenuItem['id']) => {
    setMenuOpen(false);
    menuHandlers[id]?.();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {leading}
        <ActionButton icon="copy" label="Copy" onPress={copy} styles={styles} color={ds.gray600} />
        <ActionButton
          icon="speaker"
          label={speaking ? 'Stop reading' : 'Read aloud'}
          onPress={readAloud}
          styles={styles}
          color={speaking ? ds.auriaBlue : ds.gray600}
        />
        <ActionButton icon="upload" label="Share" onPress={share} styles={styles} color={ds.gray600} />
        {menuItems.length > 0 ? (
          <ActionButton
            icon="moreHorizontal"
            label="More actions"
            onPress={() => setMenuOpen((open) => !open)}
            styles={styles}
            color={ds.gray600}
          />
        ) : null}
      </View>

      {menuOpen && menuItems.length > 0 ? (
        <>
          {/* Tap-away backdrop confined to the chat surface. */}
          <Pressable
            style={styles.backdrop}
            onPress={() => setMenuOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          />
          <View style={styles.menu}>
            <Text style={styles.menuStamp}>{nowStamp()}</Text>
            <Text style={styles.menuStamp}>{modelLabel}</Text>

            {menuItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => runMenu(item.id)}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <AuriaIcon name={item.icon} size={AURIA_ICON_SIZE.sm} color={ds.gray900} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  styles,
  color,
}: {
  icon: AuriaIconName;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      <AuriaIcon name={icon} size={AURIA_ICON_SIZE.sm} color={color} strokeWidth={1.8} />
    </Pressable>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    wrap: {
      marginTop: 6,
      position: 'relative',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconButtonPressed: {
      backgroundColor: ds.gray100,
    },
    backdrop: {
      position: 'absolute',
      top: -1000,
      left: -1000,
      right: -1000,
      bottom: -1000,
    },
    menu: {
      position: 'absolute',
      top: 38,
      left: 0,
      minWidth: 240,
      backgroundColor: theme.colors.surface,
      borderRadius: MYCEO_CORNER_RADIUS.panel,
      borderWidth: 1,
      borderColor: theme.colors.divider,
      paddingVertical: 6,
      paddingHorizontal: 6,
      gap: 2,
      // Float above sibling bubbles.
      ...Platform.select({
        web: { boxShadow: '0 12px 32px rgba(0,0,0,0.16)' } as object,
        default: {
          shadowColor: '#000',
          shadowOpacity: 0.16,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
        },
      }),
      zIndex: 30,
    },
    menuStamp: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12,
      paddingHorizontal: 10,
      paddingTop: 6,
      paddingBottom: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
    },
    menuItemPressed: {
      backgroundColor: ds.gray100,
    },
    menuLabel: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.medium,
    },
  });
}
