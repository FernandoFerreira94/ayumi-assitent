---
id: formulario-cadastro
title: Formulário longo de cadastro
summary: Seções com título à esquerda e campos à direita, dados BR com máscara, erro no campo e resumo de erros ao enviar.
intent: [formulário, cadastro de cliente, cadastro de empresa, editar perfil, ficha, formulário longo, dados pessoais]
group: conta
platform: ambos
products: [erp, crm, admin, saas, health, fintech]
components: [field, input, input-document, input-cep, input-date, select, textarea, switch, file-upload, form-validation, button, separator, bottom-bar]
patterns: [form-error-summary]
status: stable
---
## Quando usar
10 a 30 campos preenchidos de uma vez (cadastro, ficha). Mais de 30 ou com decisões no meio: `wizard-etapas`.

## Estrutura
```
form > form-error-summary (só depois de enviar)
seção (grid md: 1/3 título + descrição | 2/3 campos), separator entre seções
  Dados: input-document · input · input-date
  Endereço: input-cep → rua/número/complemento
  Preferências: switch · select · textarea
  Anexos: file-upload
rodapé sticky: "Cancelar" (ghost) + "Salvar cliente"; no celular, bottom-bar
```

## Comandos perto do contexto
- Salvar sempre visível (rodapé sticky); rótulo com verbo + objeto.
- Ajuda do campo em `field` description, não em tooltip.
- "Buscar CEP" automático no 8º dígito, sem botão.

## Material e movimento
Sem card por seção (o grid 1/3–2/3 já agrupa). Campos com largura do conteúdo esperado (CEP curto, nome longo). Nada animado.

## Estados
Validação no blur e ao corrigir (`form-validation`); ao enviar, resumo no topo com links para os campos. Salvando: botão `loading`. Sair com mudanças: perguntar.

## Evitar
Placeholder como rótulo; 2 colunas de campos sem relação; asterisco sem legenda (marque o opcional); validar a cada tecla; "Enviar" genérico.

## Variações
- Pessoa física × jurídica: `toggle-group` no topo troca CPF/CNPJ e campos.
- Mobile: uma seção por tela com `bottom-bar` Continuar (`wizard-etapas`).
- Edição: só os campos alterados habilitam Salvar; "Descartar" ao lado.

## Esqueleto
```tsx
<form noValidate><FormErrorSummary/>
  <section className="grid gap-6 md:grid-cols-3"><div><h2/><p/></div>
    <FieldGroup className="md:col-span-2"><Field><FieldLabel/><InputDocument/><FieldError/></Field>
      <Field><FieldLabel/><InputCep/></Field></FieldGroup></section><Separator/>
  …<Field><FileUpload/></Field>
  <div className="sticky bottom-0 flex justify-end gap-2"><Button variant="ghost"/><Button type="submit">Salvar cliente</Button></div>
</form>
```
