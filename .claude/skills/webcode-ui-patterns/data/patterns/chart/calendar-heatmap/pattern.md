---
id: calendar-heatmap
title: Mapa de calor por dia e hora
category: chart
summary: Grade dia da semana × hora em escala sequencial de um só tom (do neutro ao acento), para achar picos de pedidos, atendimento ou uso. Legenda em degraus com valores, tooltip por célula, navegação por setas e o pico descrito em texto.
themes: [clean-saas, aurora, editorial, playful]
products: [saas, helpdesk, crm, delivery, ecommerce, logistics, health, pos, habits]
motion: none
tech: js
deps: []
a11y: Grade com role="grid", cabeçalhos de linha e coluna, roving tabindex e setas; cada célula com rótulo completo ("Sexta, 19h: 142 pedidos"); conclusão no título; escala em degraus com rótulos (não um gradiente contínuo sem números).
perf: Células em CSS grid, cor por color-mix com 5 degraus discretos (sem cálculo de cor por célula em JS); tooltip único reposicionado.
reference_name: Datawrapper Academy (heatmaps e escalas sequenciais)
reference_url: https://academy.datawrapper.de/article/117-color-palettes-for-your-map
react: Componente Heatmap com rows, cols, value e steps; para calendário anual (estilo GitHub), mesma lógica com semanas nas colunas.
status: stable
---

## Quando usar
- Padrões por dia e hora (pico de pedidos, chamados, acessos) e atividade ao longo do ano.

## Evite
- Arco-íris ou duas cores para magnitude: escala sequencial é um tom só, claro → escuro.
- Gradiente contínuo sem números na legenda.
- Células sem rótulo para leitor de tela.

## Implementação
- 5 degraus por quantil ou faixas redondas; o mais claro é quase a superfície, o mais escuro é o acento.
- Zero ou sem dado: célula vazia com borda, diferente do menor degrau.
- Escala ajustada para o modo escuro com os mesmos tokens (o `color-mix` com a superfície resolve).
