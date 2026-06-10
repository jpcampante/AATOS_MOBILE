export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'blocked' | 'review' | 'done';
export type TaskSource = 'Manual' | 'Auria' | 'Email' | 'Calendar' | 'Meeting' | 'Document' | 'Sales';

export type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  daysLeft?: number;
  source: TaskSource;
  relatedItem?: string;
  owner: string;
  lastActivity: string;
  isAiSuggestion?: boolean;
  aiConfidence?: number;
  blockedReason?: string;
  waitingOn?: string;
  reviewLabel?: string;
};

export type TasksSummary = {
  today: number;
  overdue: number;
  inProgress: number;
  waiting: number;
  blocked: number;
  aiSuggestions: number;
};

export const TASKS_USER = 'Marta Campante';

export const tasksSummary: TasksSummary = {
  today: 4,
  overdue: 2,
  inProgress: 7,
  waiting: 3,
  blocked: 1,
  aiSuggestions: 5,
};

export const todayFocusTasks: TaskItem[] = [
  {
    id: 't-today-1',
    title: 'Review Q3 product strategy draft',
    status: 'review',
    priority: 'High',
    daysLeft: 0,
    source: 'Document',
    relatedItem: 'Strategy_v3.pdf',
    owner: TASKS_USER,
    lastActivity: '2h ago',
    reviewLabel: 'Document awaiting your approval',
  },
  {
    id: 't-today-2',
    title: 'Approve new design system tokens',
    status: 'todo',
    priority: 'Urgent',
    daysLeft: 0,
    source: 'Manual',
    relatedItem: 'Design system v2',
    owner: TASKS_USER,
    lastActivity: '4h ago',
  },
  {
    id: 't-today-3',
    title: 'Reply to partnership email',
    status: 'todo',
    priority: 'Normal',
    daysLeft: 0,
    source: 'Email',
    relatedItem: 'partnership@acme.io',
    owner: TASKS_USER,
    lastActivity: 'Yesterday',
  },
  {
    id: 't-today-4',
    title: 'Prepare Monday team standup notes',
    status: 'in_progress',
    priority: 'Normal',
    daysLeft: 0,
    source: 'Meeting',
    relatedItem: 'Weekly standup',
    owner: TASKS_USER,
    lastActivity: '1h ago',
  },
];

export const overdueTasks: TaskItem[] = [
  {
    id: 't-overdue-1',
    title: 'Check uploaded MSA contract',
    status: 'blocked',
    priority: 'High',
    daysLeft: -3,
    source: 'Document',
    relatedItem: 'MSA_upload.pdf',
    owner: TASKS_USER,
    lastActivity: '3d ago',
    blockedReason: 'Legal review pending signature',
  },
  {
    id: 't-overdue-2',
    title: 'Send Q2 retrospective summary',
    status: 'todo',
    priority: 'High',
    daysLeft: -1,
    source: 'Manual',
    relatedItem: 'Q2 retro',
    owner: TASKS_USER,
    lastActivity: '1d ago',
  },
];

export const aiSuggestionTasks: TaskItem[] = [
  {
    id: 't-ai-1',
    title: 'Send follow-up to Nordic Studio',
    status: 'todo',
    priority: 'High',
    daysLeft: 0,
    source: 'Auria',
    relatedItem: 'Email thread — Nordic Studio',
    owner: TASKS_USER,
    lastActivity: 'Just now',
    isAiSuggestion: true,
    aiConfidence: 88,
  },
  {
    id: 't-ai-2',
    title: 'Review overdue contract annex',
    status: 'todo',
    priority: 'High',
    daysLeft: -1,
    source: 'Auria',
    relatedItem: 'Contract annex B',
    owner: TASKS_USER,
    lastActivity: '1h ago',
    isAiSuggestion: true,
    aiConfidence: 92,
  },
  {
    id: 't-ai-3',
    title: 'Schedule design sync with Bruno',
    status: 'todo',
    priority: 'Normal',
    daysLeft: 2,
    source: 'Auria',
    relatedItem: 'Design weekly',
    owner: TASKS_USER,
    lastActivity: '3h ago',
    isAiSuggestion: true,
    aiConfidence: 76,
  },
];

export const waitingTasks: TaskItem[] = [
  {
    id: 't-wait-1',
    title: 'QBR prep — Client X',
    status: 'waiting',
    priority: 'Normal',
    daysLeft: 2,
    source: 'Meeting',
    relatedItem: 'Quarterly business review',
    owner: 'Diego Oliveira',
    lastActivity: '1d ago',
    waitingOn: 'Diego Oliveira',
  },
  {
    id: 't-wait-2',
    title: 'Onboarding checklist — new hire',
    status: 'waiting',
    priority: 'Normal',
    daysLeft: 5,
    source: 'Manual',
    relatedItem: 'New hire — March',
    owner: 'Eduarda Santos',
    lastActivity: '2d ago',
    waitingOn: 'Eduarda Santos',
  },
];

export const taskFilters = [
  { id: 'all' as const, label: 'All' },
  { id: 'today' as const, label: 'Today' },
  { id: 'overdue' as const, label: 'Overdue' },
  { id: 'ai' as const, label: 'AI suggested' },
  { id: 'waiting' as const, label: 'Waiting' },
];

export function formatDueLabel(daysLeft?: number): string {
  if (daysLeft == null) return 'No due date';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return 'Due tomorrow';
  if (daysLeft > 1) return `Due in ${daysLeft} days`;
  if (daysLeft === -1) return '1 day overdue';
  return `${Math.abs(daysLeft)} days overdue`;
}
