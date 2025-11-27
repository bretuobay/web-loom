import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@web-loom/mvvm-core', '@web-loom/ui-core', '@web-loom/ui-patterns'],
  },
});
