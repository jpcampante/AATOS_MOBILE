import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, useTheme } from '../../theme';
import { useAuriaToast } from '../../features/auria/useAuriaToast';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';
import { AuriaImageRemoveTool } from './AuriaImageRemoveTool';

type AuriaImageViewerProps = {
  visible: boolean;
  source: ImageSourcePropType;
  /** The brief that produced the image — used for the share link + edit seed. */
  prompt?: string;
  onClose: () => void;
};

type AspectOption = { label: string; ratio: string; value: number };

// Same set ChatGPT offers, top to bottom.
const ASPECTS: AspectOption[] = [
  { label: 'Tall', ratio: '2:3', value: 2 / 3 },
  { label: 'Portrait', ratio: '3:4', value: 3 / 4 },
  { label: 'Standard', ratio: '4:5', value: 4 / 5 },
  { label: 'Wide', ratio: '3:2', value: 3 / 2 },
  { label: 'Landscape', ratio: '4:3', value: 4 / 3 },
  { label: 'Widescreen', ratio: '16:9', value: 16 / 9 },
  { label: 'Ultra Wide', ratio: '21:9', value: 21 / 9 },
  { label: 'Story', ratio: '9:16', value: 9 / 16 },
  { label: 'Landscape', ratio: '5:4', value: 5 / 4 },
  { label: 'Square', ratio: '1:1', value: 1 },
];

type InputMode = 'edit' | 'comment' | null;

export function AuriaImageViewer({ visible, source, prompt, onClose }: AuriaImageViewerProps) {
  const insets = useSafeAreaInsets();
  const { ds } = useTheme();
  const styles = useMemo(() => createStyles(insets.top, insets.bottom), [insets.bottom, insets.top]);

  const [mode, setMode] = useState<'view' | 'remove'>('view');
  const [resizeOpen, setResizeOpen] = useState(false);
  const [aspect, setAspect] = useState<AspectOption | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const { toast, showToast, clearToast } = useAuriaToast(1600);
  const busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset transient state whenever the viewer is dismissed, and cancel any
  // in-flight toast/busy timers so they can't fire on the next open.
  useEffect(() => {
    if (!visible) {
      setMode('view');
      setResizeOpen(false);
      setInputMode(null);
      setDraft('');
      setBusy(null);
      clearToast();
      if (busyTimer.current) clearTimeout(busyTimer.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(
    () => () => {
      if (busyTimer.current) clearTimeout(busyTimer.current);
    },
    [],
  );

  const runBusy = (label: string, done: string) => {
    setBusy(label);
    if (busyTimer.current) clearTimeout(busyTimer.current);
    busyTimer.current = setTimeout(() => {
      setBusy(null);
      showToast(done);
    }, 950);
  };

  const share = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      void navigator.clipboard?.writeText(
        `https://aatos.app/image/${encodeURIComponent(prompt ?? 'auria')}`,
      );
    }
    showToast('Link copied');
  };

  const submitInput = () => {
    const kind = inputMode;
    const text = draft.trim();
    setInputMode(null);
    setDraft('');
    if (!text) return;
    if (kind === 'edit') runBusy('Editing…', 'Image updated');
    else if (kind === 'comment') showToast('Comment added');
  };

  const applyRemoval = (painted: boolean) => {
    setMode('view');
    if (painted) runBusy('Removing…', 'Area removed');
  };

  const openInput = (next: Exclude<InputMode, null>) => {
    setResizeOpen(false);
    setDraft('');
    setInputMode(next);
  };

  if (!visible) return null;

  if (mode === 'remove') {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setMode('view')}>
        <AuriaImageRemoveTool
          source={source}
          onCancel={() => setMode('view')}
          onNext={applyRemoval}
        />
      </Modal>
    );
  }

  const TOOLS: { id: 'edit' | 'comment' | 'resize' | 'remove'; label: string; icon: 'squarePen' | 'messageSquare' | 'expand' | 'eraser' }[] = [
    { id: 'edit', label: 'Edit', icon: 'squarePen' },
    { id: 'comment', label: 'Comment', icon: 'messageSquare' },
    { id: 'resize', label: 'Resize', icon: 'expand' },
    { id: 'remove', label: 'Remove', icon: 'eraser' },
  ];

  const onTool = (id: 'edit' | 'comment' | 'resize' | 'remove') => {
    if (id === 'resize') {
      setResizeOpen((open) => !open);
      return;
    }
    setResizeOpen(false);
    if (id === 'remove') setMode('remove');
    else if (id === 'edit') openInput('edit');
    else if (id === 'comment') openInput('comment');
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        accessibilityViewIsModal
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <CircleButton icon="close" label="Close" onPress={onClose} />
          <View style={styles.topRight}>
            <CircleButton icon="moreHorizontal" label="More" onPress={() => showToast('More options')} />
            <CircleButton icon="download" label="Download" onPress={() => showToast('Saved to Photos')} />
            <Pressable
              onPress={share}
              accessibilityRole="button"
              accessibilityLabel="Share"
              style={({ pressed }) => [styles.sharePill, pressed && styles.pressed]}
            >
              <Text style={styles.sharePillText}>Share</Text>
            </Pressable>
          </View>
        </View>

        {/* Image */}
        <Pressable style={styles.imageArea} onPress={() => setResizeOpen(false)}>
          <View style={aspect ? [styles.framed, { aspectRatio: aspect.value }] : styles.fill}>
            <Image
              source={source}
              resizeMode={aspect ? 'cover' : 'contain'}
              style={styles.image}
              accessibilityLabel={prompt ?? 'Generated image'}
            />
          </View>
        </Pressable>

        {/* Resize aspect-ratio menu */}
        {resizeOpen ? (
          <View style={styles.resizeMenu}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {ASPECTS.map((option) => {
                const active = aspect?.label === option.label && aspect?.ratio === option.ratio;
                return (
                  <Pressable
                    key={`${option.label}-${option.ratio}`}
                    onPress={() => {
                      setAspect(option);
                      setResizeOpen(false);
                      showToast(`Resized to ${option.ratio}`);
                    }}
                    style={({ pressed }) => [styles.aspectRow, pressed && styles.aspectRowPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label} ${option.ratio}`}
                  >
                    <AspectGlyph value={option.value} />
                    <Text style={styles.aspectLabel}>
                      {option.label} ({option.ratio})
                    </Text>
                    {active ? (
                      <AuriaIcon name="checkCircle" size={18} color="#FFFFFF" strokeWidth={2} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Bottom toolbar */}
        {inputMode === null ? (
          <View style={styles.toolbar}>
            {TOOLS.map((tool) => (
              <Pressable
                key={tool.id}
                onPress={() => onTool(tool.id)}
                style={({ pressed }) => [styles.toolItem, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={tool.label}
              >
                <View style={[styles.toolIcon, tool.id === 'resize' && resizeOpen && styles.toolIconActive]}>
                  <AuriaIcon name={tool.icon} size={AURIA_ICON_SIZE.md} color="#FFFFFF" strokeWidth={1.9} />
                </View>
                <Text style={styles.toolLabel}>{tool.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={inputMode === 'edit' ? 'Describe your edit…' : 'Add a comment…'}
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
              autoFocus
              multiline
            />
            <Pressable
              onPress={submitInput}
              disabled={draft.trim().length === 0}
              style={({ pressed }) => [
                styles.inputSend,
                draft.trim().length === 0 && styles.inputSendDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={inputMode === 'edit' ? 'Apply edit' : 'Add comment'}
            >
              <AuriaIcon name="arrowUp" size={AURIA_ICON_SIZE.sm} color={ds.offBlack} strokeWidth={2.4} />
            </Pressable>
          </View>
        )}

        {/* Toast */}
        {toast ? (
          <View style={styles.toast} pointerEvents="none">
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}

        {/* Busy overlay (mock generation) */}
        {busy ? (
          <View style={styles.busy} pointerEvents="auto">
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.busyText}>{busy}</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const circleButtonStyles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});

function CircleButton({
  icon,
  label,
  onPress,
}: {
  icon: 'close' | 'moreHorizontal' | 'download';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [circleButtonStyles.btn, pressed && circleButtonStyles.pressed]}
    >
      <AuriaIcon name={icon} size={AURIA_ICON_SIZE.sm} color="#FFFFFF" strokeWidth={2} />
    </Pressable>
  );
}

/** Tiny orientation glyph (portrait / landscape / square) for an aspect row. */
function AspectGlyph({ value }: { value: number }) {
  const MAX = 18;
  const width = value >= 1 ? MAX : Math.round(MAX * value);
  const height = value <= 1 ? MAX : Math.round(MAX / value);
  return (
    <View style={glyphStyles.box}>
      <View
        style={{
          width,
          height,
          borderRadius: 4,
          borderWidth: 1.8,
          borderColor: '#FFFFFF',
        }}
      />
    </View>
  );
}

const glyphStyles = StyleSheet.create({
  box: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function createStyles(topInset: number, bottomInset: number) {
  const chrome = 'rgba(0, 0, 0, 0.42)';
  const panel = 'rgba(28, 28, 30, 0.96)';
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#000000',
    },
    topBar: {
      paddingTop: topInset + 8,
      paddingHorizontal: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 5,
    },
    topRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    sharePill: {
      height: 38,
      paddingHorizontal: 18,
      borderRadius: 19,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sharePillText: {
      ...auriaTypography.body,
      color: '#0B0B0C',
      fontSize: 15,
      fontWeight: '600',
    },
    pressed: {
      opacity: 0.6,
    },
    imageArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    fill: {
      width: '100%',
      height: '100%',
    },
    framed: {
      width: '100%',
      maxHeight: '100%',
      alignSelf: 'center',
      overflow: 'hidden',
      borderRadius: 6,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    resizeMenu: {
      position: 'absolute',
      left: 16,
      bottom: bottomInset + 112,
      width: 250,
      maxHeight: 360,
      borderRadius: 20,
      backgroundColor: panel,
      paddingVertical: 8,
      paddingHorizontal: 6,
      zIndex: 10,
    },
    aspectRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    aspectRowPressed: {
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    aspectLabel: {
      ...auriaTypography.body,
      flex: 1,
      color: '#FFFFFF',
      fontSize: 16,
    },
    toolbar: {
      paddingTop: 12,
      paddingBottom: bottomInset + 16,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    toolItem: {
      alignItems: 'center',
      gap: 7,
      flex: 1,
    },
    toolIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: chrome,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolIconActive: {
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    toolLabel: {
      ...auriaTypography.label,
      color: '#FFFFFF',
      fontSize: 12,
    },
    inputBar: {
      paddingTop: 10,
      paddingBottom: bottomInset + 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
    },
    input: {
      ...auriaTypography.body,
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: '#FFFFFF',
      fontSize: 16,
      ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as object) : null),
    },
    inputSend: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputSendDisabled: {
      opacity: 0.4,
    },
    toast: {
      position: 'absolute',
      top: topInset + 64,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.82)',
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 16,
      zIndex: 20,
    },
    toastText: {
      ...auriaTypography.body,
      color: '#FFFFFF',
      fontSize: 14,
    },
    busy: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: 'rgba(0,0,0,0.55)',
      zIndex: 30,
    },
    busyText: {
      ...auriaTypography.body,
      color: '#FFFFFF',
      fontSize: 15,
    },
  });
}
