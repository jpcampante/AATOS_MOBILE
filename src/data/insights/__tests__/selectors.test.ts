import { needsYou, risks } from '../selectors';
import type { Signal } from '../types';

const signal = (id: string, type: Signal['type'], severity: Signal['severity']): Signal =>
  ({ id, type, severity, domain: 'tasks', title: id, source: 'sample', actionIds: [] }) as Signal;

describe('insights selectors', () => {
  const signals = [
    signal('low-action', 'actionable', 'low'),
    signal('high-trend', 'trend', 'high'),
    signal('high-action', 'actionable', 'high'),
    signal('medium-action', 'actionable', 'medium'),
  ];

  it('needsYou keeps actionable signals, most severe first', () => {
    expect(needsYou(signals).map((s) => s.id)).toEqual(['high-action', 'medium-action', 'low-action']);
  });

  it('risks keeps only trends', () => {
    expect(risks(signals).map((s) => s.id)).toEqual(['high-trend']);
  });
});
