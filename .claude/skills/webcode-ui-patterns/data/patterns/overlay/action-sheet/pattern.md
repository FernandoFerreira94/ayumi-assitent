---
id: action-sheet
title: Action sheet (escolha rápida com cancelar)
category: overlay
summary: Lista curta de ações que sobe do rodapé, com a destrutiva em vermelho e o Cancelar separado e mais forte, no alcance do polegar. Ideal para "o que fazer com isto?" depois de um toque.
themes: [aurora, clean-saas, playful]
products: [mobile-app, field-service, delivery, ecommerce, fintech, habits, health]
motion: low
tech: css-js
deps: []
a11y: dialog nativo com showModal (foco preso, Esc fecha, foco volta ao gatilho); título e mensagem associados; ações são botões reais de 56px; Cancelar sempre presente; resultado anunciado em role="status".
perf: Só translate e opacity com @starting-style; zero JS de animação. Toque no scrim fecha.
reference_name: Apple HIG (Action sheets) e Material 3 (Bottom sheets)
reference_url: https://developer.apple.com/design/human-interface-guidelines/action-sheets
react: Drawer @webcode com lista de botões, ou DropdownMenu em telas largas (mesmo conteúdo, apresentação responsiva). Expo: ActionSheetIOS no iOS e @expo/react-native-action-sheet para os dois.
status: stable
---

## Quando usar
- 2–5 ações sobre um objeto que acabou de ser tocado: foto (tirar, escolher, remover), pedido (compartilhar, repetir, cancelar).
- Confirmação de ação destrutiva iniciada pela própria pessoa ("Excluir rascunho").

## Evite
- Mais de 5 ações ou ações com explicação longa: use bottom sheet com lista.
- Pergunta que precisa de decisão consciente e bloqueante (dinheiro, dados): use alert dialog no centro.
- No desktop: apresente como menu ancorado ao botão.

## Implementação
- Grupo de ações + Cancelar em bloco separado; destrutiva no fim do grupo e em `danger`.
- Ações em verbo ("Remover foto"), nunca "Sim/Não".
- `env(safe-area-inset-bottom)` abaixo do Cancelar.
