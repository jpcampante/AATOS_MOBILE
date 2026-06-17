import type { ProductTabId } from './productNavigation';

/** What kind of thing needs the user today. */
export type TodayItemKind = 'task' | 'email' | 'calendar' | 'auria';
export type TodayImportance = 'Urgent' | 'High' | 'Normal' | 'Low';

export type TodayFeedItem = {
  id: string;
  kind: TodayItemKind;
  title: string;
  subtitle: string;
  /** Clock or due label, already formatted (e.g. "9:30 AM", "Due today"). */
  time: string;
  importance: TodayImportance;
  /** Tab opened when the item is tapped. */
  target: ProductTabId;
};

export const TODAY_IMPORTANCE_RANK: Record<TodayImportance, number> = {
  Urgent: 0,
  High: 1,
  Normal: 2,
  Low: 3,
};

export const TODAY_KIND_LABEL: Record<TodayItemKind, string> = {
  task: 'Task',
  email: 'Email',
  calendar: 'Calendar',
  auria: 'Auria',
};

/**
 * Everything that needs Marta today, pulled from across the product: tasks due
 * today, important emails, calendar events, and Auria's own automations —
 * including the schedulings Auria books automatically.
 */
export const todayFeed: TodayFeedItem[] = [
  // ── Tasks due today ──
  {
    id: 'tf-task-1',
    kind: 'task',
    title: 'Approve new design system tokens',
    subtitle: 'Design system v2',
    time: 'Due today',
    importance: 'Urgent',
    target: 'tasks',
  },
  {
    id: 'tf-task-2',
    kind: 'task',
    title: 'Review Q3 product strategy draft',
    subtitle: 'Strategy_v3.pdf · awaiting approval',
    time: 'Due today',
    importance: 'High',
    target: 'tasks',
  },
  // ── Important emails ──
  {
    id: 'tf-mail-1',
    kind: 'email',
    title: 'Action required: security vulnerabilities',
    subtitle: 'Supabase',
    time: '18:52',
    importance: 'Urgent',
    target: 'integrations',
  },
  {
    id: 'tf-mail-2',
    kind: 'email',
    title: 'Your rebrand build is live on Expo Go',
    subtitle: 'Auria',
    time: '17:10',
    importance: 'High',
    target: 'integrations',
  },
  {
    id: 'tf-mail-3',
    kind: 'email',
    title: 'Relatório dia 15/06/2026',
    subtitle: 'Clariana Abreu',
    time: '14:04',
    importance: 'Normal',
    target: 'integrations',
  },
  // ── Calendar events ──
  {
    id: 'tf-cal-1',
    kind: 'calendar',
    title: 'Weekly product standup',
    subtitle: '9:30 – 10:00 · Google Meet',
    time: '9:30 AM',
    importance: 'High',
    target: 'integrations',
  },
  {
    id: 'tf-cal-2',
    kind: 'calendar',
    title: 'Design sync with Bruno',
    subtitle: '3:00 – 3:30 · booked by Auria',
    time: '3:00 PM',
    importance: 'Normal',
    target: 'integrations',
  },
  // ── Auria automations & schedulings ──
  {
    id: 'tf-auria-1',
    kind: 'auria',
    title: 'Auria booked a design sync for 3 PM',
    subtitle: 'Auto-scheduled from your task with Bruno',
    time: 'Just now',
    importance: 'Normal',
    target: 'auria',
  },
  {
    id: 'tf-auria-2',
    kind: 'auria',
    title: 'Auria drafted the Q2 retrospective summary',
    subtitle: 'Automation · ready for your review',
    time: '2h ago',
    importance: 'High',
    target: 'auria',
  },
];

/** Filter by importance ("All" keeps everything) and sort most important first. */
export function filterTodayFeed(
  items: TodayFeedItem[],
  importance: TodayImportance | 'All',
): TodayFeedItem[] {
  const base = importance === 'All' ? items : items.filter((item) => item.importance === importance);
  return [...base].sort(
    (a, b) => TODAY_IMPORTANCE_RANK[a.importance] - TODAY_IMPORTANCE_RANK[b.importance],
  );
}

/** One-line breakdown by kind, e.g. "2 tasks · 3 emails · 2 events · 1 from Auria". */
export function todayFeedSummary(items: TodayFeedItem[]): string {
  const count = (kind: TodayItemKind) => items.filter((item) => item.kind === kind).length;
  const parts: string[] = [];
  const tasks = count('task');
  const emails = count('email');
  const events = count('calendar');
  const auria = count('auria');
  if (tasks) parts.push(`${tasks} task${tasks !== 1 ? 's' : ''}`);
  if (emails) parts.push(`${emails} email${emails !== 1 ? 's' : ''}`);
  if (events) parts.push(`${events} event${events !== 1 ? 's' : ''}`);
  if (auria) parts.push(`${auria} from Auria`);
  return parts.join(' · ');
}
