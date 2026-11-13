---
id: integracoes-api
title: Integrações, chaves de API e webhooks
summary: Grade de integrações com status e conectar no próprio card, chaves de API mostradas uma vez e webhooks com últimas entregas.
intent: [integrações, chaves de api, webhooks, tokens, desenvolvedores, conectar apps]
group: gestao
platform: web
products: [saas, devtools, b2b, automation, erp]
components: [page-header, tabs, card, item, switch, badge, button, dialog, code-block, copy-button, alert, relative-time, popconfirm, timeline]
patterns: [url-tabs]
status: stable
---
## Quando usar
Área "Desenvolvedores" ou "Integrações" de um SaaS. Configurações gerais da conta: `configuracoes-em-card`.

## Estrutura
```
page-header + tabs na URL: Apps · Chaves de API · Webhooks
Apps: grade de card (logo, nome, 1 linha do que faz) · badge Conectado · botão Conectar/Configurar no rodapé do card
Chaves: card com item por chave (nome · prefixo wc_live_…a91 · criada · último uso relative-time) + menu …
   "Nova chave" → dialog: nome + escopo → mostra a chave UMA vez (code-block + copy-button + alert)
Webhooks: item por endpoint (URL · eventos · switch ativo) → detalhe com timeline das entregas (200/500, reenviar)
```

## Comandos perto do contexto
- Conectar/Configurar no rodapé de cada card de app; "Nova chave" e "Novo webhook" no topo da aba.
- Revogar chave no menu da linha com `popconfirm` ("Apps que usam esta chave param na hora").
- Reenviar entrega na própria linha da `timeline`.

## Material e movimento
Cards `interactive` só quando o card inteiro abre o app; senão `default` com botão. Ambiente em badge (Teste/Produção) sempre visível. Copiar troca ícone por check.

## Estados
Nenhuma chave: `empty` com "Criar primeira chave" + link da documentação. Webhook falhando: badge `destructive` "3 falhas" + último erro no detalhe. Chave recém-criada: `alert` "Copie agora; ela não aparece de novo".

## Evitar
Mostrar chave inteira na lista; revogar sem dizer o impacto; conectar app em nova aba sem voltar com status; lista de eventos de webhook sem busca.

## Variações
- OAuth de app: dialog com escopos pedidos em lista de checagem antes de autorizar.
- Logs de API: `data-table` com método, rota, status e latência + filtro por chave.
- Marketplace de apps: categorias em `toggle-group` e busca no topo.

## Esqueleto
```tsx
<Tabs value={aba}><TabsList><TabsTrigger value="apps">Apps</TabsTrigger>…</TabsList>
  <TabsContent value="chaves"><Card><Item><ItemContent><ItemTitle>Produção</ItemTitle>
    <ItemDescription>wc_live_…a91 · usada <RelativeTime date={uso}/></ItemDescription></ItemContent>
    <ItemActions><Popconfirm title="Revogar chave?"><Button variant="ghost">Revogar</Button></Popconfirm></ItemActions></Item></Card>
  </TabsContent></Tabs>
<Dialog><DialogContent><Alert/><CodeBlock code={key}/><CopyButton value={key}/></DialogContent></Dialog>
// Webhook: <Switch/> <Badge/> <Timeline><TimelineItem/></Timeline>
```
