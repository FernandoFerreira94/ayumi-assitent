---
id: undo-delete
title: Excluir com desfazer (sem modal)
category: feedback
summary: A linha some na hora com transição curta, um toast oferece Desfazer por 6s e a exclusão só é confirmada no servidor quando o prazo acaba. Desfazer devolve o item à mesma posição e o foco ao lugar certo.
themes: [clean-saas, aurora, editorial, playful]
products: [saas, erp, crm, admin, helpdesk, mobile-app, ecommerce, ai-app, automation, field-service, habits, pos]
motion: low
tech: css-js
deps: []
a11y: Botão "Excluir tarefa X" por item; após excluir, o foco vai para o próximo item (ou para o título da lista); o toast é role="status" e o Desfazer é alcançável por Tab e pelo atalho Ctrl/⌘+Z; o prazo pausa com foco ou hover no toast.
perf: Exclusão otimista local; uma única chamada ao servidor por item ao fim do prazo (ou em lote); saída anima opacity e altura via grid-template-rows.
reference_name: NN/g (Confirmation dialogs: use undo instead)
reference_url: https://www.nngroup.com/articles/confirmation-dialog/
react: Sonner toast com action e onAutoClose para confirmar; mutação com TanStack Query adiada até o fim do prazo.
status: stable
---

## Quando usar
- Exclusões reversíveis e frequentes: tarefas, rascunhos, itens de lista, arquivos na lixeira.

## Evite
- Para o que é irreversível de verdade (excluir conta, emitir nota): use `confirm-alert-dialog`.
- Prazo curto demais (< 5s) ou toast que some com o foco dentro.

## Implementação
- Remoção visual imediata com `grid-template-rows: 1fr → 0fr` (sem animar `height`).
- Fila de exclusões pendentes; nova exclusão confirma a anterior.
- Ctrl/⌘+Z desfaz a última dentro do prazo.
