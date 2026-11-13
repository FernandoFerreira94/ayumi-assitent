---
id: file-upload-dropzone
title: Envio de arquivos com arrastar, progresso e tentar de novo
category: form
summary: Área de soltar com botão real, validação de tipo e tamanho que diz o que fazer, lista com prévia, progresso por arquivo, cancelar e tentar de novo. Também aceita colar (Ctrl+V).
themes: [clean-saas, aurora, editorial]
products: [saas, erp, crm, admin, helpdesk, health, fintech, edtech, realestate, b2b, automation, ai-app, field-service]
motion: low
tech: css-js
deps: []
a11y: Botão "Escolher arquivos" é o caminho principal (arrastar é atalho); dica de tipos/tamanho ligada por aria-describedby; progresso com role="progressbar"; cada resultado anunciado (aria-live); remover/cancelar/tentar com nome do arquivo no rótulo; erro com texto, não só cor.
perf: Prévia por URL.createObjectURL (revogada ao remover); progresso limitado a passos de 1%; envio com AbortController.
reference_name: GOV.UK Design System — File upload
reference_url: https://design-system.service.gov.uk/components/file-upload/
react: "`npx shadcn add @webcode/file-upload`: FileUpload com accept, maxSize, maxFiles, upload(file, { onProgress, signal }) e name para enviar no formulário nativo."
status: stable
---

## Quando usar
- Documentos de cadastro, anexos de chamado, fotos de imóvel, importação de planilha.

## Evite
- Só arrastar e soltar (sem botão): não funciona no teclado nem no celular.
- Validar só no servidor depois do envio inteiro.
- Mensagem genérica "Arquivo inválido": diga o tipo aceito e o tamanho máximo.

## Implementação
- `dragenter`/`dragleave` com contador de profundidade (filhos disparam leave); `dragover` com `preventDefault`.
- Valide `accept` (extensão e MIME) e `maxSize` antes de enviar; mantenha o arquivo rejeitado na lista com o motivo.
- Com envio real, use `XMLHttpRequest.upload.onprogress` (fetch ainda não expõe progresso de upload).
