---
id: rastreio-pedido
title: Detalhe e rastreio de pedido
summary: Status atual em destaque, linha do tempo das etapas, dados em lista chave-valor e a ação que a etapa pede.
intent: [rastreio, acompanhar pedido, detalhe do pedido, status da entrega, ordem de serviço, histórico do pedido]
group: comercio
platform: ambos
products: [ecommerce, delivery, logistics, field-service, marketplace]
components: [card, badge, timeline, description-list, copy-button, button, relative-time, alert, live-island]
patterns: []
status: stable
---
## Quando usar
Acompanhar algo que anda por etapas (entrega, OS, chamado). Lista de vários pedidos: `lista-pedidos-ios` ou `tabela-admin`.

## Estrutura
```
card de status: badge grande ("Saiu para entrega") + previsão ("Chega até 15h") + ação da etapa
timeline: etapas com ícone + texto + relative-time; atual destacada; futuras em muted
description-list: Número (copyValue) · Endereço · Pagamento · Itens
ajuda: "Problema com o pedido?" (link) no fim
mobile em andamento: live-island com a etapa atual
```

## Comandos perto do contexto
- A ação que a etapa pede fica no card de status ("Confirmar recebimento", "Ver código de retirada").
- Copiar código de rastreio ao lado dele (`copyValue` do item ou `copy-button`).
- Cancelar/trocar só enquanto possível, no fim da página, nunca como primária.

## Material e movimento
Um card de status; o resto sem card. Etapa nova entra com a transição curta do componente; sem pulsar infinito.

## Estados
Atraso: `alert` de aviso no card de status com o novo prazo. Falha na entrega: etapa em perigo + o que fazer. Concluído: timeline inteira em ✓ e ação "Avaliar".

## Evitar
Etapa só por cor; previsão vaga ("em breve"); esconder o código de rastreio; timeline ao contrário sem dizer.

## Variações
- Ordem de serviço: técnico com `avatar`, janela de chegada e "Ligar".
- Entrega ao vivo: `live-island` com tempo estimado.
- Devolução/troca: etapas próprias na `timeline` e etiqueta para copiar.

## Esqueleto
```tsx
<Card><CardContent><Badge variant="warning" size="lg">Saiu para entrega</Badge><p>Chega até 15h</p>
  <Button>Ver código de retirada</Button></CardContent></Card>
<Timeline><TimelineItem status="current"><TimelineTitle/><TimelineTime><RelativeTime/></TimelineTime></TimelineItem></Timeline>
<DescriptionList><DescriptionItem label="Pedido" copyValue="1042">#1042</DescriptionItem></DescriptionList>
```
