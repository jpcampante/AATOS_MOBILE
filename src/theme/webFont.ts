import { Platform } from 'react-native';

/**
 * Loads the brand font (DM Sans) on web so the mobile app matches the AATOS
 * web app, which serves the same Google Fonts variable family. Idempotent and
 * a no-op on native (system font is used there until DM Sans is bundled).
 *
 * @see web-reference/index.html — same DM Sans Google Fonts request.
 */
export function ensureWebBrandFont() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('aatos-dm-sans')) return;

  const preconnectGoogle = document.createElement('link');
  preconnectGoogle.rel = 'preconnect';
  preconnectGoogle.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnectGoogle);

  const preconnectStatic = document.createElement('link');
  preconnectStatic.rel = 'preconnect';
  preconnectStatic.href = 'https://fonts.gstatic.com';
  preconnectStatic.crossOrigin = 'anonymous';
  document.head.appendChild(preconnectStatic);

  const link = document.createElement('link');
  link.id = 'aatos-dm-sans';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,500&display=swap';
  document.head.appendChild(link);

  // react-native-web stamps a system font-family onto each Text/Pressable/
  // TextInput element, so an inline fontFamily alone doesn't cover text that
  // isn't styled through auriaTypography. Enforce the brand font app-wide.
  const base = document.createElement('style');
  base.id = 'aatos-dm-sans-base';
  base.textContent =
    ':root{--aatos-font:"DM Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    'div,span,p,h1,h2,h3,h4,h5,h6,button,input,textarea,select,a,li{font-family:var(--aatos-font)!important}';
  document.head.appendChild(base);
}
