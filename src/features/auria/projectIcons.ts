import type { AuriaIconName } from '../../components/icons';

export type ProjectIconOption = {
  id: string;
  label: string;
  icon: AuriaIconName;
};

/** Project icon options — mirrors the web PROJECT_ICON_OPTIONS. */
export const PROJECT_ICON_OPTIONS: ProjectIconOption[] = [
  { id: 'folder', label: 'Folder', icon: 'folder' },
  { id: 'briefcase', label: 'Briefcase', icon: 'briefcase' },
  { id: 'target', label: 'Target', icon: 'target' },
  { id: 'database', label: 'Database', icon: 'database' },
  { id: 'bar-chart', label: 'Chart', icon: 'chartBar' },
  { id: 'file-text', label: 'Document', icon: 'document' },
  { id: 'users', label: 'Team', icon: 'users' },
  { id: 'building', label: 'Company', icon: 'building' },
  { id: 'shield', label: 'Shield', icon: 'shieldCheck' },
  { id: 'code', label: 'Code', icon: 'code' },
  { id: 'palette', label: 'Palette', icon: 'paintBrush' },
  { id: 'lightbulb', label: 'Idea', icon: 'lightBulb' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'globe', label: 'Globe', icon: 'globe' },
  { id: 'book-open', label: 'Book', icon: 'bookOpen' },
  { id: 'sparkles', label: 'Sparkles', icon: 'sparkles' },
  { id: 'rocket', label: 'Launch', icon: 'rocket' },
  { id: 'message', label: 'Messages', icon: 'messageSquare' },
  { id: 'package', label: 'Package', icon: 'cube' },
  { id: 'flag', label: 'Flag', icon: 'flag' },
  { id: 'graduation-cap', label: 'Training', icon: 'academicCap' },
  { id: 'layers', label: 'Layers', icon: 'layers' },
  { id: 'camera', label: 'Media', icon: 'camera' },
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'wrench', label: 'Tools', icon: 'wrench' },
];

export function getProjectIcon(iconId?: string | null): ProjectIconOption {
  return PROJECT_ICON_OPTIONS.find((option) => option.id === iconId) ?? PROJECT_ICON_OPTIONS[0];
}
