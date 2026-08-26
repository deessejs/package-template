import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'json', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      // No numeric thresholds — we want a visual signal, not a gate.
      // The `threshold-icons` input in .github/workflows/coverage.yml
      // supplies the icon mapping.
      reportOnFailure: true,
    },
  },
});
