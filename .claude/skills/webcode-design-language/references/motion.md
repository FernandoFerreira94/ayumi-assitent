# Movimento

Fontes: Apple WWDC18 "Designing Fluid Interfaces", Emil Kowalski (animations.dev), Rauno Freiberg ("Invisible Details of Interaction Design").

## Quando animar
Anime para **explicar** (de onde veio, para onde foi), **confirmar** (a ação aconteceu) ou **dar continuidade** (lista → detalhe). Se não faz nenhum dos três, não anime.
Não anime: ações por teclado repetidas (⌘K, navegação por setas), mudanças em tabelas densas, qualquer coisa que o usuário faz centenas de vezes por dia.

## Durações (tokens)
| Token | ms | Uso |
| --- | --- | --- |
| `instant` | 80 | press, troca de ícone |
| `fast` | 150 | hover, toggle, tooltip, saídas |
| `base` | 220 | entrada de componente, popover, dropdown |
| `slow` | 360 | sheet, modal, transição de página |
| `slower` | 560 | hero, splash, storytelling |
| `stagger` | 40 | intervalo entre itens |

## Curvas
- Entrada: `--wc-motion-ease-out`. O elemento chega rápido e assenta devagar: parece responsivo.
- Saída curta (≤ 150ms: dialog, popover, menu, tooltip): `--wc-motion-ease-out`. Some sem demora no começo, quando o olho ainda está nela.
- Saída que viaja distância (sheet, drawer, card que sai da tela): `--wc-motion-ease-in-soft` (começa sem demora e não termina parada). O `--wc-motion-ease-in` forte fica só para casos legados (ADR 0011).
- Toda saída é mais curta que a entrada (≈ 60–70% do tempo).
- Movimento na tela (A → B): `--wc-motion-ease-in-out`.
- Elementos grandes: `--wc-motion-ease-emphasized`.
- Nunca `linear` em UI, só em progresso e loops.

## Springs
`--wc-motion-spring-snappy|smooth|bouncy` são `linear()` gerados por simulação física, e cada uma tem `-duration`. Use sempre o par:
```css
transition: transform var(--wc-motion-spring-smooth-duration) var(--wc-motion-spring-smooth);
```
Use mola para o que o usuário manipula (arrastar, soltar, alternar, sheet). Em React com Motion, os mesmos parâmetros: snappy `{stiffness: 380, damping: 30}`, smooth `{220, 26}`, bouncy `{300, 16}`.

## CSS ou Motion (ADR 0011)
CSS é o padrão: tokens, `tw-animate-css`, `@starting-style`, View Transitions, WAAPI. A biblioteca Motion entra **só por componente** e **só** quando CSS não resolve bem:
- reordenar lista e kanban (vizinhos abrem espaço enquanto se arrasta);
- carrossel/baralho com física de arraste (velocidade, inércia, elástico);
- layout/shared element dentro do mesmo documento (card → detalhe) quando View Transitions não servir;
- saída de algo que desmonta junto com outros que precisam se reacomodar (`AnimatePresence` + `layout`).
Itens com Motion no registry têm "(Motion)" no título e declaram `motion` como dependência só neles (`@webcode/sortable-list`, `@webcode/kanban`, ponte `@webcode/motion`). Use `useThemeSpring()` para a mola do tema e envolva com `MotionConfig reducedMotion="user"`. Nunca Motion e outra biblioteca de movimento no mesmo componente.

## Regras de ofício
- Press: `scale(.97)` em 80ms; nunca menor que .95.
- Escala de entrada parte de `.96–.98`, nunca de 0. Popovers escalam a partir da origem do gatilho (`transform-origin`).
- Interrompível: transições CSS (não keyframes) para estados que o usuário pode reverter no meio.
- Desfoque leve (`blur(4px)`) ajuda crossfades de ícones e textos a parecerem uma só peça.
- Stagger total ≤ 300ms, mesmo com muitos itens.
- `prefers-reduced-motion`: troque deslocamento por fade curto; use `--wc-motion-distance`.

## Padrões de interação física
- **Arrastar com inércia:** ao soltar, projete a posição final pela velocidade (`posição + velocidade × 0,2s`) e decida o destino (fechar o sheet, mudar de detent) por ela, não só pela distância.
- **Elástico nas bordas:** passou do limite, o movimento continua com resistência (≈ 1/3 do dedo) e volta com mola. Nunca trave seco.
- **Gesto reversível:** o usuário pode desistir no meio do arraste e o elemento volta.
- **Mola para responder, curva para anunciar:** o que o usuário causa usa mola; o que o sistema causa (toast, carregamento) usa curva.

## Tendências 2025–2026 (como adotar sem exagero)
- **Vidro dinâmico (Apple Liquid Glass):** controles flutuantes que refratam o conteúdo e se adaptam a claro/escuro. Na web: `glass-bg` + blur só em barras e controles, borda com `glass-highlight`, e sempre o fallback sólido de reduced transparency. Nunca vidro sobre vidro.
- **Springs expressivas (Material 3 Expressive):** molas com um pouco de overshoot em elementos de destaque (FAB, seleção, toggle). Use `spring-bouncy` só nesses pontos; o resto fica em `smooth`/`snappy`.
- **View Transitions:** continuidade lista → detalhe e troca de tema/aba com `document.startViewTransition` (mesmo documento) e `@view-transition { navigation: auto }` (entre páginas). Dê `view-transition-name` só aos elementos que se transformam.
- **Scroll-driven animations:** `animation-timeline: view()` para revelar e indicadores de progresso, sem JS. Nada essencial depende delas.
- **Entrada/saída nativa:** `@starting-style` + `transition-behavior: allow-discrete` para `dialog`, `popover` e `display: none`, substituindo bibliotecas em overlays simples.

## Checklist de motion
- [ ] Cada animação explica, confirma ou dá continuidade (escreva qual ao lado dela).
- [ ] Duração e curva saem dos tokens; nada acima de `slow` em UI frequente.
- [ ] Saída mais curta que entrada; nada bloqueia a próxima ação do usuário.
- [ ] Interrompível: clicar de novo no meio reverte a partir da posição atual.
- [ ] Só `transform`, `opacity`, `filter`; `will-change` apenas durante a animação.
- [ ] Reduced motion testado: deslocamentos zerados, fades curtos mantidos, nada essencial some.
- [ ] Sem animação em ação repetida por teclado e em tabelas densas.

## Mais fontes
- Apple WWDC25, Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/
- Material 3, Motion overview e Expressive: https://m3.material.io/styles/motion/overview
- Emil Kowalski, animations.dev: https://animations.dev/
- Rauno Freiberg, Invisible Details of Interaction Design: https://rauno.me/craft/interaction-design
- Josh W. Comeau, A Friendly Introduction to Spring Physics: https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/
- Chrome for Developers, View Transitions: https://developer.chrome.com/docs/web-platform/view-transitions
- Chrome for Developers, Scroll-driven animations: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
