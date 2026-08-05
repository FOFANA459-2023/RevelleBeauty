import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@contracts': path.resolve(__dirname, '../contracts'),
    },
  },
  server: {
    port: 5173,
    // Same-origin dev: no CORS preflight, admin httpOnly cookie just works.
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: false },
      '/uploads': { target: 'http://localhost:4000', changeOrigin: false },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (/react-router|react-dom|\/react\//.test(id)) return 'react-vendor';
            if (id.includes('@tanstack')) return 'query';
          }
          return undefined;
        },
      },
    },
  },
});
