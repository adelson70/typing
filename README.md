# Typing Studio

A typing test and practice platform that runs entirely in the browser. No backend, no database, no accounts, no API — every result is stored on the visitor's own device.

Built with Astro 7, React 19 (islands only), TypeScript in strict mode, and Tailwind CSS 4.

## Quick start

```bash
pnpm install
pnpm dev         # http://localhost:4321
```

> `pnpm-workspace.yaml` approves esbuild's postinstall script. Without it,
> `pnpm install` exits 1 with `ERR_PNPM_IGNORED_BUILDS` and `pnpm dev` never
> reaches Astro.

| Command | Purpose |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` | Static production build to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm check` | TypeScript + Astro diagnostics |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm verify` | check → test → build, in that order |
| `node scripts/audit-seo.mjs` | Audit the built HTML for SEO regressions |

`pnpm verify` followed by the SEO audit is the full gate before deploying.

## Before going live

The production domain and AdSense publisher ID live in **`src/constants/site.ts`** (`SITE_URL`, `ADSENSE_CLIENT_ID`). Every canonical, hreflang, Open Graph URL, sitemap entry and JSON-LD node derives from them.

The only outstanding item is assets: real icons in `public/icons/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`), a `public/favicon.svg` and `public/favicon.ico`, and an Open Graph image at `public/og/default.png` (1200×630).

## Deploying to Cloudflare Pages

Connect the repository, then use these settings:

| Setting | Value |
|---|---|
| Framework preset | None (or Astro) |
| Build command | `pnpm run build` |
| Build output directory | `dist` (also in `wrangler.toml` as `pages_build_output_dir`) |
| **Deploy command** | **Leave empty** — Pages publishes `dist/` after the build |
| Node.js | **22** (`.nvmrc`; optional `NODE_VERSION=22` on Pages) |
| Package manager | pnpm (`pnpm-lock.yaml`; optional pin `PNPM_VERSION=10.33.0` to match `packageManager`) |

No adapter is needed. `@astrojs/cloudflare` is only for SSR; this is a static build, so Cloudflare simply uploads `dist/`.

**Do not** set the deploy command to `npx wrangler deploy` — that targets Workers, not static Pages, and fails after a successful build. See [DEPLOY.md](./DEPLOY.md).

**Local parity with production headers:** after `pnpm build`, run `pnpm pages:dev` to serve `dist/` through Wrangler (applies `public/_headers` the same way Pages does).

**CLI deploy** (after `wrangler login`): `pnpm build && pnpm deploy` — uses `wrangler pages deploy` and `wrangler.toml`. Set `name` to your Pages project slug if it differs from `typing`.

`public/_headers` and `public/_redirects` are copied to the root of `dist/` and applied automatically. The headers file sets immutable caching on fingerprinted assets, `no-store` on the service worker, and baseline security headers site-wide.

**`src/pages/404.astro` must not be deleted.** Without a top-level `404.html`, Cloudflare Pages assumes the project is a single-page application and serves the homepage for every unmatched URL — which would produce unbounded duplicate content.

After the first deploy, submit `https://typing.abjr.dev/sitemap.xml` to Google Search Console.

The build is plain static output, so any other host (Netlify, Vercel, S3) also works — only the `_headers` and `_redirects` files are Cloudflare-specific.

## Architecture

```
src/
  components/     Presentational Astro components (ads, seo, layout, ui, content)
  constants/      Site config, i18n registry, storage keys
  content/blog/   Markdown articles (the blog content collection)
  data/           Page registry, lessons, blog categories, route allow-list
  features/       Vertical slices: typing engine, statistics
  i18n/           UI string dictionaries
  layouts/        BaseLayout — the single HTML shell
  lib/            Small shared helpers
  pages/          Routes (mostly thin; content comes from data/)
  seo/            JSON-LD builders
  services/       Storage: IndexedDB and LocalStorage
  styles/         global.css — all design tokens live here
  types/          Shared type definitions
```

### The two rules that matter

**1. Pages are data, not files.** A landing page is an entry in `src/data/pages.ts`. The catch-all route `src/pages/[...page].astro` renders every one of them in both locales. Adding a page means appending one object — routing, metadata, breadcrumbs, FAQ schema, sitemap inclusion and internal links all follow automatically. This is what lets the site grow to hundreds of pages without touching the architecture.

**2. Every visual value is a token.** `src/styles/global.css` holds the entire design system in one `@theme` block. No component hardcodes a colour, size, radius or duration. Replacing the token values re-skins the whole application without touching markup — which is how a design handoff gets applied without rework.

### Typing engine

`src/features/typing/domain/` is a pure state machine: no React, no timers, no DOM. The caller supplies timestamps, which makes every transition deterministic and testable.

- `metrics.ts` — WPM, accuracy and consistency calculations
- `engine.ts` — the keystroke reducer
- `generator.ts` — seeded word generation

One rule worth knowing: **a character's score is fixed when it is typed.** Backspacing to fix a mistake restores the display, but the original error still counts against accuracy. Otherwise accuracy would measure diligence at correcting rather than typing skill. This is enforced by a test.

The daily challenge uses a seed derived from the UTC date, so every visitor worldwide gets an identical prompt with no server involved.

### Hydration policy

Astro renders everything to static HTML. React is loaded only where genuine interactivity exists:

- `TypingArena` — `client:load` (it is the page's purpose and sits above the fold)
- `StatisticsDashboard` — `client:only="react"` (reads IndexedDB; has no meaningful server-rendered form)

Navigation, the mobile menu, the theme toggle and the FAQ accordion are all HTML and CSS with no framework runtime. That is deliberate: those appear on every page, and a framework there would be paid for site-wide.

## SEO

Every page passes `SeoMeta` to `BaseLayout` and receives title, description, canonical, hreflang, Open Graph, Twitter, robots, theme colour and language tags from one route key. Pages never hand-write meta tags, which is what guarantees no duplicated metadata as the site scales.

**Structured data** is built by pure functions in `src/seo/jsonld.ts` — `Organization` and `WebSite` (with `SearchAction`) are emitted site-wide; pages add `WebApplication`, `BreadcrumbList`, `FAQPage`, `BlogPosting` or `CollectionPage`.

**Internal linking** is explicit rather than computed. Each page declares `related` and `relatedArticles`, and tests enforce that every page has at least three links, that no link is broken, and that no page is orphaned.

**Verification.** `src/data/pages.test.ts` checks the SEO contract at the source level (unique titles and descriptions per locale, SERP length limits, FAQ depth, link graph integrity). `scripts/audit-seo.mjs` checks the emitted HTML — a component can typecheck perfectly and still ship a page with a duplicate canonical, and only inspecting the build output catches that.

### i18n

English is served from the root (`/`), Portuguese from `/pt-br/`. Adding a locale means adding an entry to `src/constants/i18n.ts` and a dictionary in `src/i18n/translations.ts`; routing, hreflang, canonicals and sitemap localisation all derive from that registry.

`TranslationKey` is derived from the English dictionary and every other locale is typed against it, so a missing translation is a build error rather than a blank space in production.

## Adding content

**A landing page:** append an object to `LANDING_PAGES` in `src/data/pages.ts` with content for both locales, at least three `related` route keys and three `relatedArticles`. Run `pnpm test` — the registry tests will tell you if anything is missing or duplicated.

**A blog article:** create `src/content/blog/<slug>.md` with the frontmatter defined in `src/content.config.ts`. The schema enforces title length (10–70), description length (50–165), a known category, and at least one `relatedPages` entry — an article that recommends no tool is a dead end in the link graph.

**A new route that is not a landing page:** add its key to `STATIC_ROUTE_KEYS` in `src/data/routes.ts` so internal-link validation recognises it.

## Privacy and storage

There is no server component, so there is nothing to breach. Settings live in `localStorage` (synchronous, read before first paint); test history, daily rollups and achievements live in IndexedDB.

Both layers fail safe. Safari private mode throws on write, storage can be full, and users can disable it entirely — every operation degrades to in-memory behaviour rather than propagating an error, because a settings write must never break a typing test.

## Analytics

No analytics is bundled. The `<head>` is assembled in one place (`src/components/seo/Seo.astro`), so adding GA4, GTM or Clarity is a single insertion point. Load any such script with `async` and after the fonts, so it cannot delay first paint.
