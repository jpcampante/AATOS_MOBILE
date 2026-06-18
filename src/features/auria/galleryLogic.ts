import type { AuriaGalleryCategory, AuriaGalleryItem } from '../../data/auriaMockData';

export type AuriaGalleryTab = 'all' | 'images' | 'files';
export type AuriaGalleryView = 'grid' | 'list';
export type AuriaGalleryTypeFilter = AuriaGalleryCategory | null;
export type AuriaGallerySort = 'recent' | 'name' | 'size';

function sizeToBytes(label: string): number {
  const match = label.match(/([\d.]+)\s*(GB|MB|KB|B)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === 'GB') return value * 1e9;
  if (unit === 'MB') return value * 1e6;
  if (unit === 'KB') return value * 1e3;
  return value;
}

/** Sort a list of gallery items. 'recent' keeps the incoming (recency) order. */
export function sortGalleryItems(
  items: readonly AuriaGalleryItem[],
  sort: AuriaGallerySort,
): AuriaGalleryItem[] {
  const copy = [...items];
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'size') copy.sort((a, b) => sizeToBytes(b.sizeLabel) - sizeToBytes(a.sizeLabel));
  return copy;
}

export function isGalleryImage(item: AuriaGalleryItem): boolean {
  return item.type === 'Image';
}

export function filterGalleryItems(
  items: readonly AuriaGalleryItem[],
  options: {
    tab: AuriaGalleryTab;
    query: string;
    typeFilter: AuriaGalleryTypeFilter;
  },
): AuriaGalleryItem[] {
  const query = options.query.trim().toLowerCase();

  return items.filter((item) => {
    if (options.tab === 'images' && !isGalleryImage(item)) return false;
    if (options.tab === 'files' && isGalleryImage(item)) return false;
    if (options.typeFilter && item.type !== options.typeFilter) return false;
    if (query && !`${item.name} ${item.source} ${item.type}`.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });
}
