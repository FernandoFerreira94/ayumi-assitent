---
id: emissao-nota-fiscal
title: Emitir nota fiscal (NF-e / NFS-e)
summary: Formulário em seções com tomador por CNPJ e CEP, itens em tabela editável, impostos calculados à vista e revisão antes de transmitir.
intent: [nota fiscal, nf-e, nfs-e, emitir nota, faturar, fiscal]
group: financeiro
platform: web
products: [erp, saas, b2b, pos]
components: [page-header, card, field, input-document, input-cep, combobox, table, input-currency, description-list, alert, button, result, sonner]
patterns: [cpf-cnpj-field, cep-address-autofill, form-error-summary]
status: beta
---
## Quando usar
Emitir uma nota avulsa ou a partir de um pedido. Lista de notas emitidas: `tabela-admin`. Muitas etapas com dados de terceiros: considere `wizard-etapas`.

## Estrutura
```
page-header: "Nova NFS-e" + série/ambiente (badge Homologação) | "Salvar rascunho" (ghost)
grid 2 colunas (lg): formulário à esquerda, resumo fixo (sticky) à direita
  card Tomador: input-document (CNPJ busca razão social) + input-cep (preenche endereço) + e-mail
  card Serviço/Itens: combobox do serviço (código LC 116) + table editável (descrição · qtd · valor)
  card Tributos: retenções em accordion ("ISS retido", "PIS/COFINS/CSLL")
  resumo: description-list (Bruto · Retenções · Líquido) + "Revisar e emitir"
```

## Comandos perto do contexto
- Adicionar item na última linha da tabela, remover no ícone da linha.
- "Revisar e emitir" no resumo, com o líquido no rótulo; rascunho no `page-header`.
- Erro de validação da prefeitura/SEFAZ: link "Ir para o campo" no `alert`.

## Material e movimento
Cards `default` empilhados; resumo `sticky` com `shadow-wc-sm`. Totais com `tabular-nums` e transição curta de número ao mudar. Sem animação nos campos.

## Estados
CNPJ buscando: spinner no campo; não achou: libera preenchimento manual. Transmitindo: botão `loading` + texto "Aguardando a prefeitura (até 30 s)". Rejeitada: `alert` destrutivo com código e mensagem do órgão, dados mantidos. Autorizada: `result` com número, "Baixar PDF/XML" e "Enviar ao cliente"; enviada: `sonner` "Nota enviada para financeiro@cliente.com".

## Evitar
Formulário de 40 campos sem seção; esconder o líquido até o final; emitir sem revisão; ambiente de homologação sem aviso visível.

## Variações
- NF-e de produto: itens com NCM/CFOP em colunas ocultáveis e frete no resumo.
- A partir de pedido: tomador e itens preenchidos, só revisão + emitir.
- Lote: `tabela-admin` com seleção e ação em massa "Emitir notas".

## Esqueleto
```tsx
<PageHeader>…<PageHeaderActions><Button variant="ghost">Salvar rascunho</Button></PageHeaderActions></PageHeader>
<div className="grid gap-6 lg:grid-cols-[1fr_20rem]"><div className="space-y-4">
  <Card><CardHeader><CardTitle>Tomador</CardTitle></CardHeader><CardContent>
    <Field><FieldLabel>CNPJ</FieldLabel><InputDocument accept="cnpj"/></Field><InputCep onAddress={fill}/></CardContent></Card>
  <Card><CardContent><Combobox/><Table>…<InputCurrency/>…</Table></CardContent></Card></div>
  <aside className="lg:sticky lg:top-4"><DescriptionList columns={1}/><Alert/><Button>Revisar e emitir</Button></aside></div>
// Autorizada: <Result status="success" title="NFS-e 1.284 autorizada"/>
```
