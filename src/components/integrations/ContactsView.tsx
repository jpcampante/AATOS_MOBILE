import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuriaIcon, AuriaIconName, AURIA_ICON_SIZE } from '../icons';
import { contacts, type Contact } from '../../data/mailWorkspaceMockData';
import { auriaTypography, useTheme } from '../../theme';

type ContactsViewProps = {
  onEmail?: (email: string) => void;
};

export function ContactsView({ onEmail }: ContactsViewProps) {
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme), [ds, theme]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(() => [...contacts].sort((a, b) => a.name.localeCompare(b.name)), []);
  const q = query.trim().toLowerCase();
  const filtered = sorted.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
  );

  const sections: { letter: string; items: Contact[] }[] = [];
  filtered.forEach((c) => {
    const letter = c.name[0]?.toUpperCase() ?? '#';
    const last = sections[sections.length - 1];
    if (last && last.letter === letter) last.items.push(c);
    else sections.push({ letter, items: [c] });
  });

  return (
    <View style={styles.root}>
      <View style={styles.searchBar}>
        <AuriaIcon name="search" size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={1.7} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search contacts"
          placeholderTextColor={ds.gray500}
          style={styles.searchInput}
          autoCapitalize="none"
        />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <AuriaIcon name="users" size={AURIA_ICON_SIZE.lg} color={ds.gray400} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.letter}>
              <Text style={styles.sectionLetter}>{section.letter}</Text>
              {section.items.map((c) => {
                const open = expanded === c.id;
                return (
                  <View key={c.id}>
                    <Pressable
                      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                      onPress={() => setExpanded(open ? null : c.id)}
                      accessibilityRole="button"
                      accessibilityLabel={c.name}
                      accessibilityState={{ expanded: open }}
                    >
                      <View style={[styles.avatar, { backgroundColor: c.accent }]}>
                        <Text style={styles.avatarText}>{c.initial}</Text>
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={styles.email} numberOfLines={1}>
                          {c.email}
                        </Text>
                      </View>
                      <View style={open ? styles.chevUp : undefined}>
                        <AuriaIcon name="chevronDown" size={16} color={ds.gray500} strokeWidth={1.8} />
                      </View>
                    </Pressable>
                    {open ? (
                      <View style={styles.detail}>
                        {c.role ? <DetailLine icon="briefcase" text={c.role} styles={styles} ds={ds} /> : null}
                        <DetailLine icon="mail" text={c.email} styles={styles} ds={ds} />
                        {c.phone ? <DetailLine icon="idCard" text={c.phone} styles={styles} ds={ds} /> : null}
                        <Pressable
                          style={({ pressed }) => [styles.emailBtn, pressed && styles.rowPressed]}
                          onPress={() => onEmail?.(c.email)}
                          accessibilityRole="button"
                          accessibilityLabel={`Send email to ${c.name}`}
                        >
                          <AuriaIcon name="send" size={AURIA_ICON_SIZE.sm} color="#FFFFFF" strokeWidth={1.9} />
                          <Text style={styles.emailBtnText}>Send email</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function DetailLine({
  icon,
  text,
  styles,
  ds,
}: {
  icon: AuriaIconName;
  text: string;
  styles: ReturnType<typeof createStyles>;
  ds: ReturnType<typeof useTheme>['ds'];
}) {
  return (
    <View style={styles.detailLine}>
      <AuriaIcon name={icon} size={AURIA_ICON_SIZE.sm} color={ds.gray500} strokeWidth={1.6} />
      <Text style={styles.detailText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
) {
  return StyleSheet.create({
    root: { flex: 1 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 14,
      marginTop: 8,
      marginBottom: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: ds.inputFill,
      borderRadius: 22,
    },
    searchInput: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray900,
      fontSize: 14,
      padding: 0,
    },
    list: { flex: 1 },
    listContent: { paddingBottom: 24 },
    empty: { alignItems: 'center', gap: 10, paddingVertical: 50 },
    emptyText: { ...auriaTypography.body, color: ds.gray500, fontSize: 13 },
    sectionLetter: {
      ...auriaTypography.label,
      color: ds.gray500,
      fontSize: 12,
      fontWeight: theme.typography.fontWeight.bold,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    rowPressed: { opacity: 0.6 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.bold,
    },
    info: { flex: 1, gap: 1 },
    name: {
      ...auriaTypography.body,
      color: ds.gray900,
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.medium,
    },
    email: {
      ...auriaTypography.body,
      color: ds.gray500,
      fontSize: 13,
    },
    chevUp: { transform: [{ rotate: '180deg' }] },
    detail: {
      marginHorizontal: 16,
      marginBottom: 8,
      marginLeft: 68,
      gap: 10,
      paddingBottom: 4,
    },
    detailLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    detailText: {
      ...auriaTypography.body,
      flex: 1,
      color: ds.gray700,
      fontSize: 13.5,
    },
    emailBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      marginTop: 2,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor: ds.offBlack,
    },
    emailBtnText: {
      ...auriaTypography.body,
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
}
