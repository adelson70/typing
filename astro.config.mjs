// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { DEFAULT_LOCALE, LOCALES, SITEMAP_LOCALE_MAP } from './src/constants/i18n.ts';
import { SITE_URL } from './src/constants/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',

  // Emit `/page/index.html` so every URL has exactly one canonical spelling
  // (with a trailing slash), matching `absoluteUrl()` in constants/site.ts.
  trailingSlash: 'always',
  build: { format: 'directory' },

  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: {
      // English lives at `/`, Portuguese at `/pt-br/`.
      prefixDefaultLocale: false,
    },
  },

  // Self-hosted, preloaded, zero render-blocking. Stable API in Astro 7.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400, 500, 700],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],

  integrations: [
    react(),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: SITEMAP_LOCALE_MAP,
      },
      filter: (page) => !page.includes('/internal/') && !page.includes('/404'),
      changefreq: 'weekly',
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Long-cache immutable assets; Astro fingerprints filenames.
      assetsInlineLimit: 2048,
    },
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
