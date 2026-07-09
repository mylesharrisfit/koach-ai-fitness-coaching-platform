/* Minimal Vite config for the dark-mode audit harness: React + path alias
 * only (no base44 plugin), with auth/data modules aliased to local mocks. */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

export default defineConfig({
  root,
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: [
      // mocks must resolve before the generic @/ alias
      { find: '@/lib/AuthContext', replacement: path.resolve(root, 'darkmode-audit/mocks/AuthContext.jsx') },
      { find: '@/api/base44Client', replacement: path.resolve(root, 'darkmode-audit/mocks/base44Client.js') },
      { find: '@', replacement: path.resolve(root, 'src') },
    ],
  },
  server: { port: 5199, strictPort: true },
});
