---
id: segmented-control
title: Controle segmentado com indicador deslizante
category: gesture
summary: Seletor de 2 a 5 opções mutuamente exclusivas (Dia/Semana/Mês, Mensal/Anual) com indicador que desliza em mola até a opção escolhida. É um radio group nativo estilizado, então teclado e leitor de tela funcionam sem ARIA extra.
themes: [aurora, clean-saas, editorial, brutalista, playful]
products: [mobile-app, saas, fintech, health, subscription, booking, edtech, ai-app, delivery, field-service, habits, pos]
motion: low
tech: css-js
deps: []
a11y: <fieldset> com legend e inputs radio reais (setas trocam a opção, Tab entra e sai do grupo); foco visível no segmento; rótulo de texto em cada segmento (ícone sozinho precisa de aria-label); alvo de 44px no toque.
perf: Indicador posicionado por CSS com :has() e custom properties do índice; JS só como fallback de medida para larguras desiguais; anima translate e width com spring.
reference_name: Apple HIG (Segmented controls)
reference_url: https://developer.apple.com/design/human-interface-guidelines/segmented-controls
react: ToggleGroup type="single" do @webcode (Radix) com indicador; para filtro de visualização em URL, combine com url-tabs.
status: stable
---

## Quando usar
- Trocar a visão de um mesmo conteúdo (período, modo de exibição, plano mensal/anual).

## Evite
- Para navegar entre seções diferentes: use tabs (`url-tabs`).
- Mais de 5 segmentos ou rótulos longos: use select.
- Segmentos de larguras muito diferentes no mobile.

## Implementação
- Larguras iguais por padrão (grid com colunas 1fr).
- O conteúdo que muda abaixo é anunciado pelo próprio conteúdo, não pelo controle.
