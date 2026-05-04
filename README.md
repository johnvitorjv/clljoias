# clljoias

## Estrutura do projeto

```text
.
├── client/                 # frontend (Vite)
├── server/                 # API/serviços backend
├── shared/                 # tipos e constantes compartilhadas
├── drizzle/                # schema e migrações do banco
├── patches/                # patches de dependências
├── docs/
│   ├── fixtures/           # arquivos de apoio (fora de build/runtime)
│   │   ├── categories.json
│   │   ├── products.json
│   │   └── unnamed-1.jpg
│   └── todo.md             # anotações e tarefas
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

## Organização de artefatos

Arquivos que não participam do build/runtime foram movidos do diretório raiz para `docs/` e `docs/fixtures/` para manter a raiz do repositório enxuta.
