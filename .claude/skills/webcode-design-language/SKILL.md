---
name: webcode-design-language
description: Linguagem visual WebCode (princípios, tokens, temas, motion, vidro, sombra, a11y e performance). Use em qualquer tarefa de UI web ou mobile da WebCodeFF, ao iniciar o visual de um projeto, ao escolher ou aplicar tema/tokens em Next.js + Tailwind v4 + shadcn (ou Expo), e antes de entregar uma tela. Gatilhos: "qual tema uso?", "aplica o tema", "configura os tokens", "modo escuro", "deixa com cara de Apple/vidro", "está acessível?".
---

# WebCode Design Language

Base visual de todos os produtos WebCode: temas, tokens e as regras que valem sempre. Não é autoridade final: o Design Freeze (Penpot) e o `DESIGN.md` do projeto vencem quando existem.

## Quando usar
- Projeto novo ou sem Design Freeze: escolher o tema e aplicar os tokens.
- Qualquer tela ou componente: as Regras abaixo valem sempre.
- Área específica (formulário, tabela, overlay, mobile, IA, gráfico): leia só o guia dela.
- Instalar e escolher componentes → `webcode-components`; criar a tela → `webcode-interface-craft`.

**Precedência:** 1. mudança aprovada explicitamente → 2. regras de negócio → 3. Penpot/Design Freeze → 4. `DESIGN.md` do projeto → **5. esta skill** → 6. defaults de outras skills.
Nunca troque cor primária, tipografia, escala, raio ou linguagem de motion de um projeto estabelecido. Proponha no formato `ATUAL / PROPOSTO / MOTIVO / IMPACTO / CUSTO`.

## 1. Escolha o tema (só em projeto novo ou sem Design Freeze)
| Produto | Tema | Por quê |
| --- | --- | --- |
| Landing, app, IA, lançamento tech | `aurora` | Estilo Apple: vidro, profundidade, dark "futurista" |
| SaaS, dashboard, ERP, CRM, admin | `clean-saas` | Denso, calmo, legível por 8h |
| Produto Axion (manutenção, OS, white-label B2B) | `axion` | Ardósia, Geist, controles com sombra, raio 12/16 |
| Produto Custelo (portaria, cadeia de custódia) | `custelo` | Azul profundo, Bodoni nos títulos, sem vidro |
| Produto OmniMesa (restaurante: PDV, KDS, gestão) | `omnimesa` | Plum e coral, Inter, KDS no escuro |
| Institucional, portfolio, editorial, agência | `editorial` | Tipografia forte, muito respiro |
| Lançamento premium, streaming, evento, audiovisual | `cinematografico` | Escuro de cinema, luz âmbar, motion enfático (comece no escuro) |
| Marca jovem, criador, agência criativa, ferramenta indie | `brutalista` | Borda preta, sombra dura, canto reto, amarelo |
| EdTech, infantil, hábitos, gamificação, comunidade | `playful` | Cantos redondos, sombra de base (3D leve), mola com overshoot |

Lista sempre atual: `list_themes` do MCP. Detalhes e combinações em `references/themes.md`; densidade, raio, motion e componentes por tipo de sistema (ERP, CRM, PDV, fintech, delivery…) em `references/systems.md`.

## 2. Aplique os tokens
- **Caminho padrão: registry `@webcode`** (ADR 0004): `npx shadcn@latest add @webcode/theme-<nome>` grava tokens, ponte do shadcn e `@theme` no globals.css. Sem CLI (HTML puro, React Native): `references/instalacao-manual.md`.
- **Componentes usam só tokens semânticos** (`--wc-bg`, `--wc-fg`, `--wc-accent`…), nunca paletas primitivas (`--wc-color-blue-600`) nem hex literal.
- Com shadcn, `accent` é o fundo de hover; o acento WebCode é `brand` (`text-brand`).
- **Texto e densidade são do tema** (ADR 0012): `text-xs…text-6xl` apontam para `--wc-text-*`; alturas de controle e linha para `--wc-density-control-xs/sm/md/lg` e `--wc-density-row` (`h-control-md`, `size-control-sm`, `h-row`). Não fixe `h-10`/`text-[15px]` em controles: troque a densidade ou a escala no Estúdio. App mobile/Expo: `--wc-mobile-*` (controles ≥ 44px, `text-body` 17 no padrão iOS).

## Regras
**Acessibilidade**
- Contraste AA (o build garante nos tokens; você garante ao combinar). Texto sobre imagem/gradiente precisa de checagem.
- Foco visível com `--wc-focus`, alvos de toque ≥ 44px (`--wc-size-touch-min`), estados nunca só por cor.
- Deslocamentos com `calc(Npx * var(--wc-motion-distance))`: vira 0 em reduced motion.

**Performance**
- Anime só `transform`, `opacity`, `filter`. LCP < 2,5s, INP < 200ms, CLS < 0,1.
- CSS nativo primeiro (`@starting-style`, View Transitions, `animation-timeline`, `linear()`), depois Motion (motion.dev) em React, GSAP só para storytelling de scroll.

**Movimento** (detalhes em `references/motion.md`)
- Feedback de toque ≤ 80ms; UI frequente < 300ms; saída mais rápida que entrada.
- Springs (`--wc-motion-spring-*` + `-duration`) para o que é arrastado, solto ou alternado; curvas `--wc-motion-ease-*` para o resto.
- Uma animação "assinatura" por página. Nada anima em ação repetida por teclado.

**Visual**
- Hierarquia por tamanho, peso e espaço antes de cor. Uma cor de destaque por tela.
- Vidro em três espessuras (`glass()` de `@webcode/glass`), só na camada funcional e nunca vidro sobre vidro; um vidro tingido por tela. Regras completas: `references/materiais.md`.
- Sombra de função = `shadow-wc-*` do tema; sombra de expressão só pelas receitas de `@webcode/shadow`, nunca valor solto (`references/materiais.md`).
- Números em colunas com `tabular-nums`; títulos com `text-wrap: balance`.

**Antes de entregar:** rode `references/checklist.md` (estados, teclado, mobile, dark, reduced motion, copy). Corrija o que falhar; não liste problemas sem corrigir.

## Referências (sob demanda)
- `references/themes.md` (temas e combinações) · `references/systems.md` (por tipo de sistema) · `references/motion.md` · `references/materiais.md` (vidro e sombra) · `references/instalacao-manual.md` · `references/checklist.md`.
- `references/guidelines/`: leia **só** o da área: `ui.md`, `ux.md`, `a11y.md`, `forms.md` (máscaras BR, checkout, login), `tables.md`, `navigation.md`, `overlays.md` (dialog, alert, sheet, popover, toast), `data-viz.md`, `ai-interfaces.md`, `mobile.md` (app/PWA: toque, gestos, transições, teclado, offline, Expo). Índice em `references/guidelines/README.md`.
- `assets/` (gerados): CSS, Tailwind e JSON de cada tema.

## Outras skills WebCode
- `webcode-components`: componentes React @webcode (instalar, escolher, usar, criar).
- `webcode-ui-patterns`: receitas de composição, padrões de tela e blueprints por tipo de produto.
- `webcode-interface-craft`: método para criar a tela (hierarquia, estados, detalhes, motion, copy).
- `webcode-design-review`: revisão com nota por critério e correção.
- `webcode-logo`: logo e identidade; a paleta e as fontes aprovadas voltam para cá como tema.
