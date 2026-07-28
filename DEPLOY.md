# Deploy na Cloudflare (Workers + assets estáticos)

Mesmo fluxo do [qrcodehub](https://github.com/adelson70/qrcodehub) e **flags**: site Astro 100% estático, `dist/` publicado como **assets** de um **Worker**, sem adapter SSR.

## Por que o typing “não funcionava” e os outros sim

| Projeto | Tipo no dashboard Cloudflare | Deploy |
|---------|------------------------------|--------|
| qrcodehub, flags, midiatools | **Worker** (`wrangler deploy`) | `npx wrangler deploy` |
| typing (antes) | **Pages** (`pages/projects/typing`) | `wrangler deploy` quebrava; `pages deploy` pedia token de Pages |

O repositório do typing chegou a misturar os dois modelos. Os outros **nunca** foram projeto Pages — por isso `wrangler deploy` + `wrangler.jsonc` com `[assets]` funciona lá.

**Este repo segue o modelo Worker.** No dashboard, o Git deve estar em **Workers & Pages → Workers → `typing` → Builds**, não no projeto **Pages** chamado `typing`.

## Dashboard (Git → Worker)

| Campo | Valor |
|--------|--------|
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` ou `npx wrangler deploy` |
| Root directory | `/` |

`assets.directory` = `./dist` em `wrangler.jsonc`. O `name` (`typing`) deve ser **igual** ao nome do **Worker** no dashboard.

**Não** use `wrangler pages deploy` neste projeto.

**Não** use `npx wrangler deploy` num projeto ligado só como **Pages** — o Wrangler avisa e falha.

### Token / auth no CI

Se existir `CLOUDFLARE_API_TOKEN` nas variáveis do build:

- Para **Worker**: permissões **Workers Scripts → Edit** (template “Edit Cloudflare Workers”) costuma bastar.
- Erro em `/pages/projects/typing` = você estava no fluxo **Pages**; com Worker o endpoint é outro.

Se o build for o Git **nativo da Cloudflare no Worker**, muitas vezes **não** precisa de token manual — remova `CLOUDFLARE_API_TOKEN` se estiver com escopo errado.

## CLI local

```bash
pnpm run build
pnpm exec wrangler login   # uma vez
pnpm run deploy
```

## Headers e redirects

`public/_headers` e `public/_redirects` vão para `dist/` e são aplicados pelo Wrangler:

```bash
pnpm run build
pnpm run preview:cf
```

## Domínio

Canônico: **`https://typing.abjr.dev`** (`SITE_URL` / `SITE_HOST` em `src/constants/site.ts`).

Domínio customizado no Worker **`typing`**: **`typing.abjr.dev`** (não `typings.abjr.dev`).

Após o deploy, envie `https://typing.abjr.dev/sitemap.xml` no Search Console.
