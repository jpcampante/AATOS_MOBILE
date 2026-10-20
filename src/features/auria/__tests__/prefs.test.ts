import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuriaPrefs, loadLastChatId, loadMode, saveLastChatId, saveMode } from '../prefs';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('Auria prefs', () => {
  it('defaults to Fast and remembers the choice', async () => {
    expect(await loadMode()).toBe('fast');
    await saveMode('deep');
    expect(await loadMode()).toBe('deep');
  });

  it('ignores a stored value it does not know', async () => {
    await AsyncStorage.setItem('auria:mode', 'turbo');
    expect(await loadMode()).toBe('fast');
    await AsyncStorage.setItem('auria:last-chat-id', '../../etc');
    expect(await loadLastChatId()).toBeNull();
  });

  it('remembers and clears the last chat', async () => {
    await saveLastChatId('5f0c1d2e-aaaa-bbbb-cccc-1234567890ab');
    expect(await loadLastChatId()).toBe('5f0c1d2e-aaaa-bbbb-cccc-1234567890ab');
    await clearAuriaPrefs();
    expect(await loadLastChatId()).toBeNull();
  });

  it('falls back to defaults when storage fails', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('disk'));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('disk'));
    await expect(saveMode('deep')).resolves.toBeUndefined();
    expect(await loadMode()).toBe('fast');
  });
});
