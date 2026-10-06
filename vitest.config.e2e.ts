import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // All files share one database, so run them one after another.
    fileParallelism: false,
    // Use a separate database so tests never touch development data.
    env: { DB_NAME: 'orderhub_test' },
  },
});
