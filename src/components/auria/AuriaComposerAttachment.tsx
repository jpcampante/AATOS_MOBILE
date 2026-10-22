import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { auriaTypography, useTheme } from '../../theme';
import { AuriaIcon } from '../icons';
import { AuriaFileChip } from './AuriaFileChip';

/** What the composer needs to show one queued attachment. */
export type ComposerAttachmentView = {
  id: string;
  uri: string;
  name: string;
  isImage: boolean;
  status: 'uploading' | 'ready' | 'failed';
  progress: number;
  error?: string;
};

type AuriaComposerAttachmentProps = {
  item: ComposerAttachmentView;
  onRemove?: (id: string) => void;
};

function describe(item: ComposerAttachmentView): string {
  if (item.status === 'uploading') return `${item.name}, uploading ${Math.round(item.progress * 100)}%`;
  if (item.status === 'failed') return `${item.name}, ${item.error ?? 'upload failed'}`;
  return item.name;
}

/** One queued attachment above the input: thumbnail or file chip, upload badge and remove button. */
export function AuriaComposerAttachment({ item, onRemove }: AuriaComposerAttachmentProps) {
  const { ds } = useTheme();
  const failed = item.status === 'failed';

  const overlays = (
    <>
      {item.status === 'uploading' ? (
        <View style={[styles.badge, { backgroundColor: ds.offBlackOverlay }]}>
          <Text style={[styles.badgeText, { color: ds.white }]}>{Math.round(item.progress * 100)}%</Text>
        </View>
      ) : null}
      {failed ? (
        <View style={[styles.badge, styles.badgeFailed, { backgroundColor: ds.danger }]}>
          <AuriaIcon name="exclaimCircle" size={12} color={ds.white} strokeWidth={2.2} />
        </View>
      ) : null}
      <Pressable
        onPress={() => onRemove?.(item.id)}
        style={[styles.remove, { backgroundColor: ds.white }]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
      >
        <AuriaIcon name="close" size={12} color={ds.gray900} strokeWidth={2.5} />
      </Pressable>
    </>
  );
  const failedBorder = failed && [styles.failed, { borderColor: ds.danger }];

  if (!item.isImage) {
    return (
      <AuriaFileChip name={item.name} accessibilityLabel={describe(item)} style={[styles.fileChip, failedBorder]}>
        {overlays}
      </AuriaFileChip>
    );
  }
  return (
    <View style={[styles.thumbWrap, failedBorder]} accessible accessibilityLabel={describe(item)}>
      <Image
        source={{ uri: item.uri }}
        style={[styles.thumb, { backgroundColor: ds.gray200 }, item.status !== 'ready' && styles.pending]}
      />
      {overlays}
    </View>
  );
}

const styles = StyleSheet.create({
  thumbWrap: {
    width: 64,
    height: 64,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  pending: {
    opacity: 0.55,
  },
  fileChip: {
    height: 64,
    maxWidth: 200,
    paddingRight: 30,
    borderRadius: 12,
  },
  failed: {
    borderWidth: 1.5,
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeFailed: {
    paddingVertical: 3,
  },
  badgeText: {
    ...auriaTypography.label,
    fontSize: 10.5,
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
