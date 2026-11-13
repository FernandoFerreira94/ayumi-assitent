---
id: ajustes-conta-ios
title: Conta e ajustes no iPhone
summary: Perfil no topo e ajustes em grupos inset; cada linha mostra o valor e abre a escolha na pilha.
intent: [perfil, minha conta, ajustes mobile, configurações app, conta do usuário, settings ios]
group: conta
platform: mobile
products: [mobile-app, fintech, health, habits, delivery]
components: [navigation-bar, avatar, list-group, switch, select-list, date-time-field, stack-view, action-sheet, button, sonner]
patterns: [ios-switch]
status: stable
---
## Quando usar
Conta e preferências no app mobile. Web: `configuracoes-em-card`.

## Estrutura
```
stack-view
└─ navigation-bar large "Conta"
   cabeçalho: avatar grande + nome + e-mail + "Editar perfil" (link)
   list-group inset "Preferências": Notificações (switch) · Idioma (select-list) · Lembrete (date-time-field)
   list-group inset "Segurança": Senha › · Dispositivos ›
   list-group inset: "Sair" (destructive) → action-sheet de confirmação
```

## Comandos perto do contexto
- Cada ajuste na própria linha: switch aplica na hora; escolha abre na pilha e volta com check.
- Sair e Excluir conta no último grupo, separados, como linhas destrutivas.

## Material e movimento
Fundo agrupado (bg-muted) com grupos em bg-card; ícone em quadrado colorido só quando ajuda a achar. Push/pop do `stack-view`; switch com o deslize dele.

## Estados
Mudança salva: sem toast para switch (o próprio controle é o feedback); erro: switch volta + `sonner`. Sair: `action-sheet` com "Sair" vermelho e Cancelar.

## Evitar
Formulário inteiro numa tela de ajustes; Salvar no topo; card com sombra por grupo; ícone em toda linha sem função.

## Variações
- Empresa: linha "Dados da empresa" com CNPJ e endereço (`formulario-cadastro`).
- Segurança: biometria (`switch`), sessões ativas e sair de todos.
- Excluir conta: última linha em vermelho → `action-sheet` com o que se perde.

## Esqueleto
```tsx
<StackView>…<NavigationBar large title="Conta"/>
<div className="flex flex-col items-center gap-2 py-4"><Avatar className="size-20"/>…<Button variant="link">Editar perfil</Button></div>
<ListGroup variant="inset" title="Preferências">
  <ListRow title="Notificações" accessory={<Switch/>}/>
  <ListRow title="Idioma" detail="Português" accessory="chevron"/>
</ListGroup>
<ListGroup variant="inset"><ListRow title="Sair" destructive/></ListGroup>
<ActionSheet>…<ActionSheetAction destructive>Sair</ActionSheetAction></ActionSheet>
```
