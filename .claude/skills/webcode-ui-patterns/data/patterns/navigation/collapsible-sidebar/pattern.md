---
id: collapsible-sidebar
title: Sidebar recolhível com grupos e workspace
category: navigation
summary: Sidebar de app com workspace no topo, grupos rotulados, item ativo com aria-current, badges só para o que exige ação e modo recolhido só com ícones (tooltip) lembrado entre visitas. No mobile vira painel modal.
themes: [clean-saas, aurora]
products: [saas, erp, crm, admin, helpdesk, logistics, automation, devtools, ai-app, b2b]
motion: low
tech: css-js
deps: []
a11y: nav rotulada; botão de recolher com aria-expanded e aria-controls; item ativo com aria-current="page"; no modo recolhido o rótulo vira title + texto acessível (não some do leitor de tela); no mobile o painel é um dialog modal com Esc.
perf: Largura anima com grid-template-columns (uma propriedade, sem layout dos filhos a cada frame além do container); preferência em localStorage com try/catch.
reference_name: Apple HIG (Sidebars)
reference_url: https://developer.apple.com/design/human-interface-guidelines/sidebars
react: Use o Sidebar do shadcn (SidebarProvider, collapsible="icon") com os tokens do @webcode; o estado fica no cookie para SSR sem piscar.
status: stable
---

## Quando usar
- Apps com 5–12 áreas, usados por horas (SaaS, ERP, CRM, admin).

## Evite
- Mais de 2 níveis de aninhamento.
- Badges de total ("1.240 clientes").
- Recolher sozinho ao navegar no desktop.

## Implementação
- `[data-collapsed]` no shell troca a coluna de 248px para 64px; rótulos ficam visualmente ocultos, mas acessíveis.
- Atalho `[` alterna (mostrado no tooltip do botão).
- Abaixo de 768px a sidebar some e o botão de menu abre um `dialog` com a mesma navegação.
