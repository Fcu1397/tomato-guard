import { defineConfig } from 'vite';
// @ts-ignore
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const outDir = resolve(__dirname, 'dist');

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        },
        {
          src: 'src/assets/icons',
          dest: 'assets'
        },
        {
          src: 'src/content/overlay.css',
          dest: 'assets'
        },
        {
          src: 'src/content/blue-screen.css',
          dest: 'assets'
        }
      ]
    })
  ],
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content-script': resolve(__dirname, 'src/content/inject.ts'),
        'blue-screen-script': resolve(__dirname, 'src/content/blue-screen-inject.ts'),
        'fireworks-script': resolve(__dirname, 'src/content/fireworks-inject.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'service-worker') {
            return 'service-worker.js';
          }
          if (chunk.name === 'content-script') {
            return 'content-script.js';
          }
          if (chunk.name === 'blue-screen-script') {
            return 'blue-screen-script.js';
          }
          if (chunk.name === 'fireworks-script') {
            return 'fireworks-script.js';
          }
          return 'assets/js/[name].js';
        },
        chunkFileNames: `assets/js/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
