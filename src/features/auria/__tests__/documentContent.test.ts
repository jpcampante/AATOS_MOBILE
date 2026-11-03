import { parseDeckDocument, parseSheetDocument } from '../documentContent';

describe('parseSheetDocument', () => {
  it('reads the tabs the Auria wrote', () => {
    const content = JSON.stringify({
      tableSheets: [
        { title: 'Budget', data: { columns: ['Area', 'Value'], rows: [['Marketing', 700], ['Sales', 1200]] } },
        { title: 'Notes', hidden: true, data: { columns: ['Note'], rows: [['Keep']] } },
      ],
    });
    expect(parseSheetDocument(content)).toEqual([
      { name: 'Budget', columns: ['Area', 'Value'], rows: [['Marketing', '700'], ['Sales', '1200']], hidden: false },
      { name: 'Notes', columns: ['Note'], rows: [['Keep']], hidden: true },
    ]);
  });

  it('reads the editor grid when the editor saved last', () => {
    const content = JSON.stringify({
      formulaRows: 'data',
      workbookV2: { sheets: [{ title: 'Q3', cells: [['Area', 'Value'], ['Marketing', 700], ['', '']] }] },
      tableSheets: [{ title: 'Old', data: { columns: ['x'], rows: [['y']] } }],
    });
    expect(parseSheetDocument(content)).toEqual([
      { name: 'Q3', columns: ['Area', 'Value'], rows: [['Marketing', '700']], hidden: false },
    ]);
  });

  it('names a tab the sheet did not name', () => {
    const content = JSON.stringify({ tableSheets: [{ data: { columns: [], rows: [] } }] });
    expect(parseSheetDocument(content)?.[0].name).toBe('Sheet 1');
  });

  it('gives up on anything that is not a spreadsheet', () => {
    expect(parseSheetDocument('not json')).toBeNull();
    expect(parseSheetDocument('')).toBeNull();
    expect(parseSheetDocument(JSON.stringify({ kind: 'presentation' }))).toBeNull();
  });
});

describe('parseDeckDocument', () => {
  const deck = JSON.stringify({
    kind: 'presentation',
    pages: [],
    outline: {
      title: 'Q3 review',
      template: 'myceo-sales-deck',
      slides: [
        { id: 's1', layout: 'cover', title: 'Q3 review', eyebrow: '', lead: 'How the quarter went', points: [] },
        {
          id: 's2',
          layout: 'points',
          title: 'What changed',
          points: [{ title: 'Revenue', body: 'Up 12%' }, { title: 'Churn' }],
          outcome: 'Keep going',
        },
      ],
    },
  });

  it('reads the slides in order', () => {
    const parsed = parseDeckDocument(deck);
    expect(parsed?.title).toBe('Q3 review');
    expect(parsed?.slides).toHaveLength(2);
    expect(parsed?.slides[1]).toMatchObject({
      title: 'What changed',
      outcome: 'Keep going',
      points: [{ title: 'Revenue', body: 'Up 12%' }, { title: 'Churn', body: '' }],
    });
  });

  it('gives up without an outline', () => {
    expect(parseDeckDocument(JSON.stringify({ kind: 'presentation' }))).toBeNull();
    expect(parseDeckDocument('{')).toBeNull();
  });
});
