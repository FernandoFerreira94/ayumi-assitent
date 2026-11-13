---
id: confirm-alert-dialog
title: Alert dialog de confirmação destrutiva
category: overlay
summary: Confirmação para ação irreversível com título-pergunta, consequência concreta, foco no Cancelar e, para casos graves, digitar o nome para liberar. Dialog nativo, zero dependência.
themes: [clean-saas, aurora, editorial]
products: [saas, erp, crm, admin, helpdesk, fintech, devtools, automation, ai-app, booking, health, mobile-app, pos, subscription]
motion: low
tech: css-js
deps: []
a11y: role="alertdialog" com aria-labelledby e aria-describedby; showModal() prende o foco; foco inicial no Cancelar; Esc cancela; clique fora não fecha; o motivo do botão desabilitado é texto visível ligado por aria-describedby.
perf: Entrada e saída com @starting-style e transition-behavior allow-discrete, só opacity e scale. Nenhum layout em animação.
reference_name: WAI-ARIA APG (Alert Dialog) e Apple HIG (Alerts)
reference_url: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
react: Use @webcode/alert-dialog ou o AlertDialog do shadcn (Radix), com AlertDialogAction em variante destrutiva e o campo de confirmação controlado.
status: stable
---

## Quando usar
- Excluir projeto, conta, workspace; cancelar assinatura; emitir ou cancelar nota fiscal; ações em massa.
- Ações que afetam outras pessoas (remover membro, revogar acesso).

## Evite
- Confirmar ações reversíveis: faça a ação e ofereça desfazer no toast.
- "Tem certeza?" genérico com "Sim/Não". O título nomeia o objeto e os botões repetem o verbo.
- Digitar o nome em toda exclusão: reserve para o que é grave, senão vira hábito.

## Implementação
- `dialog` com `role="alertdialog"`, `autofocus` no Cancelar e `cancel` (Esc) tratado como cancelar.
- Clique no `::backdrop` não fecha (é uma decisão obrigatória); um leve "balanço" de escala avisa que precisa escolher.
- O botão destrutivo só libera quando o texto digitado bate com o nome; a instrução fica visível acima do campo.
- Ao confirmar, fecha e anuncia o resultado em `role="status"`.
