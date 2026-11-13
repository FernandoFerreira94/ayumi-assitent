---
id: devtools
title: Docs e dev tools
family: Apps e ferramentas
summary: Documentação, portal de API ou painel de desenvolvedor. Busca excelente, exemplos copiáveis e caminho mínimo até o primeiro sucesso.
kpi: Tempo até a primeira chamada de API bem-sucedida e buscas sem resultado
themes: [clean-saas, editorial]
patterns: [command-palette, copy-feedback, glass-sticky-header, top-progress-bar, toast-stack, empty-state, skeleton-shimmer, confirm-alert-dialog, collapsible-sidebar, breadcrumb-overflow, skip-link-focus, ai-prompt-composer, ai-streaming-response, ai-agent-steps, product-tour, hide-on-scroll-header, announcement-cta-header, dropdown-menu-button, priority-plus-nav, login-split-screen, two-factor-challenge, footer-saas-columns, pricing-tiers, plan-comparison-table, logo-cloud-marquee]
density: comfortable
radius: 6
components: [button, command, tabs, card, badge, tooltip, dropdown-menu, sheet, dialog, alert-dialog, input, field, table, sonner, scroll-area, separator, tour]
status: stable
---

## Objetivo
O desenvolvedor chega pelo buscador ou pelo ⌘K, copia um exemplo que funciona e faz a primeira integração em minutos.

## Layout
- Header com busca (⌘K) e seletor de versão; sidebar com seções; conteúdo com sumário à direita.
- Mobile: sidebar em sheet, sumário recolhido no topo.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Início rápido | 3–5 passos numerados, chave de API inserida no exemplo para logado | copy-feedback |
| Guia | conceito → exemplo → variações → erros comuns | — |
| Referência de API | endpoint, parâmetros em tabela, exemplo em abas por linguagem, resposta | copy-feedback |
| Busca (⌘K) | páginas, seções e símbolos, recentes, atalhos | command-palette |
| Painel | chaves (criar, revogar), uso, logs de requisição, webhooks | confirm-alert-dialog, toast-stack |

## Regras
- Todo bloco de código com copiar, linguagem visível e linhas destacáveis; exemplos executáveis de verdade.
- Abas de linguagem lembram a escolha em todo o site.
- Âncora copiável em cada título; URL estável por versão.
- Chave de API mostrada uma vez, mascarada depois; revogar pede confirmação com o nome.
- Mensagens de erro da API documentadas com causa e correção.
- "Esta página ajudou?" e editar no GitHub no fim.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, chave de API, primeiro request e logs; ofereça pular direto para a doc. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS (painel e referência); Editorial para guias longos.
- **Densidade:** confortável no texto, compacta em tabelas de parâmetros e logs.
- **Componentes-chave:** Command, Tabs de linguagem, Table de parâmetros, AlertDialog de revogação.

## Estados críticos
- Busca sem resultado: sugere termos e link para suporte.
- Versão antiga: faixa avisando e link para a atual.

## Anti-padrões
- Exemplos com placeholders que não compilam.
- Referência gerada sem descrição dos campos.
- Busca que só acha títulos.

## Referências
- WAI-ARIA APG, Combobox (busca): https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- Vercel Web Interface Guidelines: https://vercel.com/design/guidelines
