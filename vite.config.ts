import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const githubPagesBase = '/enterprise-data-workbench/';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? githubPagesBase,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    globals: true,
    pool: 'threads',
    testTimeout: 10000,
    setupFiles: './vitest.setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        branches: 65,
        functions: 75,
        lines: 75,
        statements: 75,
      },
      exclude: ['src/main.tsx', 'src/**/*.test.*', 'src/**/*.d.ts', 'src/vite-env.d.ts'],
    },
  },
});
