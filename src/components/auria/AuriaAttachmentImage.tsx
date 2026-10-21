import { useEffect, useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { cachedAttachmentUri } from '../../features/auria/attachmentFiles';
import type { AuriaAttachment } from '../../features/auria/types';

type AuriaAttachmentImageProps = {
  attachment: AuriaAttachment;
  style: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/**
 * An image attachment. Private Auria images need the Bearer token, which
 * Android's `Image` doesn't send, so they show from a cached local copy.
 */
export function AuriaAttachmentImage({ attachment, style, accessibilityLabel }: AuriaAttachmentImageProps) {
  const [uri, setUri] = useState<string | null>(attachment.private ? null : attachment.url);

  useEffect(() => {
    if (!attachment.private) {
      setUri(attachment.url);
      return;
    }
    let active = true;
    setUri(null);
    cachedAttachmentUri(attachment).then(
      (local) => active && setUri(local),
      () => undefined, // stays as the empty placeholder
    );
    return () => {
      active = false;
    };
    // The url identifies the file; the rest of the object may be a new copy each render.
  }, [attachment.url, attachment.private]);

  return (
    <Image
      source={uri ? { uri } : undefined}
      style={style}
      resizeMode="cover"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? attachment.name}
    />
  );
}
