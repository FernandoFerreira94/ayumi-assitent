---
id: configuracoes-em-card
title: Configurações em card com seções
summary: Preferências em card com seções recolhíveis; ação da linha no hover e Salvar no rodapé do próprio card.
intent: [configurações, preferências, ajustes da conta, settings, notificações, card com accordion, botão dentro de accordion]
group: conta
platform: web
products: [saas, admin, erp, crm, helpdesk]
components: [card, accordion, item, switch, button, badge, popconfirm, tooltip, sonner, skeleton, dropdown-menu]
patterns: [ios-switch, undo-delete]
status: stable
---
## Quando usar
2 a 6 grupos de ajustes (Notificações, Segurança…), uso eventual: a pessoa acha um ajuste, muda e sai. Mais de 6 grupos: `tabs` na URL, um card por aba.

## Estrutura
```
card
├─ header: título + descrição curta + card-action (badge "3 ativas")
├─ content (sem padding lateral) > accordion multiple (1ª aberta)
│  └─ item-trigger: grupo + resumo à direita ("2 de 4")
│     └─ item sm (group/item): título + descrição | ações: button ghost xs (hover) + switch
└─ footer (só com mudança pendente): ghost "Descartar" + "Salvar alterações"
```
Switch reversível aplica na hora (sem rodapé); ajustes dependentes ficam pendentes até Salvar.

## Comandos perto do contexto
- Ação da linha ("Testar") no `item` da linha, `button` ghost xs, antes do `switch`.
- Ação do grupo ("Desligar todas") no fim do `accordion`, `button` link.
- Destrutiva no menu … (`dropdown-menu`) + `popconfirm`.
- Salvar no rodapé do `card` que mudou, nunca no topo da página.

## Material e movimento
`card` default; dentro, só linhas `item` sem borda. Revelar: `opacity-0 group-hover/item:opacity-100 group-focus-within/item:opacity-100 pointer-coarse:opacity-100`, duração fast. Altura do accordion sem mola. Rodapé entra com fade + 4px (base, ease-wc-out).

## Estados
Carregando: `skeleton` com as linhas reais. Sem permissão: switch disabled + `tooltip` com o motivo. Erro: `sonner` com "Tentar de novo" e switch volta. Feito: `sonner` "Resumo semanal desligado · Desfazer".

## Evitar
Primária por seção; `alert-dialog` para notificação; card em card; accordion em accordion; única ação escondida no hover; Salvar global longe.

## Variações
- Mobile iOS: `ajustes-conta-ios`.
- Por organização × pessoal: `tabs` no topo da página.
- Plano/cobrança dentro de configurações: `plano-assinatura`.

## Esqueleto
```tsx
<Card>
  <CardHeader><CardTitle/><CardDescription/><CardAction><Badge variant="soft"/></CardAction></CardHeader>
  <CardContent className="px-0">
    <Accordion type="multiple"><AccordionItem><AccordionTrigger/><AccordionContent>
      <Item size="sm" className="group/item"><ItemContent><ItemTitle/><ItemDescription/></ItemContent>
        <ItemActions><Button variant="ghost" size="xs"/><Switch/></ItemActions></Item>
    </AccordionContent></AccordionItem></Accordion>
  </CardContent>
  {dirty && <CardFooter className="justify-end gap-2"><Button variant="ghost"/><Button/></CardFooter>}
</Card>
```
