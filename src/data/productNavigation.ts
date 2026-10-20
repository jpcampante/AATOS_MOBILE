export type ProductTabId = 'auria' | 'profile';

/** Navigate to a tab, optionally pre-filling the Auria composer with a prompt. */
export type NavigateFn = (tab: ProductTabId, opts?: { prompt?: string }) => void;

export const PRODUCT_TABS: { id: ProductTabId; label: string }[] = [
  { id: 'auria', label: 'Auria' },
  { id: 'profile', label: 'Profile' },
];
