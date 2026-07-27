import type { APIRoute } from 'astro';

import { SITE_NAME, THEME_COLOR_DARK } from '@/constants/site';

/**
 * PWA manifest, generated so name and theme colour stay bound to the site
 * constants rather than being duplicated in a static file that drifts.
 */
export const GET: APIRoute = () => {
  const manifest = {
    name: `${SITE_NAME} — Typing Practice`,
    short_name: SITE_NAME,
    description:
      'Free typing tests, lessons and practice. Works offline, stores nothing on a server.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: THEME_COLOR_DARK,
    theme_color: THEME_COLOR_DARK,
    categories: ['education', 'productivity', 'utilities'],
    lang: 'en-US',
    dir: 'ltr',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Typing Test', url: '/typing-test/' },
      { name: 'Daily Challenge', url: '/daily-challenge/' },
      { name: 'Statistics', url: '/statistics/' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
