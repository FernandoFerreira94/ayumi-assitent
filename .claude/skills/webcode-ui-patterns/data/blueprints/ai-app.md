---
id: ai-app
title: App de IA (chat, copiloto, agente)
family: Apps e ferramentas
summary: Produto cuja interface principal é conversar com IA ou delegar tarefas a um agente. Controle, contexto e confiança antes de efeito.
kpi: Tarefas concluídas com IA sem retrabalho e retenção semanal
themes: [aurora, clean-saas]
patterns: [command-palette, copy-feedback, skeleton-shimmer, toast-stack, empty-state, bottom-sheet, side-sheet-detail, confirm-alert-dialog, blur-text-reveal, collapsible-sidebar, status-banner, async-button-states, ai-prompt-composer, ai-streaming-response, ai-agent-steps, ai-action-approval, large-title-collapse, product-tour, announcement-cta-header, floating-pill-header, dropdown-menu-button, login-split-screen, auth-flip-card, signup-multi-step, footer-saas-columns, footer-minimal, pricing-tiers, faq-accordion, chat-thread]
density: comfortable
radius: 12
components: [button, textarea, scroll-area, sheet, drawer, dialog, alert-dialog, dropdown-menu, command, tooltip, popover, badge, avatar, sonner, skeleton, tabs, switch, tour]
status: stable
---

## Objetivo
A pessoa pede em linguagem natural, entende o que a IA está fazendo, revisa antes do que importa e reaproveita o resultado.

## Layout
- Sidebar com conversas/projetos (busca, fixados); área central de conversa com largura de leitura; painel lateral para fontes, arquivos ou artefato gerado.
- Mobile: conversa em tela cheia, histórico em sheet, fontes em bottom sheet.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Nova conversa | prompt com exemplos clicáveis, anexos, escolha de modo/modelo discreta | empty-state |
| Conversa | mensagens, streaming, parar, regenerar, editar, copiar por bloco, citações | copy-feedback, blur-text-reveal |
| Ação de agente | plano, passos com status, prévia da ação externa, aprovar/recusar | confirm-alert-dialog, side-sheet-detail |
| Fontes/artefato | documento, código ou tabela gerada, versões | side-sheet-detail |
| Configurações | memória, dados, conexões, permissões revogáveis | — |

## Regras
- Siga `guidelines/ai-interfaces.md`.
- Primeiro sinal de vida em até 1s; streaming que não pula o layout; Parar sempre visível.
- Ações com efeito fora do app (enviar, pagar, publicar, apagar) pedem aprovação com prévia; reversíveis podem rodar com desfazer.
- Memória e contexto visíveis e editáveis ("Usando: 3 arquivos, sua memória").
- Erros de ferramenta em linguagem humana com caminho manual.
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, onde escrever, como anexar contexto e onde revisar/aprovar ações da IA. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Aurora (consumer, escuro por padrão) ou Clean SaaS quando a IA é função dentro de um produto de trabalho.
- **Densidade:** confortável; mensagens com largura máxima ~70ch.
- **Componentes-chave:** Textarea autoexpansível, ScrollArea com âncora no fim, Sheet de fontes, AlertDialog de aprovação, Command.

## Estados críticos
- Limite de uso atingido: quanto falta para renovar e opção de plano.
- Resposta cortada/erro no meio: continuar de onde parou.
- Conteúdo recusado: explica sem culpar e sugere reformular.

## Anti-padrões
- Caixa de texto vazia sem exemplos.
- Efeito de digitação lento artificial.
- Agente que age sem mostrar o que fez.

## Referências
- Apple HIG, Generative AI: https://developer.apple.com/design/human-interface-guidelines/generative-ai
- Shape of AI: https://www.shapeof.ai/
