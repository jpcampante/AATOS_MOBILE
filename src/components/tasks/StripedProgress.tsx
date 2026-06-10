import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

type StripedProgressProps = {
  progress: number;
  color: string;
  trackOpacity?: number;
  height?: number;
};

export function StripedProgress({
  progress,
  color,
  trackOpacity = 0.32,
  height = 14,
}: StripedProgressProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const patternId = useMemo(() => `stripes-${Math.random().toString(36).slice(2, 8)}`, []);
  const radius = height / 2;

  return (
    <View style={[styles.track, { height, borderRadius: radius }]}>
      <Svg width="100%" height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <Pattern id={patternId} patternUnits="userSpaceOnUse" width={8} height={height} patternTransform="rotate(45)">
            <Rect width={3} height={height} fill={color} fillOpacity={trackOpacity} />
          </Pattern>
        </Defs>
        <Rect width="100%" height={height} fill={`url(#${patternId})`} />
      </Svg>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: color,
            borderRadius: radius,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
