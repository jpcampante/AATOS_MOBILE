import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type AuriaBloomMarkProps = {
  size?: 'sm' | 'md' | 'lg';
};

const PX = { sm: 22, md: 30, lg: 44 } as const;

/**
 * The aatos "bloom" brand mark — four petals around a four-point star void,
 * with a light-to-saturated blue gradient. Rebuilt as SVG.
 */
export function AuriaBloomMark({ size = 'md' }: AuriaBloomMarkProps) {
  const px = PX[size];
  return (
    <Svg width={px} height={px} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="aatosBloom" x1="14" y1="12" x2="84" y2="86" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#CFE0FF" />
          <Stop offset="0.45" stopColor="#5C95F5" />
          <Stop offset="1" stopColor="#1656DD" />
        </LinearGradient>
      </Defs>
      <Circle cx="32" cy="32" r="20.5" fill="url(#aatosBloom)" />
      <Circle cx="68" cy="32" r="20.5" fill="url(#aatosBloom)" />
      <Circle cx="32" cy="68" r="20.5" fill="url(#aatosBloom)" />
      <Circle cx="68" cy="68" r="20.5" fill="url(#aatosBloom)" />
    </Svg>
  );
}
