---
id: press-spring-button
title: Botão com press e estados completos
category: micro
summary: Botão que afunda na hora do toque, volta com mola, e troca para carregando e sucesso sem mudar de largura. A base de todo CTA WebCode.
themes: [aurora, clean-saas, editorial, cinematografico, brutalista, playful]
products: [landing, saas, erp, crm, ecommerce, fintech, mobile-app, admin, booking, delivery, edtech, habits, pos, subscription]
motion: low
tech: css-js
deps: []
a11y: aria-busy e aria-live durante o envio; botão fica desabilitado de verdade (não só visual). Foco visível. Altura mínima de 44px no toque.
perf: Só transform e opacity. Largura fixa durante loading evita reflow.
reference_name: Emil Kowalski (animations.dev)
reference_url: https://animations.dev
react: Componente <Button loading success> que reaproveita o shadcn Button e adiciona as camadas de estado.
status: stable
---

## Quando usar
- Todos os botões primários e secundários.

## Evite
- Scale menor que 0.95 no press. Spinner que muda a largura do botão.

## Implementação
- `:active { transform: scale(.97) }` com transição de 80ms; a volta usa a mola `--wc-motion-spring-snappy`.
- Três camadas sobrepostas (rótulo, spinner, check) no mesmo grid cell; só a opacidade e o blur mudam.
