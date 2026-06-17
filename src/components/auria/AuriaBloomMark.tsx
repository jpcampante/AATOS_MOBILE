import { Image, StyleSheet } from 'react-native';

type AuriaBloomMarkProps = {
  size?: 'sm' | 'md' | 'lg';
};

const PX = { sm: 24, md: 34, lg: 48 } as const;

const BLOOM = require('../../../assets/auria-bloom.png');

/** The aatos "bloom" brand mark used in the Auria greeting. */
export function AuriaBloomMark({ size = 'md' }: AuriaBloomMarkProps) {
  const px = PX[size];
  return (
    <Image
      source={BLOOM}
      style={[styles.mark, { width: px, height: px }]}
      resizeMode="contain"
      accessibilityLabel="aatos"
    />
  );
}

const styles = StyleSheet.create({
  mark: {},
});
