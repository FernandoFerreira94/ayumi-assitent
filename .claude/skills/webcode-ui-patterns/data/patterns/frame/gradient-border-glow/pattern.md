---
id: gradient-border-glow
title: Moldura com borda de gradiente girando
category: frame
summary: Borda de 1px com gradiente cônico que gira devagar, para destacar o plano recomendado, um card de IA ou um anúncio.
themes: [aurora, clean-saas, cinematografico]
products: [saas, ai-app, landing, subscription, devtools, launch]
motion: low
tech: css
deps: []
a11y: Decorativo. O destaque também é comunicado em texto ("Mais escolhido"). Para em reduced motion.
perf: @property anima um ângulo; repinta só a borda. Use em no máximo um elemento por tela.
reference_name: MDN (@property)
reference_url: https://developer.mozilla.org/en-US/docs/Web/CSS/@property
react: Server component; só CSS.
status: stable
---

## Quando usar
- Um único elemento que precisa de destaque: plano recomendado, card de "Novo com IA".

## Evite
- Várias bordas girando na mesma tela. Rotação rápida (abaixo de 4s por volta).

## Implementação
- `@property --angle` com `syntax: '<angle>'` permite animar o `conic-gradient`.
- A borda é o `background` do wrapper com `padding: 1px`; o conteúdo tem fundo sólido por cima.
- Um segundo layer borrado atrás cria o glow.
