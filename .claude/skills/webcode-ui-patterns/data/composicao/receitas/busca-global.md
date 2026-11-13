---
id: busca-global
title: Busca global e paleta de comandos
summary: ⌘K abre busca única com grupos (páginas, registros, ações), termo destacado e atalhos; no celular vira tela de busca.
intent: [busca, buscar, paleta de comandos, command k, atalhos, pesquisar no sistema, search]
group: comunicacao
platform: ambos
products: [saas, admin, erp, crm, devtools]
components: [command, kbd, highlight, input-group, empty, search-bar, badge]
patterns: [command-palette, mobile-search-screen, search-header]
status: stable
---
## Quando usar
Produto com muitas páginas e registros, usado por quem volta todo dia. Busca dentro de uma lista: só `input-group` acima dela.

## Estrutura
```
topbar: input-group falso "Buscar… ⌘K" (abre o CommandDialog)
CommandDialog: CommandInput → CommandList
   grupos: Recentes · Páginas · Clientes · Ações ("Novo pedido" com CommandShortcut)
   item: ícone + título com highlight do termo + contexto (muted) + badge de tipo
celular: tela cheia com search-bar e os mesmos grupos
```

## Comandos perto do contexto
- Ações executáveis direto da busca ("Criar cliente…"), não só navegação.
- Atalho visível em `kbd` no gatilho e em cada ação com atalho.

## Material e movimento
Dialog no terço superior, sem mover ao filtrar. Resultado aparece a cada tecla (debounce curto), sem animação de lista.

## Estados
Antes de digitar: Recentes. Sem resultado: `empty` com "Buscar em todo o sistema" ou "Criar ‘termo’". Carregando registros remotos: linha "Buscando…" no grupo, não na lista inteira.

## Evitar
Busca que só acha correspondência exata com acento; resultados sem grupo; abrir página de resultados para 3 itens; atalho que conflita com o navegador.

## Variações
- Busca com escopo: chip "Em: Clientes" no campo.
- Recentes e sugeridos quando o campo está vazio.
- Comandos com parâmetro (ex.: "Ir para pedido #") abrem segunda etapa.

## Esqueleto
```tsx
<InputGroup onClick={open}>…Buscar…<Kbd>⌘K</Kbd></InputGroup>
<CommandDialog open={open}><CommandInput placeholder="Buscar páginas, clientes, ações"/>
  <CommandList><CommandEmpty/><CommandGroup heading="Clientes">
    <CommandItem><Highlight text={c.nome} query={q}/><Badge variant="soft">Cliente</Badge></CommandItem></CommandGroup>
    <CommandGroup heading="Ações"><CommandItem>Novo pedido<CommandShortcut>N</CommandShortcut></CommandItem></CommandGroup>
  </CommandList></CommandDialog>
// Celular: <SearchBar/> + mesmos grupos
```
