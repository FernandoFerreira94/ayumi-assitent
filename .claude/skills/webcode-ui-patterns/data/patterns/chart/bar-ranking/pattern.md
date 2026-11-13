---
id: bar-ranking
title: Ranking em barras horizontais
category: chart
summary: Barras horizontais ordenadas da maior para a menor, com rótulo à esquerda, valor no fim da barra, um item destacado no acento e o resto neutro, "Outros" agrupando a cauda, troca de métrica (receita/pedidos) e tooltip com participação.
themes: [clean-saas, aurora, editorial, playful]
products: [saas, erp, ecommerce, marketplace, crm, logistics, admin, delivery, pos]
motion: low
tech: css-js
deps: []
a11y: Estrutura em lista ordenada (o ranking é a semântica), cada item com nome, valor e participação em texto; barras decorativas; troca de métrica num radio group; destaque também por peso de fonte, não só cor.
perf: Barras em HTML/CSS (largura por custom property animando scale), sem SVG nem biblioteca; reordenação com View Transitions quando disponível.
reference_name: Financial Times (Visual Vocabulary, Ranking)
reference_url: https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
react: Componente BarList com items, valueFormatter e highlight; reordenação com startViewTransition.
status: stable
---

## Quando usar
- "Qual é maior?": produtos mais vendidos, vendedores, cidades, motivos de chamado.

## Evite
- Colunas verticais com rótulos inclinados: use barras horizontais.
- Barras sem ordem (ordem alfabética só se o usuário pedir).
- 20 itens: mostre 5–8 e agrupe o resto em "Outros".

## Implementação
- Eixo começa no zero (a barra é o valor).
- Valor e % ao lado da barra; sem eixo nem grade.
- O item em foco (o do usuário, a loja atual) no acento; os outros em neutro.
