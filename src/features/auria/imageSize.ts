import type { AuriaImageSize } from './api/images';

/**
 * The size an aspect-ratio chip asks the server for (A037). The server only
 * takes three (E06), so every landscape ratio becomes the landscape size and
 * every portrait one the portrait size; anything unknown stays square.
 */
export function imageSizeForRatio(ratio: string): AuriaImageSize {
  const [width, height] = ratio.split(':').map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return '1024x1024';
  if (width > height) return '1792x1024';
  if (height > width) return '1024x1792';
  return '1024x1024';
}
