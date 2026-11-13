---
id: list-detail-split
title: Lista + detalhe (split view do iPad) que vira pilha no celular
category: navigation
summary: Duas colunas a partir de 720px (lista à esquerda, detalhe à direita, item selecionado destacado) e uma pilha só no celular: tocar no item empurra o detalhe por cima com "Voltar". Mesma marcação nos dois tamanhos, troca por container query.
themes: [clean-saas, aurora, editorial]
products: [mobile-app, crm, helpdesk, admin, saas, erp, b2b]
motion: low
tech: css-js
deps: []
a11y: Lista é uma lista de links com aria-current no item aberto. Ao abrir no celular, o foco vai para o título do detalhe; "Voltar" devolve o foco ao item de origem. Detalhe é uma região rotulada pelo título. Entrada lateral desligada em reduced motion.
perf: Sem libs. A troca de layout é @container (largura do componente, não da janela), então funciona dentro de painel, modal ou Artifact. Só o detalhe aberto é renderizado.
reference_name: Apple HIG (Split views) e Mail no iPad
reference_url: https://developer.apple.com/design/human-interface-guidelines/split-views
react: Use a rota como estado (/mensagens/[id]): no desktop as duas colunas renderizam juntas; no celular o layout mostra só a coluna da rota atual. Guarde o scroll da lista ao voltar.
status: beta
---

## Quando usar
- Caixa de entrada, tickets, contatos, pedidos: muitos itens curtos e um detalhe longo.
- Telas que precisam funcionar no iPad em paisagem e no celular com o mesmo código.

## Evite
- Três colunas no tablet em retrato: abaixo de ~1000px use duas.
- Abrir o detalhe num modal no desktop: a lista some e a pessoa perde o contexto.
- Esconder o item selecionado na lista (sem destaque, a pessoa não sabe onde está).

## Implementação
- Contêiner com `container-type: inline-size`; a partir de 720px vira grade `minmax(280px, 340px) 1fr`.
- Abaixo disso, o detalhe é `position: absolute; inset: 0` e entra com `translate` quando `data-open` está ligado.
- Teclado: setas ↑/↓ andam pela lista, Enter abre, Esc fecha no celular.
- Estado vazio no desktop: "Escolha uma conversa" em vez de coluna em branco.
