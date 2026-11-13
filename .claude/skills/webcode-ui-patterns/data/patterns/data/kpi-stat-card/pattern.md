---
id: kpi-stat-card
title: Card de KPI com variação e sparkline
category: data
summary: Rótulo curto, valor grande com tabular-nums, variação vs período anterior com seta, sinal e cor pelo significado (custo subindo é ruim), sparkline em SVG e link para a lista que compõe o número.
themes: [clean-saas, aurora, playful]
products: [saas, erp, crm, admin, fintech, logistics, helpdesk, ecommerce, marketplace, delivery, pos]
motion: low
tech: css-js
deps: []
a11y: O card inteiro é um link com nome que inclui valor e variação; seta e sinal acompanham a cor; sparkline aria-hidden com o resumo em texto; número abreviado tem o exato em title e no texto acessível.
perf: SVG inline gerado uma vez; contagem do número só na primeira aparição e desligada em reduced motion.
reference_name: Stephen Few (Information Dashboard Design)
reference_url: https://www.perceptualedge.com/
react: Componente StatCard sobre o Card do @webcode; sparkline com Recharts (LineChart sem eixos) ou o mesmo SVG.
status: stable
---

## Quando usar
- Linha de 3–5 KPIs no topo de dashboards; resumo no topo de listas ("A receber: R$ 48 mil").

## Evite
- Mais de 5 KPIs por linha.
- Variação sem o período de comparação.
- Verde/vermelho pelo sinal sem pensar no significado.

## Implementação
- `data-good="up|down"` define se subir é bom; a cor segue o resultado, a seta segue o sinal.
- Valor abreviado com `Intl.NumberFormat(..., { notation: 'compact' })`.
- Sparkline: polyline normalizada em 0–100 com `vector-effect: non-scaling-stroke`.
