---
id: mega-menu
title: Mega menu de categorias (clique, teclado e intenção de hover)
category: navigation
summary: Menu de categorias de e-commerce ou site grande que abre no clique (e no hover com atraso e tolerância de diagonal), mostra subcategorias em colunas e um destaque, fecha com Esc ou ao sair, e vira lista sanfonada no mobile.
themes: [aurora, editorial, clean-saas]
products: [ecommerce, marketplace, institutional, b2b, edtech, realestate]
motion: low
tech: css-js
deps: []
a11y: Padrão disclosure (não role=menu): botão com aria-expanded e aria-controls abrindo um painel de links; Esc fecha e devolve o foco; Tab percorre os links na ordem; no mobile, detalhes sanfonados com button.
perf: Abre com opacity e translate curtos; atraso de 120ms no hover evita abrir por passagem acidental; fecha com 200ms de tolerância.
reference_name: WAI-ARIA APG (Disclosure Navigation Menu)
reference_url: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/
react: NavigationMenu do shadcn (Radix) já trata hover com atraso e teclado; aplique os tokens e o layout em colunas.
status: stable
---

## Quando usar
- Lojas e sites com 6+ categorias e subcategorias.

## Evite
- Abrir só no hover (inacessível no toque e no teclado).
- role="menu" para navegação de site (é para menus de aplicação).
- Painel que fecha ao mover o mouse na diagonal até um link.

## Implementação
- Hover abre após 120ms e fecha após 200ms fora do botão e do painel (tolerância de diagonal).
- Um painel aberto por vez; abrir outro fecha o anterior sem animação de saída.
- Abaixo de 768px: botão "Categorias" abre a lista com sanfona por categoria.
