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
