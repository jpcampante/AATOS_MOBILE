import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line as SvgLine,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { motionDuration, motionEasing, useTheme } from '../../theme';

type Point = { month: string; value: number };

type LineChartProps = {
  data: ReadonlyArray<Point>;
  /** Stroke + fill color. Defaults to the insights accent. */
  color?: string;
  height?: number;
  /** Number of horizontal gridlines / y-axis ticks. */
  ticks?: number;
  /** Rounding step for the y-axis "nice" maximum (e.g. 250 for counts, 25 for %). */
  step?: number;
  /** Suffix appended to y-axis labels (e.g. "%"). */
  valueSuffix?: string;
};

const PAD_LEFT = 34;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;
const FILL_ID = 'aatosLineFill';

function niceMax(max: number, step = 250) {
  return Math.max(step, Math.ceil(max / step) * step);
}

/** Catmull-Rom → cubic bézier: a smooth (monotone-ish) curve like recharts. */
function buildSmoothPath(pts: ReadonlyArray<{ x: number; y: number }>, smoothing = 0.8) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * smoothing;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * smoothing;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * smoothing;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * smoothing;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/**
 * Smooth area-line chart (react-native-svg) — the mobile port of the recharts
 * `area_series` hero chart from AATOS_NEW_BRANDING: monotone curve, soft
 * gradient fill, dashed gridlines and axis labels.
 */
export function LineChart({ data, color, height = 180, ticks = 4, step = 250, valueSuffix = '' }: LineChartProps) {
  const { insights } = useTheme();
  const stroke = color ?? insights.accent;
  const [width, setWidth] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: motionDuration.chart,
      easing: motionEasing.standard,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((current) => (current === next ? current : next));
  };

  const geo = useMemo(() => {
    if (width <= 0 || data.length === 0) return null;
    const innerH = height - PAD_TOP - PAD_BOTTOM;
    const innerW = width - PAD_LEFT - PAD_RIGHT;
    const max = Math.max(...data.map((point) => point.value));
    const yMax = niceMax(max, step);
    const n = data.length;
    const xAt = (i: number) => PAD_LEFT + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yAt = (value: number) => PAD_TOP + innerH - (value / yMax) * innerH;
    const pts = data.map((point, i) => ({ x: xAt(i), y: yAt(point.value) }));
    const baseY = PAD_TOP + innerH;
    const line = buildSmoothPath(pts);
    const area = `${line} L ${pts[n - 1].x},${baseY} L ${pts[0].x},${baseY} Z`;
    const tickVals = Array.from({ length: ticks + 1 }, (_, i) => Math.round((yMax / ticks) * i));
    return { pts, line, area, tickVals, xAt, yAt };
  }, [width, height, data, ticks, step]);

  return (
    <Animated.View style={[styles.wrap, { height, opacity: fade }]} onLayout={onLayout}>
      {geo ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={FILL_ID} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.16} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {geo.tickVals.map((value) => (
            <SvgLine
              key={`grid-${value}`}
              x1={PAD_LEFT}
              y1={geo.yAt(value)}
              x2={width - PAD_RIGHT}
              y2={geo.yAt(value)}
              stroke={insights.divider}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {geo.tickVals.map((value) => (
            <SvgText
              key={`ylabel-${value}`}
              x={PAD_LEFT - 6}
              y={geo.yAt(value) + 3}
              fontSize={9}
              fill={insights.textHint}
              textAnchor="end"
            >
              {`${value}${valueSuffix}`}
            </SvgText>
          ))}

          <Path d={geo.area} fill={`url(#${FILL_ID})`} />
          <Path
            d={geo.line}
            stroke={stroke}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx={geo.pts[geo.pts.length - 1].x}
            cy={geo.pts[geo.pts.length - 1].y}
            r={4}
            fill={stroke}
          />

          {data.map((point, i) => (
            <SvgText
              key={`xlabel-${point.month}`}
              x={geo.xAt(i)}
              y={height - 6}
              fontSize={9}
              fill={insights.textHint}
              textAnchor="middle"
            >
              {point.month}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
});
