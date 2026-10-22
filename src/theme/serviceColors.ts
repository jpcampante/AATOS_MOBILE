/**
 * Tints of the service-family glyphs in the Auria work panel (same as the web's
 * `ServiceMark`). Fixed in both themes: they identify a product family, like a logo.
 */
export const serviceColors = {
  mail: '#1E6BFF',
  calendar: '#1A73E8',
  contacts: '#D96B3B',
  tasks: '#E85D2A',
  knowledge: '#178E87',
  document: '#66645F',
  memory: '#66645F',
  web: '#4285F4',
  team: '#7456D8',
  roadmap: '#7456D8',
  workspace: '#0FA3B1',
  auria: '#6366F1',
} as const;

export type ServiceFamily = keyof typeof serviceColors;
