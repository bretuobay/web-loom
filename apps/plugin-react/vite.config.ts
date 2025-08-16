// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://chatgpt.com/share/e/689ca8ff-fdcc-8005-8414-b2d6e97d0d71
export default defineConfig({
  plugins: [react()] as any,
  build: {
    rollupOptions: {
      // don’t bundle these; use host's copies
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
  // de-dupe if the plugin is linked during local dev
  resolve: { dedupe: ['react', 'react-dom'] },
});
