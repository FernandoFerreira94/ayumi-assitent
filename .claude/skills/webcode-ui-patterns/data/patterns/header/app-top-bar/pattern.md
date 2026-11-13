---
id: app-top-bar
title: Barra superior de app (breadcrumb, busca ⌘K, notificações e conta)
category: header
summary: Header de aplicação logada com trilha da página, gatilho de busca global com atalho, central de notificações com contador e marcar como lidas, e acesso à conta. Denso, estável, sem efeito.
themes: [clean-saas, aurora, editorial, playful]
products: [saas, erp, crm, admin, helpdesk, automation, devtools, logistics]
motion: low
tech: css-js
deps: []
a11y: Breadcrumb em nav rotulado com aria-current. Botão de notificações diz a contagem no nome ("Notificações, 3 não lidas"). Painel é disclosure não modal; Esc fecha e devolve o foco. Atalho ⌘K/Ctrl+K anunciado com aria-keyshortcuts.
perf: Nenhuma animação contínua. Painel abre com opacity e escala curtas; a lista virtualiza em produção se passar de 50 itens.
reference_name: Apple HIG (Toolbars), Linear e Vercel Dashboard
reference_url: https://developer.apple.com/design/human-interface-guidelines/toolbars
react: Combine com Sidebar do shadcn (SidebarTrigger no início), Command para a busca, Popover para notificações e DropdownMenu para a conta.
status: stable
---

## Quando usar
- Todo app logado: SaaS, ERP, CRM, admin, helpdesk.

## Evite
- Repetir no header a navegação que já está na sidebar.
- Notificação sem estado vazio ou sem "marcar todas como lidas".

## Implementação
- Altura fixa de 56px, borda inferior, `--wc-surface`. Nada de vidro em app denso.
- Busca é um botão que parece campo (abre o `command-palette`); mostra o atalho de acordo com o sistema (⌘ no Mac, Ctrl nos demais).
- Notificações: contador some quando zera; "marcar todas como lidas" atualiza nome acessível e lista.
- No mobile, o breadcrumb mostra só a página atual e a busca vira ícone.
