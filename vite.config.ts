/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // import.meta.dirname, not __dirname: the latter is unsupported by
      // Vite's native config loader (warns today, breaks in a future major).
      '@': path.resolve(import.meta.dirname, 'src'),
      '@contracts': path.resolve(import.meta.dirname, 'contracts'),
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
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
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
