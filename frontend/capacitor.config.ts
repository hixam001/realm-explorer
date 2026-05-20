import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  /*
   * appId must be a reverse-DNS identifier — used as the Android package name.
   * Change YOUR_DOMAIN to something you own, e.g. com.yourname.realmexplorer
   */
  appId: 'com.realmexplorer.app',
  appName: 'Realm Explorer',

  /*
   * webDir: points to the Vite build output.
   * 'npx cap sync' will copy this directory into the Android project.
   */
  webDir: 'dist',

  server: {
    /*
     * androidScheme: 'https' makes the WebView use https://localhost instead of
     * file://. Required for modern web APIs (localStorage, Web Crypto, etc.)
     * to work inside the Android WebView — they're blocked on file:// origin.
     */
    androidScheme: 'https',
    allowNavigation: [],
  },

  android: {
    /*
     * backgroundColor: shown while the WebView is loading.
     * Matches the app's bg-black outer background.
     */
    backgroundColor: '#000000',

    /*
     * allowMixedContent: false — ensures only HTTPS content loads (security).
     * Set to true only if your backend API doesn't have SSL during development.
     */
    allowMixedContent: false,
  },

  plugins: {
    /*
     * SplashScreen: keeps the splash visible until the React app calls
     * SplashScreen.hide(). Without this, the splash dismisses immediately
     * and the user sees a white flash before the app renders.
     */
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },

    /*
     * StatusBar: overlays the status bar so the app bleeds edge-to-edge
     * (matches the iOS viewport-fit=cover behaviour).
     */
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#00000000',
      overlaysWebView: true,
    },
  },
};

export default config;
