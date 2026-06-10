export type ProductTabId =
  | 'insights'
  | 'auria'
  | 'tasks'
  | 'specialists'
  | 'integrations'
  | 'settings';

export const PRODUCT_TABS: { id: ProductTabId; label: string }[] = [
  { id: 'insights', label: 'Insights' },
  { id: 'auria', label: 'Auria' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'specialists', label: 'Specialists' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'settings', label: 'Settings' },
];
