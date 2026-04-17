import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts', 'app/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        'app/**/page.tsx',
        'app/**/layout.tsx',
        // API route handlers require a Next.js request context; covered by
        // future integration tests (stage 3.4+), not unit tests here.
        'app/api/**/route.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
})
