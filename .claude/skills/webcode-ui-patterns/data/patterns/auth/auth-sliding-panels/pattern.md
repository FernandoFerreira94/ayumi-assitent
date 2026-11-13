---
id: auth-sliding-panels
title: Login ↔ cadastro com painel que desliza
category: auth
summary: Os dois formulários ficam lado a lado e um painel de marca desliza por cima, cobrindo o que não está em uso e trazendo o convite para trocar. No mobile vira um trilho que desliza de lado.
themes: [aurora, clean-saas, editorial, cinematografico]
products: [landing, ecommerce, subscription, edtech, ai-app, marketplace, health]
motion: high
tech: css-js
deps: []
a11y: O formulário fora de uso fica inert (sem foco, fora da árvore de acessibilidade). Depois da troca o foco vai para o título do formulário ativo e uma região viva anuncia "Formulário de cadastro". Botões de troca são buttons reais. Reduced motion troca sem deslizar.
perf: Só translate e opacity animam. Os dois formulários já estão no DOM, então a troca é instantânea mesmo em rede lenta. URL atualiza com #entrar e #cadastrar (deep link) via history.replaceState.
reference_name: Padrão popularizado no Dribbble/CodePen ("double slider sign in/up")
reference_url: https://codepen.io/FlorinPop17/pen/vPKWjd
react: Estado mode ("entrar" | "cadastrar") sincronizado com searchParams; aplique data-mode no container e inert no formulário inativo (React 19 aceita inert booleano).
status: stable
---

## Quando usar
- Produtos de consumo onde cadastro e login têm peso parecido e a marca quer um momento visual.

## Evite
- Apps B2B em que quase todo acesso é login: use `login-split-screen` e um link para cadastro.
- Formulários longos (mais de 4 campos) no lado do cadastro: use `signup-multi-step`.

## Implementação
- Container `grid-template-columns: 1fr 1fr`; painel `position: absolute; width: 50%` com `translate` 0 ↔ -100% e `--wc-motion-ease-emphasized`.
- Textos do painel cruzam com opacity e um deslocamento curto multiplicado por `--wc-motion-distance`.
- Abaixo de 760px: trilho com os dois formulários e `translate: -50%`, mais um link de troca em cada formulário.
