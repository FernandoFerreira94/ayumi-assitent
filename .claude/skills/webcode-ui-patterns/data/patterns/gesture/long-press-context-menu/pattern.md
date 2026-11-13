---
id: long-press-context-menu
title: Toque longo com menu de contexto
category: gesture
summary: Segurar um item por meio segundo o destaca (cresce, o resto desfoca) e abre um menu de ações ao lado, como o menu de contexto do iOS. Botão ⋯, clique direito e Shift+F10 abrem o mesmo menu.
themes: [aurora, clean-saas, playful]
products: [mobile-app, ecommerce, field-service, habits, delivery, fintech]
motion: medium
tech: js
deps: []
a11y: O gesto é atalho; o botão ⋯ visível e o evento contextmenu (clique direito, Shift+F10, tecla Menu) abrem o mesmo menu (WCAG 2.5.7). Menu com role="menu", setas navegam, Esc fecha e devolve o foco.
perf: Timer de 450ms cancelado se o dedo andar mais de 10px (é rolagem). -webkit-touch-callout e user-select desligados só no item. Animação por scale e filter no compositor; vibração curta quando o menu abre.
reference_name: Apple HIG (Context menus)
reference_url: https://developer.apple.com/design/human-interface-guidelines/context-menus
react: Hook useLongPress(ref, onOpen, { delay: 450 }) + DropdownMenu @webcode controlado (open/onOpenChange). Expo: react-native-ios-context-menu ou zeego (menu nativo nos dois sistemas).
status: stable
---

## Quando usar
- Atalhos para quem já conhece o app: favoritar, compartilhar, repetir pedido, marcar hábito como pulado.
- Grade de cards ou fotos onde não cabe botão de ação em cada item.

## Evite
- Como único caminho para uma ação. Toda ação do menu existe também no detalhe do item.
- Delay maior que 600ms (parece travado) ou menor que 350ms (dispara rolando).
- Mais de 6 ações; agrupe ou mova para o detalhe.

## Implementação
- `pointerdown` inicia o timer; `pointermove` > 10px ou `pointerup` cancela; ao disparar, `preventDefault` no click seguinte.
- Menu posicionado abaixo do item, ou acima se não couber; nunca sai da tela.
- Destrutiva no fim, em `danger`, separada por linha.
