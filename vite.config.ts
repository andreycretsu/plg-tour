import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      writeBundle() {
        const distDir = resolve(__dirname, 'dist');
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        
        // Copy manifest
        copyFileSync(
          resolve(__dirname, 'public/manifest.json'),
          resolve(distDir, 'manifest.json')
        );
        
        // Copy popup HTML
        const popupDir = resolve(distDir, 'popup');
        if (!existsSync(popupDir)) {
          mkdirSync(popupDir, { recursive: true });
        }
        copyFileSync(
          resolve(__dirname, 'src/popup/index.html'),
          resolve(popupDir, 'index.html')
        );
        
        // Copy icons (if they exist)
        const icons = ['icon16.png', 'icon48.png', 'icon128.png', 'icon16.svg', 'icon48.svg', 'icon128.svg'];
        icons.forEach(icon => {
          const src = resolve(__dirname, 'public', icon);
          const dest = resolve(distDir, icon);
          try {
            if (existsSync(src)) {
              copyFileSync(src, dest);
            }
          } catch (e) {
            // Icon file doesn't exist, skip
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/index.tsx'),
        background: resolve(__dirname, 'src/background/index.ts'),
        popup: resolve(__dirname, 'src/popup/popup.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
