---
id: ios-tab-bar
title: Tab bar estilo iOS com indicador em mola
category: navigation
summary: Barra inferior flutuante de vidro com 4 abas e um indicador que desliza com spring nativo do CSS. Para PWAs e web apps mobile.
themes: [aurora, clean-saas, cinematografico, playful]
products: [mobile-app, delivery, fintech, health, booking, ai-app, ecommerce, edtech, event, field-service, habits, logistics]
motion: medium
tech: css-js
deps: []
a11y: role tablist com setas do teclado, aria-selected e roving tabindex. Rótulos visíveis abaixo dos ícones. Área de toque de 44px+.
perf: O indicador anima só transform via --wc-motion-spring-snappy (linear()). JS só calcula a posição no clique.
reference_name: Apple HIG (Tab bars)
reference_url: https://developer.apple.com/design/human-interface-guidelines/tab-bars
react: Em Next.js use com o router (usePathname) e mova o indicador num useLayoutEffect.
status: stable
---

## Quando usar
- Web app ou PWA com 3 a 5 destinos principais acessados com o polegar.

## Evite
- Mais de 5 abas. Ações (como "Novo pedido") não são abas: use botão separado.
- Em desktop: troque por sidebar ou header.

## Implementação
- Barra flutuante com `margin` e `env(safe-area-inset-bottom)` para não brigar com a home indicator do iPhone.
- O indicador é um único elemento; o JS mede a aba ativa e seta `--x` e `--w`. A transição usa a mola do token.
