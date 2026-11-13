---
id: status-banner
title: Banner de status persistente
category: feedback
summary: Faixa no topo da área de trabalho para estados que duram (integração desconectada, plano no limite, cobrança falhou, manutenção), com ícone, texto, ação e dispensa quando faz sentido. Quatro tons semânticos.
themes: [clean-saas, aurora, editorial]
products: [saas, erp, crm, admin, helpdesk, fintech, automation, ai-app, subscription, delivery, logistics]
motion: low
tech: css-js
deps: []
a11y: role="status" para aviso e info, role="alert" só para erro que bloqueia; ícone aria-hidden com o tom também em texto ("Atenção:"); botão de dispensar com rótulo; não rouba o foco.
perf: Entra empurrando o conteúdo uma vez (sem layout shift posterior); dispensa guardada por id + versão no localStorage com try/catch.
reference_name: IBM Carbon (Notification, inline e actionable)
reference_url: https://carbondesignsystem.com/components/notification/usage/
react: Componente Banner variant tone action onDismiss sobre os tokens; para mensagens transitórias use o toast (Sonner).
status: stable
---

## Quando usar
- Estados que continuam valendo até alguém agir: conexão expirada, cartão recusado, cota em 80%, ambiente de testes.

## Evite
- Banner para confirmar ações (use toast).
- Mais de um banner ao mesmo tempo: mostre o mais grave.
- Dispensar um problema que continua: erro bloqueante não tem ×.

## Implementação
- Tons: info (`accent`), sucesso, atenção e erro com os pares `*-soft`/texto do tema.
- Texto: o que está acontecendo + consequência + ação ("O WhatsApp desconectou. Novas mensagens não chegam. Reconectar").
- Dispensa lembrada por versão da mensagem, não para sempre.
