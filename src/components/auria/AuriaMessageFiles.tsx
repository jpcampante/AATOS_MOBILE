import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import type { AuriaAttachment } from '../../features/auria/types';
import { useAttachmentOpener } from '../../features/auria/useAttachmentOpener';
import { AuriaAttachmentImage } from './AuriaAttachmentImage';
import { AuriaFileChip } from './AuriaFileChip';

type AuriaMessageFilesProps = {
  files: AuriaAttachment[];
  /** Short feedback when a file couldn't be opened. */
  onOpenFailed?: (message: string) => void;
};

/** A message's attachments: images in a grid (one alone is larger), files as chips that open. */
export function AuriaMessageFiles({ files, onOpenFailed }: AuriaMessageFilesProps) {
  const { ds } = useTheme();
  const { openingUrl, openFile } = useAttachmentOpener(onOpenFailed);
  const images = files.filter((f) => f.isImage);
  const others = files.filter((f) => !f.isImage);
  const placeholder = { backgroundColor: ds.gray200 };

  return (
    <>
      {images.length ? (
        <View style={[styles.images, images.length > 1 && styles.grid]}>
          {images.map((file, index) => (
            <AuriaAttachmentImage
              key={file.url}
              attachment={file}
              style={[images.length === 1 ? styles.single : styles.tile, placeholder]}
              accessibilityLabel={images.length > 1 ? `${file.name}, image ${index + 1} of ${images.length}` : file.name}
            />
          ))}
        </View>
      ) : null}
      {others.map((file) => (
        <AuriaFileChip
          key={file.url}
          name={file.name}
          busy={openingUrl === file.url}
          onPress={() => void openFile(file)}
          accessibilityLabel={`Open ${file.name}`}
          style={styles.chip}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  images: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  // Two-column grid that shrink-wraps to its content: 2*104 + 6 gap + 2px slack.
  grid: {
    width: 216,
  },
  tile: {
    width: 104,
    height: 104,
    borderRadius: 12,
  },
  single: {
    width: 200,
    height: 200,
    borderRadius: 16,
  },
  chip: {
    maxWidth: '80%',
  },
});
