export type ProductTabId =
  | 'insights'
  | 'auria'
  | 'tasks'
  | 'integrations'
  | 'settings';

export const PRODUCT_TABS: { id: ProductTabId; label: string }[] = [
  { id: 'insights', label: 'Insights' },
  { id: 'auria', label: 'Auria' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'settings', label: 'Settings' },
];
