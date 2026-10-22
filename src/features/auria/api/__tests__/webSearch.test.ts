import { auriaHttp } from '../http';
import { getWebSearchSettings, saveWebSearchChoice } from '../webSearch';

jest.mock('../http', () => ({ auriaHttp: { get: jest.fn(), put: jest.fn() } }));

const get = auriaHttp.get as jest.Mock;
const put = auriaHttp.put as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getWebSearchSettings (E48)', () => {
  it('reads the server, the company switch and the chat choice', async () => {
    get.mockResolvedValue({
      status: 'success',
      available: true,
      company: { enabled: false, revision: 2, can_manage: false },
      personal: { mode: 'auto', revision: 1 },
      chat: { chat_id: 'c-1', mode: 'auto', revision: 4, suggested: 'off', source: 'history' },
      modes: ['auto', 'off'],
    });

    await expect(getWebSearchSettings('c-1')).resolves.toEqual({
      available: true,
      companyEnabled: false,
      chat: { mode: 'auto', revision: 4 },
    });
    expect(get).toHaveBeenCalledWith('/auria/web-search/settings?chat_id=c-1', { timeoutMs: 5000 });
  });

  it('has no chat part without a chat, and treats unknown modes as not chosen', async () => {
    get.mockResolvedValue({ available: false, company: { enabled: true }, chat: { mode: 'on', revision: 1 } });
    await expect(getWebSearchSettings(null)).resolves.toEqual({ available: false, companyEnabled: true, chat: null });
    expect(get).toHaveBeenCalledWith('/auria/web-search/settings', { timeoutMs: 5000 });

    await expect(getWebSearchSettings('c-1')).resolves.toMatchObject({ chat: { mode: null, revision: 1 } });
  });
});

describe('saveWebSearchChoice (E49)', () => {
  it('saves the choice for the chat with the revision read', async () => {
    put.mockResolvedValue({ status: 'success', preference: { mode: 'auto', revision: 5 } });
    await expect(saveWebSearchChoice('c-1', 'auto', 4)).resolves.toEqual({ mode: 'auto', revision: 5 });
    expect(put).toHaveBeenCalledWith('/auria/web-search/preference', { mode: 'auto', revision: 4, chat_id: 'c-1' }, { timeoutMs: 5000 });
  });

  it('does not count an answer that is not the echo of what was sent', async () => {
    put.mockResolvedValue({ preference: { mode: 'off', revision: 5 } });
    await expect(saveWebSearchChoice('c-1', 'auto', 4)).rejects.toThrow('not confirmed');
    put.mockResolvedValue({ preference: { mode: 'auto', revision: 4 } });
    await expect(saveWebSearchChoice('c-1', 'auto', 4)).rejects.toThrow('not confirmed');
  });
});
