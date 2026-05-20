import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  /*
   * base: './' — REQUIRED for Capacitor.
   * Capacitor serves the Vite build from Android's WebView using the
   * capacitor://localhost origin. Without './', absolute asset paths
   * like /assets/index.js fail. Relative paths work everywhere:
   * web (hosted), Capacitor (file-like), and Firebase Hosting.
   */
  base: './',

  server: {
    host: true,   // expose on LAN — lets you test on real device via IP during dev
    port: 5173,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,   // disable sourcemaps for production APK (smaller bundle)
  },
});
