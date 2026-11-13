---
id: footer-minimal
title: Footer mínimo de uma linha
category: footer
summary: Uma linha discreta com marca, ©, poucos links e redes, mais um "voltar ao topo". Para landing pages, apps logados, portfólios simples e páginas de checkout.
themes: [clean-saas, editorial, aurora, cinematografico, brutalista]
products: [landing, portfolio, launch, event, admin, ai-app, mobile-app, pos]
motion: none
tech: css
deps: []
a11y: Landmark footer com nav rotulado. "Voltar ao topo" é um link para #topo (funciona sem JS e move o foco). Alvos de toque com no mínimo 44px no mobile.
perf: Zero JavaScript. Rolagem suave só com scroll-behavior quando não há reduced motion.
reference_name: Apps da Apple na web (iCloud) e landing pages de lançamento
reference_url: https://www.icloud.com
react: Server component estático.
status: stable
---

## Quando usar
- Páginas com objetivo único (landing, checkout, app logado) onde um footer grande distrai.

## Evite
- Em e-commerce e sites institucionais: o footer completo é onde a pessoa busca SAC, trocas e dados da empresa.

## Implementação
- `display: flex; flex-wrap: wrap; justify-content: space-between` com gap; no mobile, centraliza e empilha.
- `html { scroll-behavior: smooth }` dentro de `@media (prefers-reduced-motion: no-preference)`.
- Ano do © gerado no servidor, não no client.
