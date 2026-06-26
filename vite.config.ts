import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, 'src/newtab/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        settings: resolve(__dirname, 'src/settings/index.html'),
        blockpage: resolve(__dirname, 'src/blockpage/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
