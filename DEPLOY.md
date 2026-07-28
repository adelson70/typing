# Deploy na Cloudflare (Workers + assets estáticos)

Mesmo fluxo do [qrcodehub](https://github.com/adelson70/qrcodehub): site Astro 100% estático, `dist/` publicado como **assets** de um Worker, **sem** script Worker nem adapter SSR.

## Dashboard (Git → Worker)

| Campo | Valor |
|--------|--------|
| Build command | `pnpm run build` |
| Deploy command | `pnpm exec wrangler deploy` ou `npx wrangler deploy` |
| Root directory | `/` |

Não há campo “Build output directory”: o caminho está em `wrangler.jsonc` → `assets.directory` = `./dist`.

O `name` em `wrangler.jsonc` (`typing`) deve ser **igual** ao nome do Worker no dashboard.

Node: `.nvmrc` / `.node-version` com `22`. pnpm: `packageManager` no `package.json`.

## Por que `wrangler deploy` deixava de falhar

O erro *Missing entry-point to Worker script or to assets directory* aparece quando se roda `wrangler deploy` **sem** `[assets]` no Wrangler. Com `wrangler.jsonc` (como no qrcodehub), o deploy envia `dist/` corretamente.

**Não** use `wrangler pages deploy` neste projeto — o pipeline do dashboard é Worker + deploy command, não Pages com output directory vazio.

## CLI local

```bash
pnpm run build
pnpm exec wrangler login   # uma vez
pnpm run deploy
```

## Headers e redirects

`public/_headers` e `public/_redirects` vão para `dist/` no build e são aplicados pelo Wrangler. Para testar como em produção:

```bash
pnpm run build
pnpm run preview:cf
```

(`astro preview` não aplica `_headers`.)

## Domínio

Canônico: **`https://typing.abjr.dev`** (`SITE_URL` / `SITE_HOST` em `src/constants/site.ts`).

No dashboard da Cloudflare, o domínio customizado deve ser **`typing.abjr.dev`** — **não** `typings.abjr.dev`.

Redirecionar `typings.abjr.dev` → `typing.abjr.dev` **não** pode ir em `public/_redirects` (o Workers só aceita URLs relativas). Use **Rules → Redirect Rules** (ou remova o hostname errado em **Domains & Routes**).

Após o deploy, envie `https://typing.abjr.dev/sitemap.xml` no Search Console.
