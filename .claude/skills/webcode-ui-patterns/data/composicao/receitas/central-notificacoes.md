---
id: central-notificacoes
title: Central de notificações
summary: Sino com contagem abre painel com abas Todas/Não lidas, itens agrupados por dia e ações no próprio aviso.
intent: [notificações, sino, avisos, alertas do sistema, inbox de notificações, central de avisos]
group: comunicacao
platform: web
products: [saas, admin, crm, helpdesk, erp]
components: [popover, button, badge, tabs, item, avatar, relative-time, scroll-area, empty, animated-list]
patterns: [notification-center]
status: stable
---
## Quando usar
Avisos assíncronos do produto (menções, aprovações, falhas). Resultado da ação atual vai em `sonner`, não aqui.

## Estrutura
```
topbar: button ghost icon (sino) + badge de contagem (até 9+)
popover 380px: header "Notificações" + "Marcar todas como lidas" (link)
   tabs: Todas · Não lidas (contagem)
   scroll-area: grupos Hoje / Ontem / Antes
      item: avatar + texto ("Ana mencionou você em…") + relative-time + ponto de não lida
            ações inline quando cabe: "Aprovar" / "Ver"
   rodapé: "Ver todas" → página completa
```

## Comandos perto do contexto
- Ação do aviso no próprio `item` (Aprovar, Responder), sem abrir outra tela.
- Marcar lida ao abrir o item; "Marcar todas" no header do painel.
- Preferências de notificação: ícone de engrenagem no header do popover.

## Material e movimento
Popover com o material do tema (vidro opcional). Novo aviso com o painel aberto entra pelo `animated-list` no topo; o badge troca o número sem pular.

## Estados
Vazio: `empty` "Tudo em dia" sem ilustração grande. Carregando: 4 linhas de skeleton. Erro: linha com "Tentar de novo".

## Evitar
Badge com número sem limite; não lida só por cor (use ponto + negrito + texto oculto); modal para notificações; toast para cada aviso antigo.

## Variações
- Mobile: aba ou tela com `list-group` agrupada por dia e deslizar para arquivar.
- Preferências: link "Configurar avisos" no rodapé do painel.
- Aviso com ação (aprovar/recusar) resolve no próprio item.

## Esqueleto
```tsx
<Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Notificações, 3 não lidas">…<Badge/></Button></PopoverTrigger>
  <PopoverContent className="w-95 p-0"><PopoverHeader><PopoverTitle/></PopoverHeader>
    <Tabs><TabsList><TabsTrigger value="todas"/><TabsTrigger value="nao-lidas"/></TabsList>
      <TabsContent value="todas"><ScrollArea className="max-h-96"><AnimatedList>
        <Item size="sm"><Avatar/><ItemContent/><RelativeTime/></Item></AnimatedList></ScrollArea></TabsContent></Tabs>
  </PopoverContent></Popover>
```
