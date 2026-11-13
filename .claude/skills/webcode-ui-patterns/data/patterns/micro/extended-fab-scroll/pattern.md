---
id: extended-fab-scroll
title: Botão flutuante que encolhe ao rolar (FAB estendido)
category: micro
summary: A ação principal da tela ("Nova OS") fica num botão flutuante com ícone e texto, na zona do polegar. Rolando para baixo ele encolhe para só o ícone e libera conteúdo; rolando para cima, ou parando, o texto volta.
themes: [clean-saas, aurora, playful]
products: [mobile-app, field-service, habits, crm, helpdesk, fintech, delivery]
motion: low
tech: css-js
deps: []
a11y: aria-label fixo com o texto completo (não muda quando encolhe); alvo ≥56px; fica acima da tab bar e da safe area; não cobre o último item da lista (padding-bottom no conteúdo).
perf: Um listener de scroll passivo com rAF; só max-width/opacity no rótulo e um atributo no botão. Sem IntersectionObserver nem bibliotecas.
reference_name: Material 3 (Extended FAB)
reference_url: https://m3.material.io/components/extended-fab/guidelines
react: Hook useScrollDirection(ref) que devolve 'up' | 'down' e um Button @webcode com className fixed. Expo: AnimatedFAB do react-native-paper (prop extended) com onScroll.
status: stable
---

## Quando usar
- Uma ação principal clara e frequente na tela: nova OS, novo lançamento, registrar hábito, nova conversa.
- Android e PWA. No iOS nativo prefira botão na barra de navegação ou na tab bar; na web mobile o FAB funciona bem para os dois.

## Evite
- Dois FABs na mesma tela ou FAB com ação secundária ("Filtrar").
- FAB sobre tab bar sem espaço (cobre rótulos) ou sobre o botão Enviar do chat.
- Esconder o FAB totalmente ao rolar quando a ação é a razão da tela.

## Implementação
- `position: fixed; right: 16px; bottom: calc(16px + tab bar + env(safe-area-inset-bottom))`.
- Direção do scroll com limiar de 8px para não piscar; texto volta 600ms após parar de rolar.
- Na lista, `padding-bottom` ≥ altura do FAB + 24px.
