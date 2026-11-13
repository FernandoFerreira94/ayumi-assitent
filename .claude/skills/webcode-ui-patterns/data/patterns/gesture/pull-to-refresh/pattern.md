---
id: pull-to-refresh
title: Puxar para atualizar (com botão)
category: gesture
summary: Na lista rolável, puxar para baixo no topo mostra um indicador com resistência que gira conforme o puxão e, passado o limiar, atualiza e insere os itens novos. Um botão "Atualizar" e o anúncio de "3 novos" cobrem quem não usa gesto.
themes: [aurora, clean-saas, playful]
products: [mobile-app, delivery, logistics, helpdesk, crm, fintech, health, ai-app, field-service]
motion: medium
tech: js
deps: []
a11y: Botão Atualizar visível (WCAG 2.5.7) com aria-busy durante a carga; resultado em role="status" ("3 novas mensagens" ou "Nada novo"); indicador decorativo aria-hidden; foco não muda.
perf: Gesto só começa com scrollTop = 0 (touchmove não passivo só enquanto puxa; mouse via pointer events); overscroll-behavior-y: contain evita o pull nativo do navegador competir; translate com resistência (raiz quadrada) e spring CSS no retorno.
reference_name: Material Design (Swipe to refresh)
reference_url: https://m3.material.io/foundations/interaction/gestures
react: Hook usePullToRefresh(ref, onRefresh) com touch + pointer events; onRefresh = queryClient.invalidateQueries.
status: stable
---

## Quando usar
- Feeds e listas que mudam com frequência e são lidas do topo: pedidos, mensagens, entregas.

## Evite
- Em listas que se atualizam sozinhas em tempo real (o gesto vira placebo).
- Em páginas que já têm overscroll nativo do navegador ativo: desligue com `overscroll-behavior`.
- Indicador que bloqueia a lista enquanto carrega.

## Implementação
- Limiar ~64px de deslocamento visual; resistência crescente; vibração leve ao cruzar.
- Itens novos entram no topo com destaque breve; mantenha a posição de leitura se o usuário já rolou.
