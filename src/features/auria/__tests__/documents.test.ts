import { mapApiDocument, mapApiDocuments } from '../documents';

const raw = (over: Record<string, unknown> = {}) => ({
  id: 'doc-1',
  chat_id: 'c-1',
  title: 'Q3 plan',
  format: 'markdown',
  version: 2,
  preview: '  The quarter in three parts.  ',
  updated_at: '2026-10-30T10:00:00Z',
  ...over,
});

describe('mapApiDocument', () => {
  it('reads a document the server sent', () => {
    expect(mapApiDocument(raw())).toEqual({
      id: 'doc-1',
      chatId: 'c-1',
      title: 'Q3 plan',
      format: 'markdown',
      version: 2,
      preview: 'The quarter in three parts.',
      updatedAt: '2026-10-30T10:00:00Z',
    });
  });

  it('keeps the body when the server sent it', () => {
    expect(mapApiDocument(raw({ content: '# Q3' }))?.content).toBe('# Q3');
  });

  it('falls back for a format it does not know and a missing title', () => {
    expect(mapApiDocument(raw({ format: 'pdf', title: '  ' }))).toMatchObject({
      format: 'plain',
      title: 'Untitled document',
    });
  });

  it('drops anything without an id', () => {
    expect(mapApiDocument(raw({ id: '' }))).toBeNull();
    expect(mapApiDocument(null)).toBeNull();
    expect(mapApiDocument('doc')).toBeNull();
  });
});

describe('mapApiDocuments', () => {
  it('keeps the last state of each document, in order', () => {
    const list = mapApiDocuments([
      raw({ id: 'a', version: 1 }),
      raw({ id: 'b' }),
      raw({ id: 'a', version: 3, title: 'Q3 plan (final)' }),
    ]);
    expect(list.map((d) => [d.id, d.version])).toEqual([
      ['a', 3],
      ['b', 2],
    ]);
    expect(list[0].title).toBe('Q3 plan (final)');
  });

  it('is empty without a list', () => {
    expect(mapApiDocuments(null)).toEqual([]);
    expect(mapApiDocuments(undefined)).toEqual([]);
  });
});
