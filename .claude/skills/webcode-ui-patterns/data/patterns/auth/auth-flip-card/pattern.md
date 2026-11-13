---
id: auth-flip-card
title: Login ↔ cadastro com cartão que vira (flip 3D)
category: auth
summary: Um único cartão com login na frente e cadastro no verso; trocar gira o cartão em 3D com mola suave. Compacto, funciona igual no celular e no desktop.
themes: [aurora, editorial, clean-saas, brutalista, playful]
products: [mobile-app, ai-app, event, subscription, edtech, landing]
motion: high
tech: css-js
deps: []
a11y: A face de trás fica inert. O foco vai para o título da face nova ao terminar o giro e uma região viva anuncia a troca. Em reduced motion o giro vira crossfade sem rotação. Os rótulos e autocomplete seguem o padrão de login.
perf: rotateY no cartão com backface-visibility; as faces dividem a mesma célula de grid, então a altura é a da maior sem medir. will-change só durante o giro.
reference_name: Cartões de produto da Apple Store e onboarding de apps iOS
reference_url: https://developer.mozilla.org/docs/Web/CSS/backface-visibility
react: Estado flipped + data-flipped no cartão; inert na face oculta; foco em onTransitionEnd. Sem lib de animação.
status: stable
---

## Quando usar
- Telas pequenas e focadas (app, evento, campanha) onde o cartão é o centro da página.

## Evite
- Formulários de alturas muito diferentes: o cartão fica com espaço vazio na face menor.
- Girar mais de uma vez por interação ou usar flip para mensagens de erro.

## Implementação
- Pai com `perspective: 1400px`; cartão `transform-style: preserve-3d` e `rotate: y 180deg` quando virado.
- Faces com `grid-area: 1 / 1` e `backface-visibility: hidden`; verso já nasce com `rotate: y 180deg`.
- Duração `--wc-motion-spring-smooth-duration` com a curva de mola: o cartão assenta sem quicar demais.
