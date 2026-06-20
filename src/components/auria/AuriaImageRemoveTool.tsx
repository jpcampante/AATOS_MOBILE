import { useMemo, useReducer, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
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
 * want gone. Strokes are captured with PanResponder and drawn as a translucent
 * white mask with a dashed edge. A left-side slider sets the brush size, and
 * Undo/Redo walk the stroke history. "Next" hands the mask back to the caller.
 *
 * Once the image reports its size (onLoad), the image + SVG overlay are sized to
 * the image's *contained* rect so the brush only paints over the visible photo
 * (never the black letterbox bars). Before that, it gracefully falls back to a
 * full-canvas contain image so painting still works.
 */
export function AuriaImageRemoveTool({ source, onCancel, onNext }: AuriaImageRemoveToolProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(insets.top, insets.bottom), [insets.bottom, insets.top]);

  const [history, dispatch] = useReducer(historyReducer, { strokes: [], redo: [] });
  const { strokes, redo } = history;
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [brushSize, setBrushSize] = useState(34);
  const [cursor, setCursor] = useState<Point | null>(null);

  // Canvas (visible area) + image intrinsic size → the contained image rect.
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const onImageLoad = (e: { nativeEvent?: { source?: { width?: number; height?: number } } }) => {
    const s = e?.nativeEvent?.source;
    if (s?.width && s?.height) setNaturalSize({ w: s.width, h: s.height });
  };

  const rect = useMemo(() => {
    if (!canvasSize || !naturalSize || naturalSize.w <= 0 || naturalSize.h <= 0) return null;
    const scale = Math.min(canvasSize.w / naturalSize.w, canvasSize.h / naturalSize.h);
    return { w: Math.round(naturalSize.w * scale), h: Math.round(naturalSize.h * scale) };
  }, [canvasSize, naturalSize]);

  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    const h = Math.round(e.nativeEvent.layout.height);
    setCanvasSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
  };

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
    <View style={styles.root} accessibilityViewIsModal>
      {/* Top bar — Cancel · Remove · Next */}
      <View style={styles.topBar}>
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

      {/* Canvas — the contained image + brushed mask, centred in the safe area */}
      <View style={styles.canvas} onLayout={onCanvasLayout}>
        <View
          style={rect ? [styles.imageBox, { width: rect.w, height: rect.h }] : StyleSheet.absoluteFill}
          {...canvasPan.panHandlers}
        >
          <Image
            source={source}
            resizeMode={rect ? 'cover' : 'contain'}
            style={StyleSheet.absoluteFill}
            onLoad={onImageLoad}
          />
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
            <Text style={styles.hintText}>Tap what you'd like to remove</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom bar — undo / redo */}
      <View style={styles.bottomBar}>
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
            color={strokes.length === 0 ? 'rgba(255,255,255,0.32)' : '#FFFFFF'}
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
            color={redo.length === 0 ? 'rgba(255,255,255,0.32)' : '#FFFFFF'}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(topInset: number, bottomInset: number) {
  return StyleSheet.create({
    root: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
    },
    topBar: {
      paddingTop: topInset + 10,
      paddingBottom: 12,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#0B0B0C',
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
    canvas: {
      flex: 1,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageBox: {
      overflow: 'hidden',
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
      backgroundColor: 'rgba(255,255,255,0.14)',
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
      bottom: 24,
      alignItems: 'center',
    },
    hintText: {
      ...auriaTypography.body,
      color: 'rgba(255,255,255,0.82)',
      fontSize: 15,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    bottomBar: {
      paddingTop: 14,
      paddingBottom: bottomInset + 18,
      paddingHorizontal: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#0B0B0C',
    },
    bottomButton: {
      width: 52,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomButtonPressed: {
      opacity: 0.6,
    },
  });
}
