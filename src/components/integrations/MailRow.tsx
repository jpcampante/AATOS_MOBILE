import { useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import { type MailItem } from '../../data/integrationsMockData';
import { tapLight, tapMedium, tapSuccess } from '../../utils/haptics';
import { auriaTypography, useTheme } from '../../theme';

const STAR_ACTIVE = '#F5A524';

type MailRowProps = {
  mail: MailItem;
  onOpen: () => void;
  onToggleStar: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

/** A single inbox row: swipe-right to archive, swipe-left to delete, tap to open. */
export function MailRow({ mail, onOpen, onToggleStar, onArchive, onDelete }: MailRowProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(1)).current;

  const archiveOpacity = translateX.interpolate({ inputRange: [0, 36], outputRange: [0, 1], extrapolate: 'clamp' });
  const deleteOpacity = translateX.interpolate({ inputRange: [-36, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderMove: (_evt, g) => translateX.setValue(g.dx),
      onPanResponderRelease: (_evt, g) => {
        const threshold = 110;
        if (g.dx <= -threshold) {
          tapMedium();
          Animated.timing(translateX, { toValue: -width, duration: 200, useNativeDriver: false }).start(() => onDelete());
        } else if (g.dx >= threshold) {
          tapSuccess();
          Animated.timing(translateX, { toValue: width, duration: 200, useNativeDriver: false }).start(() => onArchive());
        } else {
          Animated.spring(translateX, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const toggleStar = () => {
    tapLight();
    onToggleStar();
    starScale.setValue(0.6);
    Animated.spring(starScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.swipeWrap}>
      <Animated.View style={[styles.swipeAction, styles.archiveAction, { opacity: archiveOpacity }]} pointerEvents="none">
        <AuriaIcon name="archive" size={AURIA_ICON_SIZE.md} color="#0E3B1C" strokeWidth={1.8} />
      </Animated.View>
      <Animated.View style={[styles.swipeAction, styles.deleteAction, { opacity: deleteOpacity }]} pointerEvents="none">
        <AuriaIcon name="trash" size={AURIA_ICON_SIZE.md} color="#5C1A12" strokeWidth={1.8} />
      </Animated.View>
      <Animated.View style={[styles.swipeContent, { transform: [{ translateX }] }]} {...pan.panHandlers}>
        <View style={styles.row}>
          <Pressable
            onPress={onOpen}
            style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${mail.sender}. ${mail.subject}`}
          >
            <View style={[styles.mailAvatar, { backgroundColor: mail.accent }]}>
              <Text style={styles.mailAvatarText}>{mail.initial}</Text>
            </View>
            <View style={styles.mailBody}>
              <View style={styles.mailHeader}>
                <Text style={[styles.sender, mail.unread && styles.senderUnread]} numberOfLines={1}>
                  {mail.sender}
                </Text>
                <Text style={[styles.time, mail.unread && styles.timeUnread]}>{mail.time}</Text>
              </View>
              <Text style={[styles.subject, mail.unread && styles.subjectUnread]} numberOfLines={1}>
                {mail.subject}
              </Text>
              <Text style={styles.preview} numberOfLines={1}>
                {mail.preview}
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={toggleStar}
            style={styles.starButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={mail.starred ? 'Unstar' : 'Star'}
          >
            <Animated.View style={{ transform: [{ scale: starScale }] }}>
              <AuriaIcon
                name="star"
                size={AURIA_ICON_SIZE.md}
                color={mail.starred ? STAR_ACTIVE : ds.gray400}
                strokeWidth={mail.starred ? 2 : 1.6}
              />
            </Animated.View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    swipeWrap: { overflow: 'hidden' },
    swipeAction: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'center' },
    archiveAction: { backgroundColor: '#69D98A', justifyContent: 'flex-start', paddingLeft: 28 },
    deleteAction: { backgroundColor: '#F08A80', justifyContent: 'flex-end', paddingRight: 28 },
    swipeContent: { backgroundColor: ds.pageSurface },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    rowPressed: { opacity: 0.6 },
    mailAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mailAvatarText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: theme.typography.fontWeight.bold,
    },
    mailBody: { flex: 1, gap: 1 },
    mailHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
    },
    sender: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray800,
      fontSize: 14.5,
      fontWeight: theme.typography.fontWeight.normal,
    },
    senderUnread: { color: ds.gray900, fontWeight: theme.typography.fontWeight.bold },
    time: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.normal,
    },
    timeUnread: { color: ds.gray900, fontWeight: theme.typography.fontWeight.semibold },
    subject: { ...auriaTypography.body, color: ds.gray800, fontSize: 14 },
    subjectUnread: { color: ds.gray900, fontWeight: theme.typography.fontWeight.semibold },
    preview: { ...auriaTypography.body, color: ds.gray500, fontSize: 13, lineHeight: 18 },
    starButton: { padding: 6, alignSelf: 'center' },
  });
}
