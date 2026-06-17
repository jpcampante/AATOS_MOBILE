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

type Point = { label: string; value: number };

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
  /** Optional overlay series (correlation) — drawn dashed on its own scale. */
  series2?: ReadonlyArray<Point>;
  color2?: string;
  /** Optional callout marking the most recent point. */
  annotationLabel?: string;
};

const PAD_LEFT = 34;
const PAD_RIGHT = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;
const FILL_ID = 'aatosLineFill';

function niceMax(max: number, step = 250) {
  return Math.max(step, Math.ceil(max / step) * step);
}

/** Integer when whole, one decimal otherwise — avoids "1, 1, 2, 2" on small ranges. */
function formatTick(value: number): string {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 0.05 ? `${rounded}` : value.toFixed(1);
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
 * gradient fill, dashed gridlines and axis labels. Supports an optional overlay
 * series (correlation) and a callout on the latest point.
 */
export function LineChart({
  data,
  color,
  height = 180,
  ticks = 4,
  step = 250,
  valueSuffix = '',
  series2,
  color2 = '#2563EB',
  annotationLabel,
}: LineChartProps) {
  const { insights } = useTheme();
  const stroke = color ?? insights.accent;
  const [width, setWidth] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: motionDuration.chart,
      easing: motionEasing.standard,
      useNativeDriver: true,
    }).start();
  }, [fade, data, series2]);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((current) => (current === next ? current : next));
  };

  const geo = useMemo(() => {
    if (width <= 0 || data.length === 0) return null;
    const innerH = height - PAD_TOP - PAD_BOTTOM;
    const innerW = width - PAD_LEFT - PAD_RIGHT;
    const n = data.length;
    const yMax = niceMax(Math.max(...data.map((p) => p.value)), step);
    const xAt = (i: number) => PAD_LEFT + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yAt = (value: number) => PAD_TOP + innerH - (value / yMax) * innerH;
    const pts = data.map((point, i) => ({ x: xAt(i), y: yAt(point.value) }));
    const baseY = PAD_TOP + innerH;
    const line = buildSmoothPath(pts);
    const area = `${line} L ${pts[n - 1].x},${baseY} L ${pts[0].x},${baseY} Z`;
    const tickVals = Array.from({ length: ticks + 1 }, (_, i) => (yMax / ticks) * i);

    // Overlay on its own scale (shape comparison, no second axis).
    let line2: string | null = null;
    if (series2 && series2.length > 1) {
      const max2 = Math.max(...series2.map((p) => p.value), 1);
      const m = series2.length;
      const x2 = (i: number) => PAD_LEFT + (m === 1 ? innerW / 2 : (i / (m - 1)) * innerW);
      const y2 = (value: number) => PAD_TOP + innerH - (value / max2) * innerH;
      line2 = buildSmoothPath(series2.map((p, i) => ({ x: x2(i), y: y2(p.value) })));
    }

    return { pts, line, area, tickVals, xAt, yAt, line2 };
  }, [width, height, data, ticks, step, series2]);

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

          {geo.tickVals.map((value, i) => (
            <SvgLine
              key={`grid-${i}`}
              x1={PAD_LEFT}
              y1={geo.yAt(value)}
              x2={width - PAD_RIGHT}
              y2={geo.yAt(value)}
              stroke={insights.divider}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {geo.tickVals.map((value, i) => (
            <SvgText
              key={`ylabel-${i}`}
              x={PAD_LEFT - 6}
              y={geo.yAt(value) + 3}
              fontSize={9}
              fill={insights.textHint}
              textAnchor="end"
            >
              {`${formatTick(value)}${valueSuffix}`}
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

          {geo.line2 ? (
            <Path
              d={geo.line2}
              stroke={color2}
              strokeWidth={2}
              strokeDasharray="5 4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          <Circle
            cx={geo.pts[geo.pts.length - 1].x}
            cy={geo.pts[geo.pts.length - 1].y}
            r={annotationLabel ? 5 : 4}
            fill={stroke}
          />
          {annotationLabel ? (
            <>
              <Circle
                cx={geo.pts[geo.pts.length - 1].x}
                cy={geo.pts[geo.pts.length - 1].y}
                r={9}
                fill={stroke}
                fillOpacity={0.14}
              />
              <SvgText
                x={geo.pts[geo.pts.length - 1].x}
                y={Math.max(geo.pts[geo.pts.length - 1].y - 12, PAD_TOP + 2)}
                fontSize={9}
                fontWeight="600"
                fill={stroke}
                textAnchor="end"
              >
                {annotationLabel}
              </SvgText>
            </>
          ) : null}

          {data.map((point, i) => (
            <SvgText
              key={`xlabel-${point.label}-${i}`}
              x={geo.xAt(i)}
              y={height - 6}
              fontSize={9}
              fill={insights.textHint}
              textAnchor="middle"
            >
              {point.label}
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
