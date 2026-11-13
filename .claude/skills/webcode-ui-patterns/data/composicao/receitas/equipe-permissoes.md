---
id: equipe-permissoes
title: Equipe e permissões
summary: Membros em tabela com papel editável na linha, convite em diálogo curto e matriz de papéis com o que mudou antes de salvar.
intent: [equipe, membros, usuários, convidar, papéis, permissões, acesso, perfis de acesso]
group: gestao
platform: web
products: [saas, admin, erp, crm, helpdesk]
components: [page-header, button, data-table, avatar, badge, select, dialog, field, tags-input, permission-matrix, alert-dialog, sonner]
patterns: []
status: stable
---
## Quando usar
Administrar quem acessa e o que pode fazer. Muitos papéis customizados: aba própria com a matriz.

## Estrutura
```
page-header: "Equipe" + contagem | "Convidar pessoas"
tabs na URL: Membros · Papéis
Membros: data-table (avatar + nome + e-mail · papel em select na linha · status badge · menu …)
Convite: dialog: tags-input de e-mails + select de papel → "Enviar 3 convites"
Papéis: permission-matrix (papel × permissão) com selo "alterado" + barra "3 alterações · Salvar"
```

## Comandos perto do contexto
- Trocar papel no `select` da própria linha (aplica e mostra `sonner` com Desfazer).
- Remover pessoa no menu … da linha, com `alert-dialog` que diz o que ela perde.
- Salvar a matriz numa barra que aparece só com alterações.

## Material e movimento
Tabela sem card. Barra de alterações sticky no rodapé com fade curto. Selo de alterado com texto, não só cor.

## Estados
Convite pendente: badge "Convidado" + "Reenviar". Último admin: não pode ser removido (motivo no menu). Sem permissão para editar: tudo em leitura com aviso.

## Evitar
Editar papel em página separada; salvar matriz sem mostrar o que mudou; convite de um e-mail por vez; excluir sem dizer o impacto.

## Variações
- Convite por link com expiração e papel padrão.
- Times/departamentos: `tree-view` à esquerda e membros à direita.
- Mobile: membros em `list-group` e papel em `action-sheet`.

## Esqueleto
```tsx
<PageHeader>…<PageHeaderActions><Button>Convidar pessoas</Button></PageHeaderActions></PageHeader>
<DataTable caption="Membros" columns={[{ id: "nome", header: "Nome", cell: (m) => <><Avatar/>{m.nome}</> }, { id: "papel", header: "Papel", cell: (m) => <Select/> }]}/>
<Dialog><DialogContent><Field><FieldLabel>E-mails</FieldLabel><TagsInput/></Field><Select/>
  <DialogFooter><Button>Enviar 3 convites</Button></DialogFooter></DialogContent></Dialog>
<PermissionMatrix/>
```
