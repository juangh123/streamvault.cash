import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = (id: string, name: string) => new RegExp(`[\\\\/]${name}[\\\\/]`).test(id);

export default defineConfig({
  plugins: [react()],
  // cashscript/@bitauth-libauth rely on top-level await, which needs a modern target.
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split the heavy crypto/wallet libraries so the initial cockpit bundle stays lean.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (pkg(id, '@bitauth')) return 'libauth';
          if (pkg(id, 'cashscript') || pkg(id, '@cashscript') || pkg(id, 'electrum-cash')) return 'cashscript';
          if (pkg(id, '@wizardconnect')) return 'wizardconnect';
          if (pkg(id, 'react') || pkg(id, 'react-dom') || pkg(id, 'scheduler')) return 'react';
          return 'vendor';
        },
      },
    },
  },
  esbuild: {
    target: 'es2022',
  },
  optimizeDeps: {
    esbuildOptions: { target: 'es2022' },
  },
  server: {
    port: 5173,
    host: true,
  },
});