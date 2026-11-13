---
id: order-tracking
title: Acompanhamento de pedido
category: commerce
summary: Status do pedido como uma linha do tempo vertical com a etapa atual em destaque, previsão de chegada em faixa de horário, entregador com contato e histórico com hora, do "pagamento aprovado" ao "entregue".
themes: [aurora, clean-saas, playful]
products: [delivery, ecommerce, marketplace, logistics, mobile-app, field-service, subscription]
motion: low
tech: css-js
deps: []
a11y: A linha do tempo é uma lista ordenada; a etapa atual tem aria-current="step" e as futuras têm texto "pendente". A previsão é um status polite: muda de texto quando o status avança, sem alertas a cada segundo. Ícones decorativos com aria-hidden; cores reforçadas por texto ("Concluído").
perf: Atualização por SSE ou polling espaçado (30 s+) que só troca o que mudou; a barra de progresso anima transform. Mapa ao vivo, quando existir, carrega sob demanda depois do status.
reference_name: iFood e Mercado Livre (acompanhar pedido)
reference_url: https://www.ifood.com.br
react: Etapas vêm do back-end como lista com timestamps; o componente só deriva estado (concluída, atual, pendente). Notificações push e WhatsApp em cada mudança de etapa.
status: stable
---

## Quando usar
- Delivery, e-commerce e marketplace após a compra; também ordens de serviço ("técnico a caminho").
- Página que o cliente abre pelo link do e-mail ou do WhatsApp, sem login.

## Evite
- Previsão com horário exato que o sistema não consegue cumprir: use faixa ("entre 19:10 e 19:25").
- Status técnico da transportadora ("objeto em trânsito – unidade de tratamento"). Traduza para linguagem do cliente.
- Esconder o caminho de ajuda: "Problema com o pedido?" sempre visível.

## Implementação
- Cabeçalho: previsão grande + barra de progresso por etapa + frase do status atual.
- Lista `<ol>` com ponto e linha vertical; concluídas em `--wc-success`, atual em `--wc-accent` com pulso suave (desligado com movimento reduzido).
- Card do entregador: nome, veículo, placa parcial e botões "Mensagem" e "Ligar" (`tel:`) com 44px.
- Código de entrega (4 dígitos) visível quando a etapa for "Saiu para entrega".
