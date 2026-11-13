# Tabelas e listas densas

Em ERP, CRM e admin, a tabela é o produto. Ela precisa ser lida em segundos e operada sem mouse.

## Tabela ou lista?
- Comparar atributos entre itens, ordenar, operar em lote: **tabela**.
- Ler um item por vez, conteúdo heterogêneo, mobile-first: **lista** (linha com título, metadado e ação) ou **cards**.
- No mobile, tabela larga vira lista com as 2–3 colunas que importam e o resto no detalhe. Rolagem horizontal só com primeira coluna fixa.

## Estrutura
- [ ] Primeira coluna identifica a linha (nome, nº do pedido) e é o link para o detalhe.
- [ ] Colunas ordenadas por importância para a tarefa; no máximo 7–8 visíveis por padrão, o resto em "Colunas" (mostrar/ocultar, lembrado por usuário).
- [ ] Texto alinhado à esquerda; números, valores e datas à direita com `tabular-nums`; status e ícones centralizados ou à esquerda, consistentes.
- [ ] Cabeçalho alinhado como o conteúdo da coluna. Cabeçalho fixo (`position: sticky`) em tabelas longas.
- [ ] Unidade no cabeçalho ("Valor (R$)"), não repetida em cada célula, quando todas as linhas usam a mesma.
- [ ] Linhas separadas por borda sutil **ou** zebra, não os dois. Hover da linha com `sunken`.
- [ ] Totais e subtotais em linha de rodapé destacada por peso, não por cor.

## Densidade (combine com o blueprint)
| Densidade | Altura da linha | Fonte | Uso |
| --- | --- | --- | --- |
| compacta | 32–36px | 13–14px | ERP, financeiro, logs, power users |
| padrão | 40–44px | 14px | SaaS, CRM, admin |
| confortável | 52–56px | 15–16px | listas com avatar, mobile, uso eventual |
- [ ] Ofereça alternar densidade quando o produto tem usuários de perfis diferentes. O componente `@webcode/table` já tem `density`.

## Ordenação, filtro e busca
- [ ] Coluna ordenável mostra o estado (↑ ↓) e `aria-sort`. Ordenação padrão faz sentido para a tarefa (mais recente primeiro, vencimento mais próximo).
- [ ] Busca com debounce de 200–300ms, destaca o termo e preserva filtros.
- [ ] Filtros visíveis como chips removíveis acima da tabela ("Status: Pago ×"), com "Limpar tudo".
- [ ] Filtros e ordenação ficam na URL (compartilhável e sobrevive ao F5). Filtros salvos ("Minhas visões") para uso recorrente.
- [ ] Contagem de resultados sempre visível ("128 pedidos").

## Seleção e ações em lote
- [ ] Checkbox na primeira coluna; cabeçalho com marcar todos (estado indeterminado quando parcial).
- [ ] Shift+clique seleciona intervalo.
- [ ] Ao selecionar, aparece barra de ações em lote ("3 selecionados · Exportar · Arquivar · Excluir") no topo ou flutuando no rodapé.
- [ ] "Selecionar todos os 1.240" explícito quando há paginação.
- [ ] Ação de linha: até 2 ações visíveis no hover/foco; o resto num menu "⋯". No toque, as ações ficam sempre visíveis ou no detalhe.

## Edição
- [ ] Edição inline só para campos simples e frequentes (status, responsável, quantidade). Formulários complexos abrem em sheet lateral, mantendo a tabela visível.
- [ ] Célula editável tem affordance no hover/foco; Enter salva, Esc cancela, Tab vai para a próxima.
- [ ] Planilhas de verdade (grids editáveis) seguem o padrão `grid` do WAI-ARIA: setas navegam entre células, Enter edita.

## Paginação, virtualização e carregamento
- [ ] Até ~100 linhas: tudo na tela. Dados operacionais: paginação com tamanho escolhível (25/50/100) e posição ("1–50 de 1.240"). Feed e logs: scroll infinito ou virtualização, com "Voltar ao topo".
- [ ] Carregando: skeleton das linhas na altura real; ao paginar, mantenha a tabela e mostre progresso no topo (sem piscar vazio).
- [ ] Vazio: diferencie "nenhum registro ainda" (ensina e cria) de "nenhum resultado para os filtros" (limpar filtros).
- [ ] Erro em uma linha (ex.: sincronização) marcado na própria linha, não só em toast.

## Acessibilidade
- [ ] `<table>` com `<caption>` (pode ser visualmente oculto), `<th scope="col">` e `scope="row"` na coluna identificadora.
- [ ] Botões de ordenação são `button` dentro do `th`. Checkbox com rótulo ("Selecionar pedido 1043").
- [ ] Mudança de resultado anunciada em `role="status"` ("128 resultados").
- [ ] Não anime linhas ao ordenar ou filtrar em tabelas densas; `list-enter-exit` só para inserção/remoção pontual.

## Exportação
- [ ] Exportar respeita filtros e colunas visíveis, e diz isso ("Exportar 128 pedidos filtrados").
- [ ] CSV com `;` e vírgula decimal para Excel em pt-BR, ou XLSX. Exports grandes são assíncronos com notificação.

## Fontes
- NN/g, Data Tables: Four Major User Tasks: https://www.nngroup.com/articles/data-tables/
- IBM Carbon, Data table: https://carbondesignsystem.com/components/data-table/usage/
- Atlassian Design System, Dynamic table: https://atlassian.design/components/dynamic-table/
- Shopify Polaris, Table: https://shopify.dev/docs/api/app-home/web-components/layout-and-structure/table
- WAI-ARIA APG, Table, Grid e Sortable Table: https://www.w3.org/WAI/ARIA/apg/patterns/table/ · https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- TanStack Table (headless, base do DataTable do shadcn): https://tanstack.com/table/latest
