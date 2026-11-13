---
id: search-header
title: Header de loja com busca em destaque e sugestões
category: header
summary: Header de e-commerce com busca central (combobox com buscas recentes e sugestões), conta, favoritos e sacola com contador, mais uma faixa de categorias rolável. No mobile a busca desce para uma linha própria.
themes: [clean-saas, aurora, editorial, playful]
products: [ecommerce, marketplace, delivery, b2b, realestate]
motion: low
tech: css-js
deps: []
a11y: Padrão combobox da APG (role=combobox, aria-expanded, aria-activedescendant, listbox). Setas navegam, Enter escolhe, Esc fecha e limpa. Contador da sacola em texto acessível ("Sacola, 3 itens"). Faixa de categorias é nav rotulado.
perf: Sugestões filtradas em memória a cada tecla; em produção, debounce de 150ms e AbortController na requisição. A faixa de categorias rola com overflow-x e scroll-snap, sem JS.
reference_name: Mercado Livre e Amazon (busca como protagonista)
reference_url: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/
react: Use o Command do shadcn dentro de um Popover ancorado no input, ou cmdk direto; busque com useDeferredValue + fetch abortável.
status: stable
---

## Quando usar
- Lojas e marketplaces com catálogo grande, onde a maioria chega pela busca.

## Evite
- Busca escondida atrás de um ícone em loja grande: derruba conversão.
- Sugestão que muda a ordem enquanto a pessoa navega com setas.

## Implementação
- Grid de três áreas (logo, busca, ações). Abaixo de 720px a busca vai para a segunda linha com `grid-template-areas`.
- Lista aberta só com foco e conteúdo; com campo vazio mostra "Buscas recentes".
- Destaque o trecho digitado com `<mark>` nas sugestões.
- Contador da sacola anima com escala curta quando muda (reduced motion: sem escala).
