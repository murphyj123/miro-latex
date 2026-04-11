import { resolve } from 'path';
import { defineConfig } from 'vite';

const root = 'apps/';

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
        'axes-index': resolve(import.meta.dirname, root, 'axes/index.html'),
        'axes-app': resolve(import.meta.dirname, root, 'axes/app.html'),
        'axes-panel': resolve(import.meta.dirname, root, 'axes/panel.html'),
        'templates-index': resolve(import.meta.dirname, root, 'templates/index.html'),
        'templates-app': resolve(import.meta.dirname, root, 'templates/app.html'),
        'templates-panel': resolve(import.meta.dirname, root, 'templates/panel.html'),
        'bansho-index': resolve(import.meta.dirname, root, 'bansho/index.html'),
        'bansho-panel': resolve(import.meta.dirname, root, 'bansho/panel.html'),
        'bansho-app':   resolve(import.meta.dirname, root, 'bansho/app.html'),
        'timer-index': resolve(import.meta.dirname, root, 'timer/index.html'),
        'timer-panel': resolve(import.meta.dirname, root, 'timer/panel.html'),
        'timer-modal': resolve(import.meta.dirname, root, 'timer/modal.html'),
        'timer-exam': resolve(import.meta.dirname, root, 'timer/exam.html'),
        'timer-cards': resolve(import.meta.dirname, root, 'timer/cards.html'),
      },
    },
  },
});
