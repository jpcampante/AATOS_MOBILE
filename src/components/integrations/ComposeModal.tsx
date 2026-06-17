import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import { Popover } from '../ui/Popover';
import { Snackbar } from '../ui/Snackbar';
import {
  composeDefaultFrom,
  composeFromAccounts,
  composeSignature,
  type ComposeDraft,
} from '../../data/integrationsMockData';
import { auriaTypography, useTheme } from '../../theme';

const HELP_DRAFT =
  'Hi,\n\nThanks for the update — this looks great. I went through the details and everything aligns with what we discussed. I just have one quick question before we move forward, and I can share more context on a call if helpful.\n\nLet me know what works best for you.\n\nBest,';

type ComposeModalProps = {
  visible: boolean;
  initialDraft: ComposeDraft | null;
  onSend: (draft: ComposeDraft) => void;
  onClose: () => void;
};

export function ComposeModal({ visible, initialDraft, onSend, onClose }: ComposeModalProps) {
  const { ds, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(ds, theme, insets.top), [ds, theme, insets.top]);
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [recipientsExpanded, setRecipientsExpanded] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [from, setFrom] = useState(composeDefaultFrom);
  const [fromOpen, setFromOpen] = useState(false);
  const [fromAnchor, setFromAnchor] = useState(0);
  const [snack, setSnack] = useState<string | null>(null);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const info = (text: string) => {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnack(text);
    snackTimer.current = setTimeout(() => setSnack(null), 2400);
  };

  useEffect(() => {
    if (visible) {
      setTo(initialDraft?.to ?? '');
      setSubject(initialDraft?.subject ?? '');
      setBody(initialDraft?.body ?? '');
      setCc('');
      setBcc('');
      setRecipientsExpanded(false);
      setFrom(composeDefaultFrom);
      setFromOpen(false);
    }
  }, [visible, initialDraft]);

  const canSend = to.trim().length > 0 || subject.trim().length > 0 || body.trim().length > 0;

  const close = () => {
    setTo('');
    setCc('');
    setBcc('');
    setRecipientsExpanded(false);
    setSubject('');
    setBody('');
    setFrom(composeDefaultFrom);
    setFromOpen(false);
    onClose();
  };

  const send = () => {
    if (!canSend) {
      close();
      return;
    }
    onSend({ to, subject, body });
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      <View style={styles.root}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable
              onPress={close}
              style={({ pressed }) => [styles.closeCircle, pressed && styles.iconPressed]}
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={6}
            >
              <AuriaIcon name="close" size={AURIA_ICON_SIZE.md} color={ds.gray700} strokeWidth={2} />
            </Pressable>
            <View style={styles.flex} />
            <HeaderAction icon="pencil" label="Formatting" color={ds.gray800} styles={styles} onPress={() => info('Formatting options')} />
            <HeaderAction icon="paperclip" label="Attach file" color={ds.gray800} styles={styles} onPress={() => info('Attach a file')} />
            <HeaderAction icon="send" label="Send" color={canSend ? ds.auriaBlue : ds.gray400} styles={styles} onPress={send} />
            <HeaderAction icon="moreCircle" label="More options" color={ds.gray800} styles={styles} onPress={() => info('More options')} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldRow}>
              <TextInput
                value={to}
                onChangeText={setTo}
                placeholder="To"
                placeholderTextColor={ds.gray500}
                style={styles.fieldInput}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable
                onPress={() => setRecipientsExpanded((open) => !open)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={recipientsExpanded ? 'Hide Cc and Bcc' : 'Show Cc and Bcc'}
                accessibilityState={{ expanded: recipientsExpanded }}
              >
                <View style={recipientsExpanded ? styles.chevronUp : undefined}>
                  <AuriaIcon name="chevronDown" size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={1.8} />
                </View>
              </Pressable>
            </View>
            <View style={styles.divider} />

            {recipientsExpanded ? (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fromLabel}>Cc</Text>
                  <TextInput
                    value={cc}
                    onChangeText={setCc}
                    style={styles.fieldInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fromLabel}>Bcc</Text>
                  <TextInput
                    value={bcc}
                    onChangeText={setBcc}
                    style={styles.fieldInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.divider} />
              </>
            ) : null}

            <Pressable
              style={styles.fieldRow}
              onPress={() => setFromOpen((open) => !open)}
              onLayout={(e) => setFromAnchor(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
              accessibilityRole="button"
              accessibilityLabel={`From ${from}`}
            >
              <Text style={styles.fromLabel}>From</Text>
              <Text style={styles.fromValue} numberOfLines={1}>
                {from}
              </Text>
              <View style={styles.flex} />
              <AuriaIcon name="chevronDown" size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={1.8} />
            </Pressable>
            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject"
                placeholderTextColor={ds.gray500}
                style={styles.fieldInput}
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.bodyArea}>
              <View>
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  style={styles.bodyInput}
                  multiline
                  textAlignVertical="top"
                />
                {body.length === 0 ? (
                  <Pressable
                    style={styles.helpRow}
                    onPress={() => setBody(HELP_DRAFT)}
                    accessibilityRole="button"
                    accessibilityLabel="Help me write"
                  >
                    <AuriaIcon name="pencil" size={16} color={ds.auriaBlue} strokeWidth={1.7} />
                    <Text style={styles.helpText}>Help me write</Text>
                    <View style={styles.swipeChip}>
                      <Text style={styles.swipeText}>Swipe →</Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.signature}>{composeSignature}</Text>
            </View>

            {fromOpen ? (
              <>
                <Pressable
                  style={styles.dropdownDismiss}
                  onPress={() => setFromOpen(false)}
                  accessibilityLabel="Close account picker"
                />
                <Popover style={[styles.dropdown, { top: fromAnchor }]}>
                  {composeFromAccounts.map((account, index) => (
                    <Pressable
                      key={account.id}
                      onPress={() => {
                        setFrom(account.address);
                        setFromOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownRow,
                        index > 0 && styles.dropdownDivider,
                        pressed && styles.dropdownPressed,
                      ]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.dropdownText}>
                        {account.sendAs ? `Send as: ${account.address}` : account.address}
                      </Text>
                    </Pressable>
                  ))}
                </Popover>
              </>
            ) : null}
          </ScrollView>

          {snack ? <Snackbar text={snack} style={styles.composeSnackPos} /> : null}
        </View>
      </View>
    </Modal>
  );
}

type HeaderActionProps = {
  icon: 'pencil' | 'paperclip' | 'send' | 'moreCircle';
  label: string;
  color: string;
  styles: ReturnType<typeof createStyles>;
  onPress?: () => void;
};

function HeaderAction({ icon, label, color, styles, onPress }: HeaderActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.headerIcon, pressed && styles.iconPressed]}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
    >
      <AuriaIcon name={icon} size={AURIA_ICON_SIZE.md} color={color} strokeWidth={1.8} />
    </Pressable>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  safeTop: number,
) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      flex: 1,
      marginTop: Math.max(safeTop, 12) + 6,
      backgroundColor: ds.white,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden',
    },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    closeCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ds.gray100,
    },
    headerIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconPressed: { opacity: 0.55, backgroundColor: ds.gray100 },
    chevronUp: { transform: [{ rotate: '180deg' }] },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 50,
      paddingHorizontal: 16,
    },
    fieldInput: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 16,
      padding: 0,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: ds.gray200 },
    fromLabel: { ...auriaTypography.body, color: ds.gray500, fontSize: 16 },
    fromValue: { ...auriaTypography.body, color: ds.gray900, fontSize: 16, maxWidth: '70%' },
    bodyArea: { paddingHorizontal: 16, paddingTop: 16, gap: 18 },
    bodyInput: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 16,
      lineHeight: 22,
      minHeight: 26,
      padding: 0,
    },
    helpRow: {
      position: 'absolute',
      top: 2,
      left: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    helpText: { ...auriaTypography.body, color: ds.gray500, fontSize: 16 },
    swipeChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: ds.gray100 },
    swipeText: { ...auriaTypography.label, color: ds.gray500, fontSize: 12 },
    signature: { ...auriaTypography.body, color: ds.gray800, fontSize: 16, lineHeight: 24 },
    dropdownDismiss: { ...StyleSheet.absoluteFillObject },
    dropdown: {
      position: 'absolute',
      left: 56,
      width: 232,
      maxWidth: '76%',
      backgroundColor: ds.white,
      borderRadius: 12,
      paddingVertical: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 8,
    },
    dropdownRow: { paddingHorizontal: 18, paddingVertical: 15 },
    dropdownDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ds.gray200 },
    dropdownPressed: { backgroundColor: ds.gray100 },
    dropdownText: { ...auriaTypography.body, color: ds.gray900, fontSize: 16, lineHeight: 22 },
    composeSnackPos: { bottom: 28 },
  });
}
