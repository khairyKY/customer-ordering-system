import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use the automatic JSX runtime — no need for `import React` in every file
      jsxRuntime: 'automatic',
    }),
  ],
  server: {
    // Keep Vite from picking a random port
    strictPort: false,
  },
});
