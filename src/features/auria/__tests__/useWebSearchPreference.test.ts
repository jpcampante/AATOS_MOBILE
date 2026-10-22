import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getWebSearchSettings, saveWebSearchChoice, type WebSearchSettings } from '../api/webSearch';
import { useWebSearchPreference } from '../useWebSearchPreference';

jest.mock('../api/webSearch', () => ({ getWebSearchSettings: jest.fn(), saveWebSearchChoice: jest.fn() }));

const get = getWebSearchSettings as jest.Mock;
const save = saveWebSearchChoice as jest.Mock;

const settings = (chat: WebSearchSettings['chat'], over: Partial<WebSearchSettings> = {}): WebSearchSettings => ({
  available: true,
  companyEnabled: true,
  chat,
  ...over,
});

async function openChat(chatId: string | null, initial: WebSearchSettings) {
  get.mockResolvedValueOnce(initial);
  const hook = renderHook(({ id }: { id: string | null }) => useWebSearchPreference(id), { initialProps: { id: chatId } });
  await waitFor(() => expect(hook.result.current.state.status).toBe('ready'));
  return hook;
}

/** Runs a call that updates the hook's state inside act(), returning its result. */
async function inAct<T>(call: () => Promise<T>): Promise<T> {
  let out!: T;
  await act(async () => {
    out = await call();
  });
  return out;
}

beforeEach(() => jest.clearAllMocks());

describe('useWebSearchPreference', () => {
  it('reads the saved choice of a chat', async () => {
    const { result } = await openChat('c-1', settings({ mode: 'auto', revision: 3 }));
    expect(get).toHaveBeenCalledWith('c-1');
    expect(result.current.state).toMatchObject({ mode: 'auto', revision: 3 });
  });

  it('saves a choice for a saved chat with the revision it read', async () => {
    const { result } = await openChat('c-1', settings({ mode: null, revision: 0 }));
    save.mockResolvedValue({ mode: 'auto', revision: 1 });

    await act(() => result.current.choose('auto'));

    expect(save).toHaveBeenCalledWith('c-1', 'auto', 0);
    expect(result.current.state).toMatchObject({ status: 'ready', mode: 'auto', revision: 1 });
  });

  it('re-reads after a conflict and never resends', async () => {
    const { result } = await openChat('c-1', settings({ mode: null, revision: 0 }));
    save.mockRejectedValue(Object.assign(new Error('conflict'), { status: 409, code: 'revision_conflict' }));
    get.mockResolvedValueOnce(settings({ mode: 'off', revision: 2 }));

    await act(() => result.current.choose('auto'));

    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.state).toMatchObject({
      status: 'ready',
      mode: 'off',
      revision: 2,
      notice: 'The choice was refreshed. Check it before sending.',
    });
  });

  it('keeps a new chat choice locally and saves it once the server creates the chat', async () => {
    const { result } = await openChat(null, settings(null));
    await act(() => result.current.choose('auto'));
    expect(save).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({ mode: 'auto', unsaved: true });

    const first = await inAct(() => result.current.preflight());
    expect(first).toEqual({ mode: 'auto', notice: null });

    save.mockResolvedValue({ mode: 'auto', revision: 1 });
    expect(await inAct(() => result.current.bind('c-new'))).toBeNull();
    expect(save).toHaveBeenCalledWith('c-new', 'auto', 0);
  });

  it('does not save anything for a new chat the person never toggled', async () => {
    const { result } = await openChat(null, settings(null));
    expect(await inAct(() => result.current.bind('c-new'))).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it('says so when the new chat choice could not be saved', async () => {
    const { result } = await openChat(null, settings(null));
    await act(() => result.current.choose('auto'));
    save.mockRejectedValue(new Error('offline'));
    expect(await inAct(() => result.current.bind('c-new'))).toBe(
      'Your search choice was not saved. Reload the choice before the next send.',
    );
  });

  describe('preflight (before each send)', () => {
    it('uses the choice when it did not change', async () => {
      const { result } = await openChat('c-1', settings({ mode: 'auto', revision: 3 }));
      get.mockResolvedValueOnce(settings({ mode: 'auto', revision: 3 }));
      expect(await inAct(() => result.current.preflight())).toEqual({ mode: 'auto', notice: null });
    });

    it('goes Off for this turn when the choice changed meanwhile', async () => {
      const { result } = await openChat('c-1', settings({ mode: 'auto', revision: 3 }));
      get.mockResolvedValueOnce(settings({ mode: 'auto', revision: 4 }));
      expect(await inAct(() => result.current.preflight())).toEqual({
        mode: 'off',
        notice: 'The search choice changed. This message uses Web Off.',
      });
    });

    it('goes Off for this turn when it cannot check', async () => {
      const { result } = await openChat('c-1', settings({ mode: 'auto', revision: 3 }));
      get.mockRejectedValueOnce(new Error('timeout'));
      expect(await inAct(() => result.current.preflight())).toEqual({
        mode: 'off',
        notice: 'Search settings could not be checked. This message uses Web Off.',
      });
    });

    it('is Off when the company turned search off', async () => {
      const { result } = await openChat('c-1', settings({ mode: 'auto', revision: 3 }));
      get.mockResolvedValueOnce(settings({ mode: 'auto', revision: 3 }, { companyEnabled: false }));
      expect(await inAct(() => result.current.preflight())).toEqual({ mode: 'off', notice: null });
    });

    it('is Off while the settings are still loading', async () => {
      get.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useWebSearchPreference('c-1'));
      expect(await inAct(() => result.current.preflight())).toEqual({ mode: 'off', notice: null });
    });
  });

  it('shows an error that a reload can fix', async () => {
    get.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useWebSearchPreference('c-1'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.notice).toBe('Search settings could not be loaded. Retry to choose search.');

    get.mockResolvedValueOnce(settings({ mode: 'off', revision: 1 }));
    await act(() => result.current.reload());
    expect(result.current.state).toMatchObject({ status: 'ready', mode: 'off' });
  });
});
