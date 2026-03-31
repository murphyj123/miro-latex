import { resolve } from 'path';
import { defineConfig } from 'vite';

const root = 'front/';

export default defineConfig({
  root,
  build: {
    outDir: '../dist/',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, root, 'index.html'),
        app: resolve(import.meta.dirname, root, 'app.html'),
        modal: resolve(import.meta.dirname, root, 'modal.html'),
        privacy: resolve(import.meta.dirname, root, 'privacy.html'),
      },
    },
  },
});
