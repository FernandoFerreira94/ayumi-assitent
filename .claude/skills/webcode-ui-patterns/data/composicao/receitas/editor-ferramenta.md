---
id: editor-ferramenta
title: Editor com árvore, área de trabalho e painel
summary: Árvore à esquerda, conteúdo no centro, propriedades à direita, barra de ferramentas e atalhos; painéis redimensionáveis.
intent: [editor, ferramenta, ide, construtor, workspace, documentos, explorador de arquivos, propriedades]
group: gestao
platform: web
products: [devtools, saas, automation]
components: [menubar, toolbar, toggle-group, tooltip, kbd, resizable, tree-view, scroll-area, tabs, field, code-block, command]
patterns: []
status: stable
---
## Quando usar
Ferramenta de criação usada por horas no desktop (editor, construtor de fluxo). Não serve para celular: mostre leitura lá.

## Estrutura
```
menubar (Arquivo · Editar · Exibir) com atalhos em kbd
toolbar: grupos (toggle-group de formatação · inserir · desfazer/refazer) com tooltip + atalho
resizable 3 painéis (autoSaveId): tree-view (scroll-area) | área de trabalho com tabs de arquivos | propriedades (field)
command (⌘K) para qualquer ação
```

## Comandos perto do contexto
- Propriedades do item selecionado no painel da direita, nunca em modal.
- Ação no item da árvore pelo clique direito e pelo menu … da linha.
- Tudo com atalho; o atalho aparece no tooltip e no menu.

## Material e movimento
Superfícies planas, bordas finas, densidade compacta. Nada animado além de abrir/fechar painel. Ícones da toolbar sempre com rótulo acessível.

## Estados
Não salvo: ponto na aba + "Salvo há 2 s" no rodapé. Nada selecionado: painel de propriedades com dica curta. Erro de execução: painel inferior com `code-block` do log.

## Evitar
Toolbar com mais de 3 grupos sem separador; ícone sem tooltip; propriedades em modal; perder o tamanho dos painéis ao recarregar.

## Variações
- Construtor de formulários: paleta de campos à esquerda arrastando para o centro.
- Editor de fluxo/automação: canvas no centro e propriedades do nó à direita.
- Tablet: painéis laterais viram `sheet`.

## Esqueleto
```tsx
<Menubar/>
<Toolbar aria-label="Formatação"><ToolbarToggleGroup type="multiple"><ToolbarToggleItem value="b"/></ToolbarToggleGroup><ToolbarSeparator/><ToolbarButton/></Toolbar>
<ResizablePanelGroup direction="horizontal" autoSaveId="editor">
  <ResizablePanel defaultSize={20}><ScrollArea><TreeView/></ScrollArea></ResizablePanel><ResizableHandle/>
  <ResizablePanel><Tabs/>…</ResizablePanel><ResizableHandle/>
  <ResizablePanel defaultSize={25}><Field/></ResizablePanel>
</ResizablePanelGroup>
<CommandDialog/>
```
