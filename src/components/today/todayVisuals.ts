import { type AuriaIconName } from '../icons';
import type { TodayImportance, TodayItemKind } from '../../data/todayFeedMockData';

/** Glyph per source kind. */
export const TODAY_KIND_ICON: Record<TodayItemKind, AuriaIconName> = {
  task: 'document',
  email: 'mail',
  calendar: 'calendar',
  auria: 'sparkles',
};

/** Importance dot — Auria palette, no black/green. */
export const TODAY_IMPORTANCE_DOT: Record<TodayImportance, string> = {
  Urgent: '#FF4D4F',
  High: '#4169E1',
  Normal: '#6BA8FF',
  Low: '#9CA3AF',
};

export const TODAY_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const TODAY_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "Wed, 17 Jun" for the current day. */
export function todayDateLabel(date = new Date()): string {
  return `${TODAY_WEEKDAYS[date.getDay()]}, ${date.getDate()} ${TODAY_MONTHS[date.getMonth()]}`;
}
