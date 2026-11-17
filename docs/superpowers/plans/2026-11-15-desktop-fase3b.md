# Fase 3b · Recursos de tela larga (resto)

Continua a tabela "Fora deste plano" de `2026-11-13-desktop-tablet-shell.md` e os achados 16, 17, 19 e 24 da spec `2026-11-13-desktop-tablet-ux-ui.md`.
Celular não muda: tudo entra a partir de `md` (768 px, `WIDE_QUERY`) ou `lg` (1024 px), como dito em cada item.

Branch: `claude/desktop-fase3b`. Um commit por item, com teste unitário da lógica pura e `docs/modulos/*.md` atualizado.

| # | Item | Achado | Estado |
|---|---|---|---|
| 1 | Coluna "Contexto do dia" no Painel | 15 | Feito (`48880e6`) |
| 2 | Login e Splash em duas metades com a Bolha | 24 | Feito (`f8fa561`) |
| 3 | Ficha de cliente em coluna fixa de 420 px, `?id=` e j/k | 17 | Feito (`16c55ae`) |
| 4 | Visão Semana do Calendário | 16 | Grade só leitura feita; arrastar entre dias fica para um segundo commit |
| 5 | Catálogo de Serviços em 3 colunas, edição no painel de 400 px | 19 | Feito (3 colunas em `d3e2479`; 2 colunas no `md` depois; painel ficou nos 440 px padrão) |

Ordem: 2 → 3 → 5 → 4. A Semana é o maior e vai por último para não travar os outros.

## Item 2 · Login e Splash em duas metades

Arquivos: `src/app/login/page.tsx`, `src/components/brand/Splash.tsx`, `src/app/globals.css`.

- A partir de `lg`, `<main>` vira grade `1fr 1fr`. Metade esquerda: Bolha grande (o mesmo mascote do Splash), nome da marca e uma frase curta, em fundo com a cor da marca. Metade direita: o `LoginForm` atual, sem mudança, centrado em `max-w-md`.
- Abaixo de `lg` fica exatamente como hoje (coluna única `max-w-md`).
- O Splash usa a mesma composição da metade esquerda, para a passagem Splash → Login não pular.
- `prefers-reduced-motion`: sem animação de entrada na metade da Bolha.
- Teste: sem lógica nova; checagem visual em 1440 × 900 e 375 × 812 (login não exige sessão, dá para ver no navegador).

## Item 3 · Ficha de cliente em coluna fixa

Arquivos: `src/app/(app)/clientes/page.tsx`, `src/features/clients/ClientRow.tsx`, `src/lib/shortcuts.ts`.

- A partir de `lg`, a página vira grade `1fr 420px`. A ficha fica fixa à direita (mesmo conteúdo do `CardSheet` de hoje), sem sobrepor a lista.
- O cliente aberto vem de `?id=` (o servidor lê e já desenha a ficha; link compartilhável e voltar do navegador funcionam). Sem `?id=`, a coluna mostra um estado vazio ("Escolha uma cliente na lista").
- Clicar numa linha troca `?id=` com `router.replace` (sem empilhar histórico). Linha ativa fica marcada (`aria-current`).
- Atalhos j/k: próxima e anterior na lista filtrada, ignorados com foco em campo de texto. Entram em `shortcuts.ts` como `"proxima"` / `"anterior-item"` para não colidir com ← →.
- Abaixo de `lg` continua a folha atual (`useSheetSide`), sem mudança.
- Extrair a vizinhança (dado a lista e o id, qual é o próximo e o anterior) para função pura em `src/features/clients/` com teste unitário. Teste também do novo mapeamento de j/k em `shortcutFor`.

## Item 5 · Catálogo de Serviços em 3 colunas

Arquivos: `src/features/services/ServicesCatalog.tsx`, `ServiceForm.tsx`, `NewServiceSheet.tsx`.

- Grade de cartões `repeat(3, 1fr)` a partir de `lg`, 2 colunas em `md`, lista atual no celular.
- Editar abre no painel lateral de 400 px (`AdaptiveSheet` com `side="right"` e largura 400) em vez da folha de baixo, a partir de `md`.
- Ler `ServicesCatalog.tsx` antes de mexer: ele monta a lista por dentro, então a grade entra lá, não na página.
- Teste: se a ordenação ou agrupamento mudar, teste em `catalog.ts`; senão só checagem visual.

## Item 4 · Visão Semana do Calendário

Arquivos: `src/features/calendar/grid.ts` (`parseView`), `src/app/(app)/calendario/page.tsx`, novo `src/features/calendar/WeekGrid.tsx`, `src/lib/time-grid.ts`, `src/lib/shortcuts.ts`, `src/features/appointments/` (arrastar).

- Nova visão `kind: "week"` em `parseView` (`?v=semana&d=AAAA-MM-DD`, semana que contém `d`, começando no domingo como a faixa atual). Teste unitário de `parseView` e do cálculo do início da semana.
- Só a partir de `lg` (decisão aberta 2 da spec; recomendo `lg` porque no tablet retrato 7 colunas ficam com menos de 100 px). Abaixo de `lg`, `?v=semana` cai para o dia `d`.
- Grade `56px repeat(7, 1fr)`: coluna das horas reaproveita `time-grid.ts`; cada dia desenha os blocos com o mesmo posicionamento do `AgendaDay`.
- Dados: uma busca por semana no servidor (intervalo de 7 dias, uma consulta, sem N+1), no mesmo formato que `DaySchedule` usa por dia.
- Seletor Dia / Semana / Mês na barra do calendário; atalhos D/S/M e ← → (semana anterior/próxima quando na Semana), T para hoje.
- Arrastar para remarcar entre dias: reaproveita a ação de remarcar da agenda; arrastar muda dia e hora. Se custar demais, entra num segundo commit, depois da grade só leitura.
- Teste: `parseView`, início da semana, distribuição dos agendamentos por dia (função pura) e o novo mapeamento D/S/M.

## Verificação ao fim de cada item

`pnpm vitest run`, `tsc --noEmit` e `eslint` nos arquivos tocados. Checagem visual em 1440 × 900, 1024 × 768 e 375 × 812; as telas logadas o Fernando confere (ou com login de teste local, se houver seed).
