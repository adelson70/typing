# Deploy no Cloudflare Pages

Este site é **Astro estático** (`output: 'static'`). O build só gera arquivos em `dist/` — não há Worker.

## Conexão Git (recomendado)

Em **Workers & Pages** → seu projeto → **Settings** → **Builds**:

| Campo | Valor |
|--------|--------|
| Build command | `pnpm run build` |
| Build output directory | `dist` |
| **Deploy command** | **vazio** |

Depois do build, o Pages publica `dist/` automaticamente. **Não** configure deploy command.

### Erro comum: `npx wrangler deploy`

Se o deploy command for `npx wrangler deploy` (ou `wrangler deploy`), o build pode passar e o deploy falhar com algo como:

> Missing entry-point to Worker script or to assets directory

Isso acontece porque `wrangler deploy` é para **Cloudflare Workers**, não para publicar um site estático no Pages. Este repositório não define Worker nem bloco `[assets]` para esse fluxo.

**Correção:** apague o deploy command no dashboard, ou use apenas `pnpm run deploy` se quiser deploy manual via CLI (veja abaixo) — nunca `wrangler deploy` sem assets/Worker.

## Deploy manual pela CLI (opcional)

Útil fora do Git ou para testar:

```bash
pnpm run build
pnpm run deploy
```

O script `deploy` executa `wrangler pages deploy`, que lê `name` e `pages_build_output_dir` em `wrangler.toml`. Antes: `pnpm exec wrangler login`.

## Servir `dist/` localmente com headers do Pages

```bash
pnpm run build
pnpm run pages:dev
```
