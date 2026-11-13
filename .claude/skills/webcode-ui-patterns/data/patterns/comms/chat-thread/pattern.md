---
id: chat-thread
title: Conversa de atendimento (estilo WhatsApp)
category: comms
summary: Thread de mensagens com bolhas agrupadas por autor, separador de dia, status de entrega (enviado, entregue, lido), respostas rápidas e campo que cresce com o texto. Base para CRM de atendimento, helpdesk e marketplace.
themes: [clean-saas, aurora, playful]
products: [crm, helpdesk, marketplace, delivery, health, saas, ai-app, field-service, realestate]
motion: low
tech: css-js
deps: []
a11y: A lista é role="log" com aria-live polite, então mensagem nova é lida sem roubar o foco. Cada bolha tem autor e hora para leitor de tela (texto oculto), e o status de entrega tem texto ("lida"), não só ícone. Enter envia e Shift+Enter quebra linha, explicado no rótulo do campo.
perf: Só a mensagem nova é inserida; scroll para o fim apenas se a pessoa já estava no fim (não puxa quem está lendo o histórico). field-sizing: content no textarea, com fallback por JS.
reference_name: WhatsApp Business (atendimento) e Intercom Messenger
reference_url: https://business.whatsapp.com/products/business-app
react: Lista virtualizada (TanStack Virtual) quando passar de algumas centenas de mensagens. Mensagens otimistas com id temporário e status "enviando" até o servidor confirmar.
status: stable
---

## Quando usar
- Inbox de atendimento (WhatsApp, Instagram, chat do site) dentro do CRM ou helpdesk.
- Conversa entre comprador e vendedor, paciente e clínica, cliente e entregador.

## Evite
- Bolhas para log técnico ou auditoria: use timeline.
- Rolar para o fim a cada mensagem nova enquanto a pessoa lê o histórico. Mostre um botão "Novas mensagens ↓".
- Esconder quem respondeu (bot, atendente) quando há mais de um.

## Implementação
- Bolhas consecutivas do mesmo autor em até 2 min se agrupam: só a última tem a ponta e a hora.
- Separador de dia ("Hoje", "Ontem", "segunda, 26 de out.") como elemento `role="separator"` com texto.
- Status: relógio (enviando) → ✓ enviado → ✓✓ entregue → ✓✓ em `--wc-accent` lida. Falha mostra "Não enviada · Tentar de novo".
- Respostas rápidas como chips acima do campo; `/` abre atalhos de mensagens salvas.
- Compositor: `textarea` com `field-sizing: content; max-height: 8lh`.
