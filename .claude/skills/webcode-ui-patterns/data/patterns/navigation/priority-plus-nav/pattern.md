---
id: priority-plus-nav
title: Navegação "prioridade +" (o que não cabe vai para Mais)
category: navigation
summary: Barra horizontal que mostra quantos links couberem, em ordem de prioridade, e move o resto para um botão "Mais" com contagem. Nunca quebra linha nem rola de lado.
themes: [clean-saas, editorial, aurora, brutalista]
products: [editorial, institutional, saas, edtech, devtools, b2b, crm]
motion: low
tech: css-js
deps: []
a11y: Um único nav com links reais; os que não cabem saem da barra e entram na lista do "Mais" (nunca duplicados para o leitor de tela). "Mais" é disclosure com aria-expanded e diz quantos itens tem. Esc fecha e devolve o foco.
perf: ResizeObserver no container; larguras dos links medidas uma vez e cacheadas, então o recálculo é aritmética sem layout extra.
reference_name: Padrão Priority+ (Brad Frost) e abas do GitHub
reference_url: https://css-tricks.com/the-priority-navigation-pattern/
react: useResizeObserver no container + larguras em ref; renderize visíveis e ocultos a partir do mesmo array. Para o "Mais", DropdownMenu do shadcn com itens-link.
status: stable
---

## Quando usar
- Sites de conteúdo e seções de app com 6 a 12 destinos e largura variável.
- Abas de um registro (Visão geral, Atividade, Arquivos…) em telas estreitas.

## Evite
- Esconder o item ativo dentro de "Mais": ele sempre fica visível.
- Usar quando há 3 a 5 links: basta o layout normal.

## Implementação
- Meça cada link (largura + gap) uma vez; some até estourar o espaço menos a largura do "Mais".
- O item ativo é reservado primeiro; os demais entram por ordem de prioridade.
- Itens fora da barra recebem `hidden` e uma cópia na lista do "Mais" (o nav só lê os visíveis + a lista).
- Arraste a borda do demo para ver a redistribuição ao vivo.
