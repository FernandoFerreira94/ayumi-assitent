---
id: kanban-board
title: Kanban com arrastar e alternativa por teclado
category: data
summary: Quadro de etapas (funil, chamados, pedidos) em que o card é arrastado entre colunas com ponteiro ou movido por teclado e por menu, com contagem e soma por coluna e anúncio para leitor de tela.
themes: [clean-saas, aurora, playful]
products: [crm, helpdesk, saas, erp, admin, field-service, delivery, automation, edtech]
motion: medium
tech: js
deps: []
a11y: Arrastar nunca é o único caminho (WCAG 2.5.7): cada card tem botão "Mover" com as etapas, e com o card focado as setas ←/→ trocam de coluna. Cada mudança é anunciada ("Café Aroma movido para Proposta, posição 1 de 3"). Colunas são listas com título e contagem.
perf: Pointer Events com um card fantasma em transform; nada de HTML5 drag-and-drop (ruim no toque). Só a coluna de origem e a de destino recalculam a soma.
reference_name: Atlassian (Pragmatic drag and drop, acessibilidade) e WCAG 2.2 (2.5.7 Dragging Movements)
reference_url: https://atlassian.design/components/pragmatic-drag-and-drop/design-guidelines
react: Estado como { colunas: { id: cardIds[] } } num reducer; dnd-kit (com KeyboardSensor) ou Pragmatic drag and drop em projetos maiores (ADR). Persistir com otimista + rollback se a API falhar.
status: stable
---

## Quando usar
- Funil de vendas de CRM, fila de chamados, pedidos em preparo, ordens de serviço.
- Quando a etapa é o dado mais importante do item e as etapas são poucas (3 a 7).

## Evite
- Mais de 7 colunas ou colunas com centenas de cards: use tabela com filtro por etapa.
- Mover para uma etapa que exige dado (motivo de perda, valor) sem abrir o formulário na hora.
- Cards altos com muita informação: título, valor, responsável e prazo bastam.

## Implementação
- Arraste por Pointer Events com limiar de 4px antes de começar (clique continua abrindo o card). Mostre o lugar de soltar com uma linha na coluna de destino.
- Teclado: card focável; ←/→ movem de coluna, Alt+↑/↓ reordenam. Menu "Mover para…" para quem não usa atalho.
- Cabeçalho da coluna: nome, quantidade e soma (R$) com tabular-nums.
- Mobile: colunas em scroll horizontal com scroll-snap, uma por tela; arrastar entre colunas vira só o menu "Mover".
