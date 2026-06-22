/**
 * Auria icon tokens — aligned with web-reference `ICON_STROKE` and sidebar/composer usage.
 * @see web-reference/src/components/icons/Icon.tsx
 * @see web-reference/src/app/components/insights/auria/shell/sidebar/sidebarShortcuts.tsx
 */
export const AURIA_ICON_STROKE = 1.5;

/** Sidebar nav + header actions (Search, Gallery, News, More). */
export const AURIA_ICON_STROKE_NAV = 1.35;

/** New chat row in sidebar. */
export const AURIA_ICON_STROKE_STRONG = 1.75;

/** Composer send arrow. */
export const AURIA_ICON_STROKE_SEND = 2;

export const AURIA_ICON_SIZE = {
  /** Composer send button */
  xs: 15,
  /** Sidebar + primary nav (web: w-[17px]) */
  sm: 17,
  /** Header drawer / actions */
  md: 18,
  /** FAB / emphasis */
  lg: 20,
  /** Slot container (web: w-5 h-5) */
  slot: 20,
  /** Top-bar action buttons (drawer, new chat, Discover search/filter). */
  header: 22,
} as const;
