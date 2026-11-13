---
id: mobile-search-screen
title: Busca mobile (foco, recentes e cancelar)
category: navigation
summary: Tocar na busca transforma a tela: o título sai, o campo sobe, aparece "Cancelar", e antes de digitar a pessoa vê buscas recentes e sugestões. Resultados filtram enquanto digita, com escopos em chips e termo destacado.
themes: [aurora, clean-saas, playful]
products: [mobile-app, ecommerce, delivery, field-service, marketplace, fintech, habits]
motion: medium
tech: js
deps: []
a11y: Campo type="search" com rótulo e enterkeyhint="search"; quantidade de resultados em role="status"; recentes removíveis por botão com nome ("Remover 'compressor'"); Cancelar devolve o foco ao início; destaque com <mark>, não só cor.
perf: Filtro local com debounce de 120ms; na API, cancele a requisição anterior (AbortController). Animação do cabeçalho só com translate/opacity e grid-template-rows.
reference_name: Apple HIG (Search fields) e Material 3 (Search)
reference_url: https://developer.apple.com/design/human-interface-guidelines/search-fields
react: Command @webcode (cmdk) serve de motor; a apresentação mobile é uma tela/sheet de altura total. Estado da busca na URL (?q=) para voltar com o resultado. Expo: headerSearchBarOptions do native-stack.
status: stable
---

## Quando usar
- Apps com catálogo, lista longa ou histórico: produtos, OS, clientes, transações.

## Evite
- Busca escondida atrás de ícone quando é a forma principal de navegar (e-commerce, delivery): deixe o campo visível.
- Exigir Enter para ver resultado em listas locais.
- Estado vazio sem saída: sugira corrigir o termo, trocar o escopo ou falar com alguém.

## Implementação
- Foco: título grande colapsa (grid-template-rows 1fr → 0fr) e "Cancelar" entra pela direita.
- Recentes: até 5, mais novo primeiro, salvos localmente; "Limpar" apaga tudo.
- Escopos em chips de rolagem horizontal ("Tudo", "Abertas", "Clientes").
- No resultado, Enter fecha o teclado (blur) e mantém a lista.
