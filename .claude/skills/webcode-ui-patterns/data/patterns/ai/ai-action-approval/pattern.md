---
id: ai-action-approval
title: Aprovação de ação do agente
category: ai
summary: Antes de agir fora da conversa (enviar mensagem, alterar registro, cobrar), o agente mostra um cartão com a prévia exata do que vai acontecer, editável, e pede a decisão: Aprovar, Editar ou Recusar, com permissão "Sempre para esta ação" revogável.
themes: [aurora, clean-saas]
products: [ai-app, automation, crm, helpdesk, saas, fintech, admin]
motion: low
tech: css-js
deps: []
a11y: Cartão é uma região com título ("O assistente quer enviar 212 mensagens"); foco vai para o título quando aparece; botões com verbos que respondem à pergunta; o resultado da decisão fica escrito no cartão e é anunciado.
perf: Cartão inline na conversa (não modal); prévia renderizada a partir do payload da ferramenta, sem nova chamada ao modelo.
reference_name: Microsoft (Guidelines for Human-AI Interaction, G9 e G17)
reference_url: https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/
react: Tool call com needsApproval (AI SDK) e addToolResult; permissões guardadas por ferramenta e escopo no servidor.
status: stable
---

## Quando usar
- Ações com efeito externo ou custo: enviar e-mail/WhatsApp, alterar ou excluir dados, cobrar, publicar.

## Evite
- Aprovação genérica ("Posso continuar?") sem mostrar o que vai acontecer.
- Pedir aprovação para leitura ou ação reversível com desfazer: isso treina o usuário a clicar sem ler.
- "Sempre permitir" sem lugar para revogar.

## Implementação
- Prévia concreta: destinatários (com contagem), texto final, valores, registros afetados.
- Destaque o que é irreversível e o custo ("212 mensagens · R$ 10,60 em créditos").
- Recusar pede, opcionalmente, o motivo, e o agente segue com essa informação.
