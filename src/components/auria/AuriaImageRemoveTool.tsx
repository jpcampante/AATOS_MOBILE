import { useMemo, useReducer, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';

type Point = { x: number; y: number };
type Stroke = { points: Point[]; size: number };

type AuriaImageRemoveToolProps = {
  source: ImageSourcePropType;
  /** Abandon the edit and return to the viewer. */
  onCancel: () => void;
  /** Apply the painted selection. `painted` is false when nothing was brushed. */
  onNext: (painted: boolean) => void;
};

const BRUSH_MIN = 14;
const BRUSH_MAX = 64;
const SLIDER_HEIGHT = 150;

/** Builds an SVG path string from a list of points (a freehand stroke). */
function toPath(points: Point[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y}` + rest.map((p) => ` L ${p.x} ${p.y}`).join('');
}

type History = { strokes: Stroke[]; redo: Stroke[] };
type HistoryAction = { type: 'commit'; stroke: Stroke } | { type: 'undo' } | { type: 'redo' };

/** Atomic stroke history so undo/redo can never desync, even on fast taps. */
function historyReducer(state: History, action: HistoryAction): History {
  switch (action.type) {
    case 'commit':
      return { strokes: [...state.strokes, action.stroke], redo: [] };
    case 'undo':
      if (state.strokes.length === 0) return state;
      return {
        strokes: state.strokes.slice(0, -1),
        redo: [...state.redo, state.strokes[state.strokes.length - 1]],
      };
    case 'redo':
      if (state.redo.length === 0) return state;
      return {
        strokes: [...state.strokes, state.redo[state.redo.length - 1]],
        redo: state.redo.slice(0, -1),
      };
    default:
      return state;
  }
}

/**
 * Full-screen object-removal editor (ChatGPT-style): brush over the area you
 * want gone. The image fills the entire screen (full-bleed) and the controls
 * float on top, so the whole screen is the paint canvas. Strokes are captured
 * with PanResponder and drawn as a translucent white mask with a dashed edge; a
 * left slider sets the brush size; Undo/Redo walk the atomic stroke history.
 */
export function AuriaImageRemoveTool({ source, onCancel, onNext }: AuriaImageRemoveToolProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top, insets.bottom), [insets.bottom, insets.top]);

  const [history, dispatch] = useReducer(historyReducer, { strokes: [], redo: [] });
  const { strokes, redo } = history;
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [brushSize, setBrushSize] = useState(34);
  const [cursor, setCursor] = useState<Point | null>(null);

  // Live refs so the PanResponder closures always read fresh values.
  const brushRef = useRef(brushSize);
  brushRef.current = brushSize;
  const currentRef = useRef<Stroke | null>(null);

  const canvasPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        const stroke: Stroke = { points: [{ x, y }], size: brushRef.current };
        currentRef.current = stroke;
        setCurrent(stroke);
        setCursor({ x, y });
      },
      onPanResponderMove: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        const stroke = currentRef.current;
        if (!stroke) return;
        const last = stroke.points[stroke.points.length - 1];
        // Skip near-duplicate points to keep the path light.
        if (last && Math.hypot(x - last.x, y - last.y) < 2) {
          setCursor({ x, y });
          return;
        }
        const next: Stroke = { ...stroke, points: [...stroke.points, { x, y }] };
        currentRef.current = next;
        setCurrent(next);
        setCursor({ x, y });
      },
      onPanResponderRelease: () => {
        const stroke = currentRef.current;
        if (stroke && stroke.points.length > 0) dispatch({ type: 'commit', stroke });
        currentRef.current = null;
        setCurrent(null);
        setCursor(null);
      },
      onPanResponderTerminate: () => {
        currentRef.current = null;
        setCurrent(null);
        setCursor(null);
      },
    }),
  ).current;

  const setBrushFromY = (localY: number) => {
    const clamped = Math.max(0, Math.min(SLIDER_HEIGHT, localY));
    // Top of the track = largest brush, bottom = smallest.
    const ratio = 1 - clamped / SLIDER_HEIGHT;
    setBrushSize(Math.round(BRUSH_MIN + ratio * (BRUSH_MAX - BRUSH_MIN)));
  };

  const sliderPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => setBrushFromY(evt.nativeEvent.locationY),
      onPanResponderMove: (evt) => setBrushFromY(evt.nativeEvent.locationY),
    }),
  ).current;

  const allStrokes = current ? [...strokes, current] : strokes;
  const hasPaint = allStrokes.length > 0;
  const knobTop = (1 - (brushSize - BRUSH_MIN) / (BRUSH_MAX - BRUSH_MIN)) * SLIDER_HEIGHT;

  return (
    <View style={styles.root}>
      {/* Full-screen paint canvas — image fills the whole screen, brush anywhere */}
      <View style={StyleSheet.absoluteFill} {...canvasPan.panHandlers}>
        <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} />
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {allStrokes.map((stroke, i) =>
            stroke.points.length === 1 ? (
              <Circle
                key={`dot-${i}`}
                cx={stroke.points[0].x}
                cy={stroke.points[0].y}
                r={stroke.size / 2}
                fill="rgba(255,255,255,0.40)"
              />
            ) : (
              <Path
                key={`mask-${i}`}
                d={toPath(stroke.points)}
                stroke="rgba(255,255,255,0.40)"
                strokeWidth={stroke.size}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ),
          )}
          {/* Dashed centreline gives the cut-out / lasso feel. */}
          {allStrokes.map((stroke, i) =>
            stroke.points.length > 1 ? (
              <Path
                key={`dash-${i}`}
                d={toPath(stroke.points)}
                stroke="rgba(255,255,255,0.95)"
                strokeWidth={1.5}
                strokeDasharray="7 6"
                strokeLinecap="round"
                fill="none"
              />
            ) : null,
          )}
          {/* Brush cursor while painting. */}
          {cursor ? (
            <Circle
              cx={cursor.x}
              cy={cursor.y}
              r={brushSize / 2}
              fill="rgba(255,255,255,0.18)"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={1.5}
            />
          ) : null}
        </Svg>
      </View>

      {/* Top bar — Cancel · Remove · Next (floats over the image) */}
      <View style={styles.topBar} pointerEvents="box-none">
        <Pressable onPress={onCancel} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel">
          <Text style={styles.topAction}>Cancel</Text>
        </Pressable>
        <Text style={styles.topTitle}>Remove</Text>
        <Pressable
          onPress={() => onNext(hasPaint)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={[styles.topAction, styles.topActionStrong]}>Next</Text>
        </Pressable>
      </View>

      {/* Brush-size slider (left) */}
      <View style={styles.sliderWrap} pointerEvents="box-none">
        <View style={styles.sliderTrack} {...sliderPan.panHandlers}>
          <View style={[styles.sliderKnob, { top: knobTop - 11 }]}>
            <View style={[styles.brushPreview, { width: brushSize, height: brushSize, borderRadius: brushSize / 2 }]} />
          </View>
        </View>
      </View>

      {/* Hint — only before the first stroke. */}
      {!hasPaint ? (
        <View style={styles.hintWrap} pointerEvents="none">
          <View style={styles.hintPill}>
            <Text style={styles.hintText}>Tap what you'd like to remove</Text>
          </View>
        </View>
      ) : null}

      {/* Bottom bar — undo / redo (floats over the image) */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        <Pressable
          onPress={() => dispatch({ type: 'undo' })}
          disabled={strokes.length === 0}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          accessibilityState={{ disabled: strokes.length === 0 }}
          style={({ pressed }) => [styles.bottomButton, pressed && styles.bottomButtonPressed]}
        >
          <AuriaIcon
            name="undo"
            size={AURIA_ICON_SIZE.md}
            color={strokes.length === 0 ? 'rgba(255,255,255,0.4)' : '#FFFFFF'}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable
          onPress={() => dispatch({ type: 'redo' })}
          disabled={redo.length === 0}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Redo"
          accessibilityState={{ disabled: redo.length === 0 }}
          style={({ pressed }) => [styles.bottomButton, pressed && styles.bottomButtonPressed]}
        >
          <AuriaIcon
            name="redo"
            size={AURIA_ICON_SIZE.md}
            color={redo.length === 0 ? 'rgba(255,255,255,0.4)' : '#FFFFFF'}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(topInset: number, bottomInset: number) {
  const scrim = 'rgba(0, 0, 0, 0.34)';
  const control = 'rgba(0, 0, 0, 0.4)';
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
    },
    topBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingTop: topInset + 10,
      paddingBottom: 12,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: scrim,
    },
    topAction: {
      ...auriaTypography.body,
      color: '#FFFFFF',
      fontSize: 17,
    },
    topActionStrong: {
      fontWeight: '600',
    },
    topTitle: {
      ...auriaTypography.title,
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '600',
    },
    sliderWrap: {
      position: 'absolute',
      left: 14,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    sliderTrack: {
      width: 22,
      height: SLIDER_HEIGHT,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
    },
    sliderKnob: {
      position: 'absolute',
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brushPreview: {
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderWidth: 2,
      borderColor: 'rgba(0,0,0,0.25)',
    },
    hintWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: bottomInset + 84,
      alignItems: 'center',
    },
    hintPill: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 18,
    },
    hintText: {
      ...auriaTypography.body,
      color: '#FFFFFF',
      fontSize: 15,
    },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: 14,
      paddingBottom: bottomInset + 18,
      paddingHorizontal: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: scrim,
    },
    bottomButton: {
      width: 56,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: control,
    },
    bottomButtonPressed: {
      opacity: 0.6,
    },
  });
}
