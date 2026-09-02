import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Build before tests so the bin/ entrypoint resolves to a real
    // dist/index.js. Tests spawn `node apps/cli/bin/package-cli.mjs`,
    // which imports `../dist/index.js`. Without this hook, the first
    // invocation in CI fails with "Cannot find module".
    globalSetup: ['./tests/global-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'json', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      reportOnFailure: true,
    },
  },
});
