---
id: plano-assinatura
title: Plano, uso e upgrade
summary: Plano atual com uso dos limites, aviso aos 80%, recurso bloqueado no lugar dele e troca de plano em cards comparáveis.
intent: [assinatura, plano, upgrade, cobrança, faturamento, limites de uso, billing, recurso pago]
group: financeiro
platform: web
products: [saas, subscription, ai-app, devtools]
components: [subscription-manager, pricing-plans, usage-meter, locked-feature, button, table, dialog]
patterns: [pricing-tiers, plan-comparison-table]
status: stable
---
## Quando usar
Área de cobrança do SaaS (`subscription-manager`) e todo ponto onde um limite ou recurso pago aparece.

## Estrutura
```
SubscriptionCard "Pro": status + próxima cobrança + forma de pagamento + "Mudar plano" | "Cancelar"
usage-meter por limite dentro do card (Usuários 8/10 · Armazenamento 42/50 GB)
mudar plano: dialog com pricing-plans list (BillingToggle) + PlanChangeSummary (valor de hoje)
cancelar: CancelSubscription (2 cliques, motivo opcional, oferta ao lado)
recurso fora do plano: locked-feature no lugar do recurso (card, linha ou véu)
faturas: table (data · valor · status · baixar)
```

## Comandos perto do contexto
- Upgrade onde o limite aparece (no `usage-meter` aos 80% e no `locked-feature`), não só na página de planos.
- CTA de contratar só para quem pode (admin); os outros veem "Peça ao administrador".

## Material e movimento
Uso em barra com aviso aos 80% e perigo no limite (texto + cor). Nada de destaque animado; o plano recomendado só com `badge`.

## Estados
Status `past_due`, `trialing`, `paused`, `canceled` já trazem o aviso e a ação no card. Downgrade: `lostFeatures` antes de confirmar.

## Evitar
Esconder o botão de cancelar; preço sem impostos/condições; bloquear sem dizer o que desbloqueia; upgrade em modal surpresa no meio de uma tarefa.

## Variações
- Mobile/app: bloco `tela-assinatura`; venda: `paywall-ios`/`tela-planos`.
- Pagamento BR: Pix anual com desconto e cartão parcelado em `radio-group`.
- Por assento: `quantity-stepper` de usuários com total recalculado.

## Esqueleto
```tsx
<SubscriptionCard planName="Pro" status="active" price={4900} cycle="monthly" nextChargeOn={fim} payment={pix} onChangePlan={abrir} onCancel={cancelar}>
  <UsageMeter label="Usuários" value={8} max={10}/></SubscriptionCard>
<Dialog><DialogContent><PricingPlans variant="list" plans={planos} cycle={ciclo} value={id} onValueChange={setId}/><PlanChangeSummary from={a} to={b} periodStart={ini} periodEnd={fim} today={hoje}/></DialogContent></Dialog>
<CancelSubscription open={c} onOpenChange={setC} planName="Pro" accessUntil={fim} onConfirm={confirmar}/>
<LockedFeature/><Table/><Button/>
```
