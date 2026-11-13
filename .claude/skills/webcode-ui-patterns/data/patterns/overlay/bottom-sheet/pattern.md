---
id: bottom-sheet
title: Bottom sheet nativo com arrastar para fechar
category: overlay
summary: Sheet que sobe com mola usando o dialog nativo, fecha com Esc, clique fora ou arrastando a alça para baixo. Padrão iOS no mobile web.
themes: [aurora, clean-saas, editorial, cinematografico, playful]
products: [mobile-app, ecommerce, delivery, booking, fintech, health, marketplace, ai-app, crm, edtech, event, logistics, pos, realestate, saas, subscription]
motion: medium
tech: css-js
deps: []
a11y: dialog com showModal() já prende o foco, fecha com Esc e devolve o foco ao botão de origem. Título ligado por aria-labelledby.
perf: Entrada e saída com @starting-style e transition-behavior allow-discrete. O arraste escreve transform direto, sem layout.
reference_name: Apple HIG (Sheets)
reference_url: https://developer.apple.com/design/human-interface-guidelines/sheets
react: Em React prefira o Drawer do shadcn (o Vaul está sem manutenção; confira a base atual do Drawer no registry). Use este padrão quando não houver React ou para manter zero dependência.
status: stable
---

## Quando usar
- Ações e detalhes contextuais no mobile: filtros, carrinho rápido, escolha de entrega.

## Evite
- Sheets em cima de sheets. Conteúdo que precisa de rolagem longa: vire uma página.
- No desktop: use dialog central ou painel lateral.

## Implementação
- `dialog[open]` anima `translate` de 100% para 0 com `--wc-motion-spring-smooth`; o `::backdrop` faz fade.
- Arrastar além de 120px ou com velocidade alta fecha; menos que isso volta com mola.
