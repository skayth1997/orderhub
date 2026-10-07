import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],

    fileParallelism: false,

    env: { DB_NAME: 'orderhub_test' },
  },
});
