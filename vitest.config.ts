import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Vitest does not read `tsconfig.json` path aliases, so they are mirrored here.
 * Keep in sync with the `paths` block in tsconfig.json.
 */
const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      '@components': resolvePath('./src/components'),
      '@features': resolvePath('./src/features'),
      '@layouts': resolvePath('./src/layouts'),
      '@lib': resolvePath('./src/lib'),
      '@hooks': resolvePath('./src/hooks'),
      '@services': resolvePath('./src/services'),
      '@stores': resolvePath('./src/stores'),
      '@utils': resolvePath('./src/utils'),
      '@constants': resolvePath('./src/constants'),
      '@seo': resolvePath('./src/seo'),
      '@data': resolvePath('./src/data'),
    },
  },
  test: {
    // Domain logic is environment-free; jsdom is opted into per-file when a
    // component test needs it.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
  },
});
