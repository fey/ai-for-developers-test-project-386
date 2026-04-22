import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'frontend',
  plugins: [react()],
  build: {
    outDir: '../frontend-dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    allowedHosts: true,
    host: true,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    include: ['../test/**/*.test.ts'],
  },
});
