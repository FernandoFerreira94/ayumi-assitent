---
id: paywall-ios
title: Paywall e assinatura no app
summary: Benefícios em 3 linhas, planos como opções grandes com o anual marcado, preço por mês e total por ano, botão fixo e termos claros.
intent: [paywall, assinar no app, premium, teste grátis, desbloquear recurso, plano pro]
group: financeiro
platform: mobile
products: [mobile-app, subscription, health, edtech, ai-app]
components: [navigation-bar, list-group, card, badge, bottom-bar, button, locked-feature, result, spinner]
patterns: [price-pix-installments]
status: stable
---
## Quando usar
Venda da assinatura dentro do app, a partir de um recurso bloqueado ou do perfil. Gerir plano já assinado e cobrança na web: `plano-assinatura`.

## Estrutura
```
navigation-bar transparente só com fechar (×) e "Restaurar" à direita
título curto do ganho + list-group plain de 3 benefícios (ícone + 1 linha)
2–3 card de plano (radio grande): Anual (badge "Economize 40%", R$ 12,42/mês · R$ 149 por ano) · Mensal
texto do teste: "7 dias grátis, depois R$ 149/ano. Cancele quando quiser."
bottom-bar: "Começar teste grátis" + links Termos · Privacidade
```

## Comandos perto do contexto
- Fechar sempre visível no topo, sem atraso; Restaurar compras ao lado.
- Escolher plano tocando no card inteiro; o botão fixo muda o rótulo conforme o plano.
- Origem bloqueada (`locked-feature`) leva aqui e volta ao recurso depois de assinar.

## Material e movimento
Fundo com mídia/cor da marca; cards de plano `default` com borda `primary` no escolhido. Botão com mola ao apertar; troca de plano anima só a borda. Nada de contagem regressiva falsa.

## Estados
Comprando: botão com `spinner` e texto "Confirmando com a App Store". Cancelado pela pessoa: volta sem erro. Falha: mensagem curta + tentar de novo. Sucesso: `result` "Você é Pro" + o que foi desbloqueado + "Continuar".

## Evitar
Esconder o fechar; preço só por semana para parecer menor; total anual escondido; 6 planos; pedir assinatura na primeira abertura antes de mostrar valor.

## Variações
- Recurso bloqueado inline: `locked-feature` com prévia borrada e "Desbloquear" abre este paywall em folha.
- Pagamento fora da loja (web/Android BR): Pix anual com desconto + cartão parcelado.
- Upgrade de plano: comparação curta dos 2 planos, sem o teste grátis.
- Planos com espiada e pagamento BR: `pricing-plans` carousel + `BillingToggle` (bloco `tela-planos`).

## Esqueleto
```tsx
<NavigationBar title="" leading={<Button variant="ghost" aria-label="Fechar">×</Button>} trailing={<Button variant="ghost">Restaurar</Button>}/>
<ListGroup variant="plain"><ListRow title="Relatórios ilimitados"/>…</ListGroup>
<div role="radiogroup" className="grid gap-3"><Card role="radio" aria-checked>Anual <Badge>Economize 40%</Badge></Card>…</div>
<BottomBar><Button className="w-full">Começar teste grátis</Button></BottomBar>
// Origem: <LockedFeature/> · Fim: <Result status="success" title="Você é Pro"/> · Comprando: <Spinner/>
```
