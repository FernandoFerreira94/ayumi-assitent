---
id: bullet-goal
title: Barra de meta (bullet chart)
category: chart
summary: Para "estou dentro da meta?": barra do realizado sobre faixas de referência (ruim, ok, bom), marcador vertical da meta, projeção até o fim do período em tracejado e status com ícone e texto. Substitui o velocímetro decorativo.
themes: [clean-saas, aurora, editorial, playful]
products: [saas, erp, crm, fintech, helpdesk, logistics, edtech, habits]
motion: low
tech: css-js
deps: []
a11y: Cada linha tem uma frase completa para leitor de tela ("Vendas: R$ 71 mil de R$ 100 mil, 71%, projeção 104%, no ritmo"); status com ícone e palavra além da cor; barras decorativas.
perf: HTML/CSS com custom properties (--v, --meta, --proj); uma linha por métrica; sem SVG nem biblioteca.
reference_name: Stephen Few (Bullet Graph Design Specification)
reference_url: https://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf
react: Componente GoalBar com value, target, projection e ranges; status calculado pelo ritmo, não só pelo realizado.
status: stable
---

## Quando usar
- Metas de vendas, SLA, cota de plano, orçamento, progresso de curso.

## Evite
- Gauge/velocímetro: ocupa muito espaço e é difícil de comparar.
- Status pela porcentagem realizada no meio do mês: compare com o ritmo esperado (projeção).
- Verde/vermelho sem ícone e texto.

## Implementação
- Faixas em tons de neutro (claro → escuro), não em semáforo.
- Status: "no ritmo", "atenção" e "abaixo" vêm da projeção contra a meta.
- Para custo e orçamento, passar da meta é ruim: inverta a regra.
