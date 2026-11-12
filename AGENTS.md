# AGENTS.md · Bubbly (repo ayumi-assitent)

PWA mobile (iPhone) de gestão de salão/estúdio de beleza: agenda, clientes, serviços, vagas, financeiro, WhatsApp com lembretes e IA, avisos no celular, Google Agenda. Cliente piloto: Yumi. Nome do produto: **Bubbly** (o código ainda tem "mimo"/"assist" em alguns nomes). Mascote padrão: Bolha.

Stack: Next.js 16 (App Router, Server Actions) · React 19 · Tailwind 4 · Drizzle + Postgres (RLS por estúdio) · Better Auth · pg-boss (worker separado) · Evolution API (WhatsApp) · Web Push · Anthropic SDK · Railway (web + worker + Postgres + Bucket).

Este arquivo **roteia**. O detalhe de cada módulo fica em `docs/modulos/`.

## Caminho de leitura (sempre nesta ordem, só o necessário)

1. **Este arquivo** inteiro (regras e caminho de task).
2. **`docs/modulos/README.md`**: ache o(s) módulo(s) da task na tabela e leia a coluna "Mexeu aqui? Confira".
3. **A ficha do módulo** (`docs/modulos/<modulo>.md`) e, se a ficha listar ligação forte, a ficha do vizinho. Nunca leia todas as fichas.
4. **Graphify** para achar símbolo/arquivo e quem chama: `graphify explain "<funcao>"`, `graphify path "<A>" "<B>"`, `graphify query "<pergunta>" --budget 800`. Visão geral: `graphify-out/GRAPH_REPORT.md`.
5. **Código**: só os arquivos que a ficha e o graphify apontaram, com offset/limit. Testes do módulo (`tests/unit`, `tests/db`, `tests/e2e`) antes de mudar regra.
6. Se a task depende de versão do Next: `node_modules/next/dist/docs/` (bloco abaixo).

`.ai/` é histórico da fase sem código (05/11/2026); não use como estado atual. Notion só quando a task pedir decisão de produto.

## Caminho de task

**Antes de codar**
- Diga em 1 linha qual módulo e qual fluxo a task toca (ex.: "lembretes → 2º aviso → messaging/port").
- Liste o impacto cruzado pela ficha: tabelas, jobs do worker, telas que usam o módulo, push/sino, Google, textos de WhatsApp.
- Regra nova de domínio vai em `core.ts`/arquivo puro (testável); `actions.ts` só valida (zod), pega o estúdio (`requireTenant`), chama o core em `withTenant` e faz `revalidatePath`.

**Durante**
- Siga as regras permanentes abaixo. Toda ação mostra carregando, erro e sucesso.
- Mudou banco: nova migration `src/db/migrations/00NN_nome.sql` (próximo número livre; já existem dois `0026`, não repita) + `src/db/schema.ts` + policy RLS se for tabela nova.
- Mudou algo que o worker usa (`reminders`, `owner-notices`, `push`, `messaging`): lembre que web e worker precisam de Redeploy.

**Depois**
- `pnpm typecheck && pnpm lint && pnpm test` (e2e do módulo se mexeu em tela: `pnpm test:e2e tests/e2e/<arquivo>.spec.ts`).
- Revisão de segurança dos arquivos tocados (tenant/RLS, segredo em log, entrada sem validação).
- **Atualize a ficha do módulo** se mudou finalidade, ligação, tabela, job ou cuidado, e rode `graphify update .` depois de lote grande (o índice fica fora do git).
- Commit, PR, merge (autorizado) e avise o Fernando o que precisa de Redeploy no Railway (ele clica).

## Regras permanentes

- **Só mobile/iPhone**, o mais perto de app iOS nativo. Tema sempre claro, marca Lavanda Digital + Quicksand, vidro (glass).
- **Nunca página/navegação para ação**: tudo em sheet/diálogo por cima da tela (vaul). Seletores de cliente/serviço = `components/ui/LetterPicker.tsx`. Navegação sem reload; tela abre no topo.
- Ícones só de `components/ui/Icon.tsx`. Toasts via `components/feedback/toast.tsx` (`notify`, Sonner no topo; mascote por tipo em `components/brand/moods.ts`). Animação Órbita só no agendar (`BookingOverlay`).
- Teclado no iPhone: `useKeyboardInset` + `repositionInputs={false}` nos sheets.
- Menu lateral / avatar no header: não mexer sem pedido.
- Erros para a usuária só pelo catálogo `src/lib/errors.ts` (pt-BR). Server action devolve `ok()/fail()`.
- Dados sempre por estúdio: `requireTenant()` + `withTenant(tenantId, tx => ...)` (RLS com `app.tenant_id`). Nunca `getDb()` direto em dado de estúdio, exceto rotinas que iteram estúdios (worker) ou leitura de `tenants`/`memberships` pelo dono.
- Datas no fuso do estúdio: `src/lib/dates.ts` (UTC-3 fixo). Dinheiro em centavos (`src/lib/money.ts`). Telefone E.164 (`src/lib/phone.ts`).
- Log: `src/lib/log.ts`, nunca telefone completo, token ou texto de mensagem.
- `.env.local` aponta para o banco de **produção**: cuidado em teste local; desligue o proxy ao terminar. Nada de migration destrutiva sem OK.
- Dependência nova só com motivo claro (prefira nativo).

## Git e ambiente

- Repo local: `C:\Users\ferna\Desktop\WebCode\Projetos\ayumi-assitent`. Para não brigar com outra thread, trabalhe num worktree (`git worktree add ..\ayumi-<tema> -b claude/<tema> origin/main`).
- CI (`.github/workflows/ci.yml`): migrate, typecheck, lint, vitest, playwright.
- Deploy Railway: web (`railway.json`, migra no start) e worker (`railway.worker.json`, `pnpm worker`).
- Comandos: `pnpm dev`, `pnpm worker`, `pnpm db:migrate`, `pnpm test`, `pnpm test:e2e`.
- Graphify (índice em `graphify-out/`, fora do git, sem LLM): criar com `graphify extract . --code-only` + `graphify cluster-only . --no-label --no-viz`; atualizar com `graphify update .`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
