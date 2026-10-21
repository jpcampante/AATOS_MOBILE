import { Image, StyleSheet } from 'react-native';

type AuriaBloomMarkProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Hidden from screen readers when it only decorates a label next to it. */
  decorative?: boolean;
};

const PX = { xs: 18, sm: 24, md: 34, lg: 48 } as const;

const BLOOM = require('../../../assets/auria-bloom.png');

/** The aatos "bloom" brand mark used in the Auria greeting. */
export function AuriaBloomMark({ size = 'md', decorative = false }: AuriaBloomMarkProps) {
  const px = PX[size];
  return (
    <Image
      source={BLOOM}
      style={[styles.mark, { width: px, height: px }]}
      resizeMode="contain"
      accessibilityLabel={decorative ? undefined : 'aatos'}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
    />
  );
}

const styles = StyleSheet.create({
  mark: {},
});
