import type { ApiChat, ApiMessage, ApiPage } from '../api/types';
import { absolutizeUrl, mapApiChat, mapApiMessage, mapApiPage, serverPath } from '../mappers';

const BASE = 'https://pilarone.mydailyceo.com';

const message = (over: Partial<ApiMessage>): ApiMessage => ({
  uuid: 'm-1',
  author_role: 'assistant',
  content_type: 'text',
  content: 'Hello',
  created_time: '2026-10-20T10:00:00Z',
  liked: false,
  reasoning: '',
  parent_uuid: 'm-0',
  version_index: 1,
  version_count: 1,
  versions: ['m-1'],
  ...over,
});

describe('mapApiChat', () => {
  it('maps the sidebar item', () => {
    const chat: ApiChat = {
      id_chat: 'c-1',
      title: 'Q3 plan',
      provider: 'auria_system',
      visibility: 'private',
      owner_public_uid: 'u-1',
      created_time: '2026-10-01T00:00:00Z',
      last_activity: '2026-10-20T00:00:00Z',
      message_count: 4,
      is_pinned: true,
    };
    expect(mapApiChat(chat)).toEqual({
      id: 'c-1',
      title: 'Q3 plan',
      provider: 'auria_system',
      visibility: 'private',
      ownerPublicUid: 'u-1',
      isPinned: true,
      lastActivity: '2026-10-20T00:00:00Z',
      messageCount: 4,
      createdAt: '2026-10-01T00:00:00Z',
    });
  });

  it('fills defaults for missing fields', () => {
    expect(mapApiChat({ id_chat: 'c-2', title: '  ', provider: null })).toMatchObject({
      title: 'New chat',
      provider: 'auria_system',
      visibility: 'private',
      isPinned: false,
      messageCount: null,
    });
  });
});

describe('mapApiPage', () => {
  it('maps items and tells whether there is more', () => {
    const page: ApiPage<ApiChat> = {
      count: 31,
      next: 'https://x/?page=2',
      previous: null,
      results: [{ id_chat: 'a', title: 'A', provider: 'aatos' }],
    };
    const mapped = mapApiPage(page, mapApiChat);
    expect(mapped.count).toBe(31);
    expect(mapped.hasMore).toBe(true);
    expect(mapped.items[0].id).toBe('a');
  });
});

describe('mapApiMessage', () => {
  it('maps an assistant text message with its version and reasoning', () => {
    expect(
      mapApiMessage(message({ reasoning: 'Checked the tasks.', version_index: 2, version_count: 3, versions: ['a', 'm-1', 'b'], liked: true }), BASE),
    ).toEqual({
      id: 'm-1',
      serverId: 'm-1',
      role: 'assistant',
      text: 'Hello',
      createdAt: '2026-10-20T10:00:00Z',
      reasoningText: 'Checked the tasks.',
      liked: true,
      version: { index: 2, count: 3, ids: ['a', 'm-1', 'b'] },
    });
  });

  it('drops system and tool messages', () => {
    expect(mapApiMessage(message({ author_role: 'system' }), BASE)).toBeNull();
    expect(mapApiMessage(message({ author_role: 'tool' }), BASE)).toBeNull();
  });

  it('pulls attachments out of a user message', () => {
    const mapped = mapApiMessage(
      message({
        author_role: 'user',
        content:
          '![photo.jpg](/auria/chat/attachments/11111111-1111-1111-1111-111111111111)\n[attachment:report.pdf](/auria/chat/attachments/22222222-2222-2222-2222-222222222222)\n\nWhat is in these?',
      }),
      BASE,
    );
    expect(mapped?.text).toBe('What is in these?');
    expect(mapped?.files).toEqual([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'photo.jpg',
        url: `${BASE}/auria/chat/attachments/11111111-1111-1111-1111-111111111111`,
        isImage: true,
        private: true,
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'report.pdf',
        url: `${BASE}/auria/chat/attachments/22222222-2222-2222-2222-222222222222`,
        isImage: false,
        private: true,
      },
    ]);
  });

  it('keeps markdown images inside assistant answers', () => {
    const content = 'Here:\n\n![chart](https://example.com/c.png)';
    expect(mapApiMessage(message({ content }), BASE)?.text).toBe(content);
  });

  it('maps a generated image message', () => {
    const mapped = mapApiMessage(
      message({ content_type: 'image', content: '/media/users/u/generated_images/abc.png' }),
      BASE,
    );
    expect(mapped?.imageUrl).toBe(`${BASE}/media/users/u/generated_images/abc.png`);
    expect(mapped?.text).toBe('');
  });

  it('maps an imported multimodal message', () => {
    const mapped = mapApiMessage(
      message({
        author_role: 'user',
        content_type: 'multimodal_text',
        content: { asset_pointer: 'file-service://x', asset_url: `${BASE}/media/import/x.png`, instruction: 'Describe it' },
      }),
      BASE,
    );
    expect(mapped?.text).toBe('Describe it');
    expect(mapped?.files?.[0]).toMatchObject({ isImage: true, private: false, url: `${BASE}/media/import/x.png` });
  });

  it('keeps mentions', () => {
    const mapped = mapApiMessage(
      message({ author_role: 'user', mentions: [{ user_public_uid: 'u-9', full_name: 'Ana Lima' }] }),
      BASE,
    );
    expect(mapped?.mentions).toEqual([{ userPublicUid: 'u-9', name: 'Ana Lima' }]);
  });

  it('drops messages with nothing to show', () => {
    expect(mapApiMessage(message({ content: '   ' }), BASE)).toBeNull();
    expect(mapApiMessage(message({ content: null }), BASE)).toBeNull();
  });
});

describe('absolutizeUrl', () => {
  it('prefixes server paths and leaves absolute URLs', () => {
    expect(absolutizeUrl('/media/a.png', BASE)).toBe(`${BASE}/media/a.png`);
    expect(absolutizeUrl('https://cdn.test/a.png', BASE)).toBe('https://cdn.test/a.png');
  });

  it('upgrades http links to the API host to the API scheme (the token must not go in clear)', () => {
    expect(absolutizeUrl('http://pilarone.mydailyceo.com/auria/chat/attachments/x', BASE)).toBe(
      `${BASE}/auria/chat/attachments/x`,
    );
    expect(absolutizeUrl('http://other.test/a.png', BASE)).toBe('http://other.test/a.png');
  });
});

describe('serverPath', () => {
  it('turns a link to the API host back into the server path, and leaves the rest', () => {
    expect(serverPath(`${BASE}/auria/chat/attachments/x`, BASE)).toBe('/auria/chat/attachments/x');
    expect(serverPath('https://cdn.test/a.png', BASE)).toBe('https://cdn.test/a.png');
    expect(serverPath(`${BASE}.evil.test/a`, BASE)).toBe(`${BASE}.evil.test/a`);
  });
});
