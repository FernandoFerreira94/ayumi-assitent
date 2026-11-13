---
id: ios-stack-navigation
title: Pilha de telas estilo iOS (push/pop + voltar pela borda)
category: page-transition
summary: Lista → detalhe → subtela com a transição de pilha do iOS. A tela nova entra pela direita, a anterior recua 30% e escurece, e arrastar a partir da borda esquerda volta de forma interativa, acompanhando o dedo.
themes: [aurora, clean-saas, playful]
products: [mobile-app, field-service, delivery, fintech, ecommerce, habits, logistics, crm]
motion: medium
tech: js
deps: []
a11y: Botão Voltar real com o título da tela anterior (o gesto é atalho, WCAG 2.5.7). Telas de baixo ficam inert. Ao avançar, o foco vai para o título da tela nova; ao voltar, retorna ao item que abriu. Reduced motion troca o deslize por fade curto.
perf: Só translate e opacity (compositor). Durante o arraste a transição é desligada e o deslocamento segue o pointer em px; na soltura a decisão usa distância (35%) ou velocidade (0,5px/ms) e a mola CSS termina o movimento.
reference_name: Apple HIG (Navigation and search) e WWDC18 Designing Fluid Interfaces
reference_url: https://developer.apple.com/design/human-interface-guidelines/navigation-and-search
react: Expo Router/React Navigation native-stack já faz isso nativamente (gestureEnabled). Na web, um StackNavigator com estado [rotas] e history.pushState/popstate para o voltar do sistema; View Transitions como alternativa sem gesto.
status: stable
---

## Quando usar
- Hierarquia lista → detalhe → subdetalhe dentro de uma aba (OS, pedido, conta, conversa).
- PWA instalado ou app com cara de nativo, onde a pessoa espera o gesto de voltar do iOS.

## Evite
- Para trocar de aba (tab bar troca instantânea, sem deslize).
- Para tarefas modais e independentes (criar, editar): use sheet ou modal em cartão.
- Em sites comuns no Safari: a borda esquerda já é o voltar do navegador. Ative o gesto só em modo standalone (`display-mode: standalone`).

## Implementação
- Cada tela é `position:absolute; inset:0`. Push: nova em `translate:100%` → 0; anterior → `-30%` com véu escuro. Pop: o inverso.
- Gesto começa só a até 24px da borda esquerda e só se o movimento for mais horizontal que vertical.
- Integre com `history`: push chama `pushState`; `popstate` faz pop (cobre o botão voltar do Android e do navegador).
- Preserve scroll e estado da tela de baixo: ela só é escondida, não desmontada.
- Equivalência RN/Expo: `@react-navigation/native-stack` (UINavigationController de verdade); não reimplemente em JS.
