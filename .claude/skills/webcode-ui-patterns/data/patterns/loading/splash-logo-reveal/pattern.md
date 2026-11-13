---
id: splash-logo-reveal
title: Splash com logo desenhado
category: loading
summary: O símbolo se desenha em traço, o nome aparece e a tela de splash sobe revelando o conteúdo. Total abaixo de 1,4s e só na primeira visita da sessão.
themes: [aurora, editorial, clean-saas, cinematografico, playful]
products: [mobile-app, launch, portfolio, ai-app, event, edtech, fintech]
motion: high
tech: css-js
deps: []
a11y: O conteúdo real está no DOM por baixo; a splash é aria-hidden. Reduced motion pula a splash. Nunca bloqueia interação por mais de 1,4s.
perf: Não atrasa o LCP: o conteúdo carrega em paralelo. stroke-dashoffset em SVG pequeno e transform na saída.
reference_name: Apple HIG (Launching)
reference_url: https://developer.apple.com/design/human-interface-guidelines/launching
react: Componente client montado no layout raiz; leia sessionStorage em useEffect para decidir se mostra.
status: stable
---

## Quando usar
- Abertura de PWA, lançamento ou portfolio onde a marca precisa de um momento.

## Evite
- Splash como tela de loading real. Se o app demora, use skeleton.
- Mostrar em toda navegação: só na primeira visita da sessão (`sessionStorage`).

## Implementação
- Sequência: traço do símbolo (600ms) → nome (300ms) → saída da splash com `translateY(-100%)` (500ms).
- O botão "Repetir" no demo apaga a flag de sessão para você ver de novo.
