---
id: card-modal-sheet
title: Modal em cartão (page sheet do iOS)
category: overlay
summary: A tarefa abre num cartão que sobe por cima da tela, deixando a tela de trás recuada, arredondada e visível no topo. Arrastar para baixo fecha; com rascunho, pede confirmação em vez de perder o que foi digitado.
themes: [aurora, clean-saas, playful, cinematografico]
products: [mobile-app, field-service, fintech, ecommerce, habits, delivery, health]
motion: medium
tech: js
deps: []
a11y: role="dialog" + aria-modal e título; fundo inert; foco no primeiro campo e retorno ao botão que abriu; Esc e botão Cancelar fecham (o arraste é atalho, WCAG 2.5.7); rascunho nunca é descartado sem confirmação.
perf: Fundo anima scale + border-radius e o cartão só translate, ambos no compositor. Arraste por pointer events com resistência ao puxar para cima; soltura decide por 25% da altura ou velocidade.
reference_name: Apple HIG (Sheets) e UIKit pageSheet
reference_url: https://developer.apple.com/design/human-interface-guidelines/sheets
react: Na web, componha com o Drawer @webcode (sem vaul, ADR 0006) passando shouldScaleBackground. Em Expo Router, presentation "modal" no Stack.Screen já entrega o page sheet nativo.
status: stable
---

## Quando usar
- Tarefas curtas e independentes que precisam de foco: nova OS, novo lançamento, avaliar pedido, editar perfil.
- Quando a pessoa precisa ver que a tela de origem continua lá e que vai voltar a ela.

## Evite
- Para escolhas rápidas (2–4 opções): use action sheet ou bottom sheet.
- Modal em cartão sobre outro modal em cartão. Navegue dentro do cartão (pilha interna).
- Fechar pelo arraste quando há dados digitados sem perguntar.

## Implementação
- Cartão ocupa a tela menos uma faixa de ~12px no topo (mais a safe area); fundo vai a `scale(.93)` com raio grande.
- Cabeçalho: Cancelar à esquerda, título ao centro, ação primária (Salvar) à direita, desabilitada até o formulário ser válido.
- Arraste só a partir do cabeçalho/alça ou quando o conteúdo está no topo do scroll.
- Rascunho sujo: o arraste volta à posição e abre a confirmação "Descartar alterações?".
