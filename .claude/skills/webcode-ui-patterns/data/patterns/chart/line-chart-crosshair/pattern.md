---
id: line-chart-crosshair
title: Gráfico de linha com crosshair e comparação
category: chart
summary: Série temporal em SVG nativo com a série principal no acento e o período anterior em neutro tracejado, grade horizontal leve, eixo em pt-BR (R$ 10 mil, 1 out), crosshair com tooltip no mouse, toque e setas do teclado, título que diz a conclusão e tabela alternativa.
themes: [clean-saas, aurora, editorial]
products: [saas, erp, ecommerce, fintech, crm, marketplace, logistics, admin]
motion: low
tech: js
deps: []
a11y: SVG role="img" com aria-label resumindo a conclusão; área focável que move o crosshair com ←/→/Home/End e anuncia o ponto em role="status"; séries diferenciadas por cor e por traço (contínuo vs tracejado) com legenda e rótulo direto; tabela com os dados num <details>.
perf: SVG desenhado por JS uma vez e redesenhado só no ResizeObserver (texto em px reais, sem escala do viewBox); crosshair move um <g> por transform; sem biblioteca.
reference_name: Financial Times (Visual Vocabulary) e Stephen Few
reference_url: https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
react: Chart do shadcn (Recharts LineChart + ChartTooltip) quando já está no projeto; para 1–2 séries, este SVG próprio evita ~100 kB.
status: stable
---

## Quando usar
- Evolução no tempo de uma métrica, com comparação contra o período anterior ou meta.

## Evite
- Dois eixos Y. Métricas de escala diferente vão em dois gráficos.
- Mais de 4 linhas: destaque uma e deixe as outras neutras, ou use small multiples.
- Marcador em todos os pontos e número em todos os pontos.

## Implementação
- Série principal: traço de 2px no `accent` com área suave (`color-mix` do acento com a superfície). Comparação: `fg-muted` tracejado.
- Escala Y com "números bonitos" (1, 2, 2,5, 5 × 10ⁿ) e 4–5 linhas de grade.
- Tooltip: data completa, valor exato e a diferença para a comparação.
- Paleta: o repo ainda não tem tokens categóricos validados para gráfico. Até lá, uma série no acento e o resto neutro.
