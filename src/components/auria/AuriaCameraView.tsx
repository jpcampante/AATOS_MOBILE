import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auriaTypography, myceoCornerStyle, useTheme } from '../../theme';
import { AuriaIcon, AURIA_ICON_SIZE } from '../icons';

type AuriaCameraViewProps = {
  visible: boolean;
  onClose: () => void;
  /** Called with the captured photo URI. */
  onCapture: (uri: string) => void;
};

/** Full-screen custom camera (ChatGPT-style): capture + a 3-dots menu that
 *  reveals flash / flip / close. Uses expo-camera's CameraView (works in Expo Go). */
export function AuriaCameraView({ visible, onClose, onCapture }: AuriaCameraViewProps) {
  const insets = useSafeAreaInsets();
  const { ds, theme } = useTheme();
  const styles = useMemo(() => createStyles(ds, theme, insets.top, insets.bottom), [
    ds,
    insets.bottom,
    insets.top,
    theme,
  ]);

  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);

  // Ask for camera access the first time the sheet opens.
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
    if (!visible) {
      setOptionsOpen(false);
    }
  }, [permission, requestPermission, visible]);

  const capture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) onCapture(photo.uri);
    } catch {
      // swallow — closing is handled by the caller
    } finally {
      setCapturing(false);
    }
  };

  const toggleFlash = () =>
    setFlash((f) => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'));
  const flipCamera = () => setFacing((f) => (f === 'back' ? 'front' : 'back'));

  const granted = permission?.granted === true;

  // Unmount entirely when closed so expo-camera releases the camera hardware.
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <StatusBar style="light" />
      <View style={styles.root}>
        <View style={styles.cameraCard}>
          {granted ? (
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />
          ) : (
            <View style={styles.permission}>
              <AuriaIcon name="camera" size={36} color="#FFFFFF" />
              <Text style={styles.permissionText}>
                {permission && !permission.canAskAgain
                  ? 'Camera access is off. Enable it in Settings to take photos.'
                  : 'Allow camera access to take a photo.'}
              </Text>
              {permission?.canAskAgain !== false ? (
                <Pressable style={styles.permissionBtn} onPress={() => void requestPermission()}>
                  <Text style={styles.permissionBtnText}>Allow camera</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {/* Right-side options revealed by the 3-dots button (flash / flip / close). */}
          {optionsOpen ? (
            <View style={styles.optionsColumn}>
              <Pressable
                style={styles.optionButton}
                onPress={toggleFlash}
                accessibilityRole="button"
                accessibilityLabel={`Flash ${flash}`}
              >
                <AuriaIcon
                  name={flash === 'off' ? 'boltSlash' : 'bolt'}
                  size={AURIA_ICON_SIZE.md}
                  color="#FFFFFF"
                />
              </Pressable>
              <Pressable
                style={styles.optionButton}
                onPress={flipCamera}
                accessibilityRole="button"
                accessibilityLabel="Flip camera"
              >
                <AuriaIcon name="arrowPath" size={AURIA_ICON_SIZE.md} color="#FFFFFF" />
              </Pressable>
              <Pressable
                style={styles.optionButton}
                onPress={() => setOptionsOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close options"
              >
                <AuriaIcon name="close" size={AURIA_ICON_SIZE.md} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}

          {/* Bottom control bar: back · capture · more. */}
          <View style={styles.controls}>
            <Pressable
              style={styles.sideButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close camera"
            >
              <AuriaIcon name="chevronLeft" size={AURIA_ICON_SIZE.md} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
              onPress={capture}
              disabled={!granted || capturing}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <View style={styles.shutterInner}>
                {capturing ? <ActivityIndicator color="#111111" /> : null}
              </View>
            </Pressable>

            <Pressable
              style={[styles.sideButton, optionsOpen && styles.sideButtonActive]}
              onPress={() => setOptionsOpen((o) => !o)}
              accessibilityRole="button"
              accessibilityLabel="Camera options"
            >
              <AuriaIcon name="moreHorizontal" size={AURIA_ICON_SIZE.md} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  ds: ReturnType<typeof useTheme>['ds'],
  theme: ReturnType<typeof useTheme>['theme'],
  topInset: number,
  bottomInset: number,
) {
  const control = 'rgba(0, 0, 0, 0.45)';
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: ds.gray50,
      paddingTop: topInset + 64,
      paddingBottom: bottomInset + 16,
      paddingHorizontal: 12,
    },
    cameraCard: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: '#000000',
      ...myceoCornerStyle('page'),
    },
    permission: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingHorizontal: 32,
    },
    permissionText: {
      ...auriaTypography.body,
      color: '#FFFFFF',
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 21,
    },
    permissionBtn: {
      marginTop: 4,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
    },
    permissionBtnText: {
      ...auriaTypography.body,
      color: '#111111',
      fontSize: 15,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    optionsColumn: {
      position: 'absolute',
      right: 16,
      bottom: 120,
      gap: 14,
      alignItems: 'center',
    },
    optionButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: control,
    },
    controls: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 28,
    },
    sideButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: control,
    },
    sideButtonActive: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    shutter: {
      width: 74,
      height: 74,
      borderRadius: 37,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    shutterPressed: {
      transform: [{ scale: 0.94 }],
    },
    shutterInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
