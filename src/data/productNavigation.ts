export type ProductTabId =
  | 'insights'
  | 'auria'
  | 'tasks'
  | 'integrations'
  | 'settings';

/** Navigate to a tab, optionally pre-filling the Auria composer with a prompt. */
export type NavigateFn = (tab: ProductTabId, opts?: { prompt?: string }) => void;

export const PRODUCT_TABS: { id: ProductTabId; label: string }[] = [
  { id: 'insights', label: 'Insights' },
  { id: 'auria', label: 'Auria' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'settings', label: 'Settings' },
];
