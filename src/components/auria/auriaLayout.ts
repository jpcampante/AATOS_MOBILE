/** Composer metrics — keep in sync with AuriaComposer shell.
 *  Two-row composer: padTop 12 + text 24 + gap 10 + actionRow 36 + padBottom 10 = 92. */
export const AURIA_COMPOSER_TOOLBAR_HEIGHT = 92;
export const AURIA_COMPOSER_DOCK_PADDING_V = 12;
export const AURIA_COMPOSER_CONTENT_GAP = 8;
export const AURIA_COMPOSER_BOTTOM_PADDING = 8;

/** Shared dim behind modals / bottom sheets, so every Auria overlay matches. */
export const AURIA_SCRIM = 'rgba(15,18,22,0.34)';

/** Extra scroll padding below panel lists — AppShell already reserves nav space. */
export const AURIA_PANEL_SCROLL_END_PADDING = 24;
/** Breathing room above the composer in chat scroll — nav gap lives in AppShell only. */
export const AURIA_CHAT_SCROLL_END_PADDING = 8;

/** Drawer share of the viewport when open. */
export const SIDEBAR_WIDTH_RATIO = 0.88;
/** Minimum main-column width kept visible for tap-to-close. */
export const SIDEBAR_MIN_MAIN_PEEK = 52;
/** Welcome / suggestion column cap (responsive, not a hard 320px limit). */
export const CONTENT_COLUMN_MAX = 420;

/** Horizontal inset shared by composer and welcome column. */
export const AURIA_CONTENT_HORIZONTAL_INSET = 12;

/** Base composer overlay height (gap + dock padding + toolbar) — keyboard inset added at runtime. */
export const AURIA_COMPOSER_OVERLAY_BASE_HEIGHT =
  AURIA_COMPOSER_CONTENT_GAP +
  AURIA_COMPOSER_DOCK_PADDING_V +
  AURIA_COMPOSER_TOOLBAR_HEIGHT +
  AURIA_COMPOSER_BOTTOM_PADDING;

export function getSidebarWidth(screenWidth: number): number {
  const ratioWidth = Math.round(screenWidth * SIDEBAR_WIDTH_RATIO);
  const maxPush = Math.max(0, screenWidth - SIDEBAR_MIN_MAIN_PEEK);
  return Math.min(ratioWidth, maxPush);
}

export function getContentMaxWidth(screenWidth: number): number {
  return Math.min(
    Math.round(screenWidth - AURIA_CONTENT_HORIZONTAL_INSET * 2),
    CONTENT_COLUMN_MAX,
  );
}

/** Absolute composer overlay height — must match AuriaComposer shell padding + toolbar. */
export function getAuriaComposerOverlayHeight(bottomInset = 0): number {
  return AURIA_COMPOSER_OVERLAY_BASE_HEIGHT + bottomInset;
}

/**
 * Top-biased welcome offset (web: ~22vh) inside the band above the composer.
 * Avoids vertical centering that drifts when keyboard/composer height changes.
 */
export function getWelcomeContentTopPadding(
  viewportHeight: number,
  headerHeight: number,
  composerReserve: number,
  shellBottomInset = 0,
): number {
  const band = Math.max(
    0,
    viewportHeight - headerHeight - composerReserve - shellBottomInset,
  );
  return Math.min(Math.max(Math.round(band * 0.18), 40), 120);
}
