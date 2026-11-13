---
id: telas-desfecho
title: Sucesso, erro, vazio e sem acesso
summary: Cada desfecho diz o que houve e oferece o próximo passo; vazio ensina, erro tem saída, 403/404 levam de volta.
intent: [tela de erro, 404, 403, sem permissão, sucesso, pagamento aprovado, estado vazio, offline, manutenção]
group: paginas
platform: ambos
products: [saas, ecommerce, fintech, admin, mobile-app]
components: [result, empty, button, banner, alert, locked-feature]
patterns: [empty-state, status-banner]
status: stable
---
## Quando usar
Fim de fluxo (sucesso/falha), rota inexistente, sem permissão, sem conexão, lista sem nada. Erro de um campo não: fica no campo.

## Estrutura
```
página/dialog inteiro: result (sucesso · erro · aviso · 403 · 404 · 500)
   título do que houve + 1 frase + ação principal + secundária (link)
vazio dentro de um bloco: empty no lugar do conteúdo, com a ação que resolve
sistema degradado/offline: banner no topo, a tela continua usável
recurso pago: locked-feature
```

## Comandos perto do contexto
- A ação que resolve vem junto: "Tentar de novo", "Voltar ao início", "Pedir acesso".
- Vazio por filtro: "Limpar filtros"; vazio de primeira vez: a ação de criar.

## Material e movimento
Ícone tingido pelo tom do status, check desenhado uma vez no sucesso. Sem ilustração grande em app de uso diário. Erro sem tremida na tela inteira.

## Estados
Erro com código de suporte copiável. 403 diz quem pode liberar. Offline: `banner` "Sem conexão, mostrando dados de 10:42", sem bloquear.

## Evitar
"Ops!" e culpar a pessoa; tela de erro sem saída; o mesmo vazio para primeira vez e para filtro; `alert` permanente para sucesso.

## Variações
- Manutenção programada: `banner` com horário de volta.
- Pagamento recusado: `result` com motivo e "Tentar outra forma".
- Sessão expirada: `alert` + "Entrar de novo" preservando a página.

## Esqueleto
```tsx
<Result status="success" title="Pagamento aprovado" description="Enviamos o recibo para ana@…"
  extra={<><Button>Ver pedido</Button><Button variant="link">Voltar à loja</Button></>}/>
<Empty><EmptyHeader><EmptyTitle/><EmptyDescription/></EmptyHeader><EmptyContent><Button>Limpar filtros</Button></EmptyContent></Empty>
<Banner variant="warning">Sem conexão…</Banner>
// Erro inline num bloco: <Alert variant="destructive"/>
```
