# CORS allowlist (Cloudflare + backend)

O backend usa `ALLOWED_ORIGINS` (separado por vírgula) para decidir quais origens podem chamar a API.

## Variável obrigatória

```bash
ALLOWED_ORIGINS=https://<projeto>.pages.dev,https://www.seu-dominio.com
```

## Origens que normalmente precisam ser incluídas

- URL pública do frontend em Cloudflare Pages (`https://<projeto>.pages.dev`)
- Domínio customizado do frontend (ex.: `https://www.seu-dominio.com`)
- Ambiente de preview/staging, se existir (ex.: `https://staging.seu-dominio.com`)
- Ambiente local de desenvolvimento, quando necessário (ex.: `http://localhost:5173`)

## Observações

- O backend (`Render`) **não** deve ser incluído como origem, porque não é o `Origin` do navegador.
- Requisições `OPTIONS` só retornam `200` para origens permitidas; para as demais retornam `403`.
- Em ambiente não-produção, origens rejeitadas geram log curto para diagnóstico.
