import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { welcomeContent } from '../data/welcomeContent';
import { useTheme } from '../theme';
import { RotatingRevealText } from '../components/ui/RotatingRevealText';

type WelcomeScreenProps = {
  onContinue: () => void;
  onLogin: () => void;
};

export function WelcomeScreen({ onContinue, onLogin }: WelcomeScreenProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={theme.colors.statusBar} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.brand}>{welcomeContent.brand}</Text>
          <Text style={styles.title}>{welcomeContent.title}</Text>
          <RotatingRevealText
            phrases={welcomeContent.rotatingPhrases}
            textStyle={styles.description}
            coverColor={theme.colors.page}
            dotColor={theme.colors.text}
          />
        </View>

        <View style={styles.features}>
          {welcomeContent.features.map((feature) => (
            <View key={feature.label} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={onContinue} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={onLogin} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>Sign in</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
  const { colors } = theme;
  const border = { borderWidth: 1, borderColor: colors.border } as const;
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.page,
    },
    scroll: {
      padding: 24,
      paddingBottom: 40,
      gap: 20,
    },
    hero: {
      alignItems: 'center',
      paddingTop: 12,
    },
    logoBox: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      ...border,
    },
    logoText: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    brand: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 3,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    features: {
      gap: 12,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      ...border,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.input,
      alignItems: 'center',
      justifyContent: 'center',
      ...border,
    },
    featureEmoji: {
      fontSize: 18,
    },
    featureCopy: {
      flex: 1,
    },
    featureLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    featureDesc: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textTertiary,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      ...border,
    },
    primaryButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: colors.surface,
      ...border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
