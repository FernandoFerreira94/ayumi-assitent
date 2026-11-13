---
id: envio-arquivos
title: Envio e gestão de arquivos
summary: Área de soltar com regras visíveis, progresso por arquivo com cancelar/tentar de novo e lista do que já foi enviado.
intent: [upload, enviar arquivos, anexos, documentos, importar planilha, foto de perfil, comprovante]
group: comunicacao
platform: ambos
products: [saas, erp, health, fintech, helpdesk]
components: [file-upload, progress, item, button, image-crop, dialog, dropdown-menu, empty, sonner]
patterns: []
status: stable
---
## Quando usar
Anexar documentos a um registro ou importar arquivo. Foto de perfil: `file-upload` + `image-crop` em `dialog`.

## Estrutura
```
field "Documentos": file-upload (arrastar, colar, clicar) com "PDF ou JPG, até 10 MB" visível
fila: item por arquivo: ícone de tipo + nome + tamanho | progress + cancelar → ✓ / erro + "Tentar de novo"
enviados: item com nome, data, menu … (Baixar, Renomear, Excluir)
avatar: escolher → dialog com image-crop (círculo) → Salvar
```

## Comandos perto do contexto
- Cancelar e Tentar de novo na linha do arquivo.
- Ações do arquivo enviado no menu … (`dropdown-menu`) da linha.
- Importar planilha: baixar modelo ao lado da área de soltar.

## Material e movimento
Área tracejada que destaca ao arrastar por cima (borda da marca). Progresso real por arquivo; sem barra global inventada.

## Estados
Tipo/tamanho inválido: erro na linha com o motivo. Rede caiu: pausa e "Tentar de novo". Lista vazia: `empty` curto dentro do field. Excluir: `sonner` com Desfazer.

## Evitar
Regras escondidas até errar; um progresso só para 10 arquivos; recorte obrigatório sem "Pular"; bloquear o formulário enquanto envia sem dizer.

## Variações
- Documentos KYC (RG/CNH, selfie): uma linha por documento exigido com status.
- Importar planilha: mapear colunas e prévia das 5 primeiras linhas antes de importar.
- Avatar/logo: `image-crop` em `dialog` direto após escolher.

## Esqueleto
```tsx
<Field><FieldLabel>Documentos</FieldLabel><FileUpload accept=".pdf,.jpg" maxSize={10 * 1024 * 1024}/>
  <FieldDescription>PDF ou JPG, até 10 MB.</FieldDescription></Field>
<Item size="sm"><ItemContent><ItemTitle/><Progress value={40}/></ItemContent><ItemActions><Button variant="ghost" size="xs">Cancelar</Button></ItemActions></Item>
<Dialog><DialogContent><ImageCrop/><DialogFooter><Button>Salvar foto</Button></DialogFooter></DialogContent></Dialog>
```
