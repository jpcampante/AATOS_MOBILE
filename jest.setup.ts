// Global test setup (jest "setupFiles").

// Liquid Glass is iOS-only and has no native view in Jest: plain Views, never available.
jest.mock('expo-glass-effect', () => {
  const { View } = jest.requireActual('react-native');
  return {
    GlassView: View,
    GlassContainer: View,
    isLiquidGlassAvailable: () => false,
    isGlassEffectAPIAvailable: () => false,
  };
});

// expo/fetch is native-only (and no test may reach the network): API tests pass their own fetch.
jest.mock('expo/fetch', () => ({ fetch: jest.fn(() => Promise.reject(new Error('No network in tests'))) }));
