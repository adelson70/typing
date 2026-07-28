# Deploy na Cloudflare Pages

Site Astro 100% estático: `pnpm run build` gera `dist/`, depois `wrangler pages deploy dist` publica no projeto Pages **typing**.

## Dashboard (Git → Pages)

| Campo | Valor |
|--------|--------|
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` ou `npx wrangler pages deploy dist` |
| Root directory | `/` (vazio) |

O slug do projeto Pages deve ser **`typing`** (igual ao `name` em `wrangler.toml`).

**Não** use `npx wrangler deploy` — isso é comando de **Worker**. Em projeto Pages o Wrangler avisa e falha com *Missing entry-point*.

Node: `.nvmrc` / `.node-version` com `22`. pnpm: `packageManager` no `package.json`.

## CLI local

```bash
pnpm run build
pnpm exec wrangler login   # uma vez
pnpm run deploy
```

## Headers e redirects

`public/_headers` e `public/_redirects` vão para `dist/` no build. Para testar com o runtime da Cloudflare:

```bash
pnpm run build
pnpm run preview:cf
```

(`astro preview` não aplica `_headers`.)

## Domínio

Canônico: **`https://typing.abjr.dev`** (`SITE_URL` / `SITE_HOST` em `src/constants/site.ts`).

No dashboard, o domínio customizado deve ser **`typing.abjr.dev`** — **não** `typings.abjr.dev`.

Redirecionar `typings.abjr.dev` → `typing.abjr.dev` use **Rules → Redirect Rules** (ou remova o hostname errado em **Domains & Routes**).

Após o deploy, envie `https://typing.abjr.dev/sitemap.xml` no Search Console.
