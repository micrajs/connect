import {defineConfig} from '@micra/vite-config/library';
import {cwd} from '@micra/vite-config/utilities/cwd';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['@micra/error'],
      input: {
        index: cwd('index.ts'),
      },
    },
  },

  test: {
    coverage: {
      exclude: ['**/*.test.ts', '**/.*.ts'],
    },
  },
});
