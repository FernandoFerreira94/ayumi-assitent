# Recriar a partir de referência

Como um print (Instagram, Dribbble, Mobbin, app concorrente, quadro de "vocabulário") vira peça do design system ou tela de um projeto. Vale para o repo do DS e para o agente de qualquer projeto que use o DS.

A referência ensina **estrutura, hierarquia e comportamento**. Ela não define cor, fonte, ilustração, texto nem marca: isso vem do tema e do produto.

## 1. Ler a referência (5 minutos, antes de abrir código)
Para cada print, escreva uma linha por peça:

| Pergunta | Exemplo (app de agendamento roxo) |
| --- | --- |
| O que a pessoa faz aqui? | Escolher especialidade e marcar consulta |
| Quais peças existem? | saudação + sino, título grande, chips de filtro, card de consulta com avatares, tab bar escura flutuante |
| O que é estrutura e o que é estilo? | estrutura: chips → lista de cards → barra; estilo: roxo, cantos 24px, foto |
| Qual comportamento está implícito? | chip filtra a lista; card abre detalhe; barra tem item ativo |
| O que falta no print? | vazio, carregando, erro, sem horário, texto longo, escuro |

Quadro de vocabulário (tipos de layout, gestos, loading…) não é tela: é lista de nomes. Cada nome entra no vocabulário (passo 3).

## 2. Mapear para o DS
Para cada peça, nesta ordem (pare no primeiro que servir):
1. **Vocabulário**: `find_term` no MCP ou `vocabulary/vocabulario.json`. Traduz o nome do post para a peça do DS.
2. **Componente**: `search_components` / catálogo da skill `webcode-components`.
3. **Padrão**: `list_patterns` / `node scripts/find.mjs --q "<termo>"` na skill `webcode-ui-patterns`.
4. **Blueprint** do tipo de produto (`get_blueprint`): navegação e telas-base.

Registre o mapa como tabela (peça → existe / variar / criar). Exemplo real no repo do DS: `docs/referencias/2026-10-30.md`.

## 3. Decidir: usar, variar ou criar
- **Usar** quando o componente cobre a função, mesmo que o visual do print seja outro. O tema resolve cor, raio e fonte; não crie "card roxo".
- **Variar** quando a função é a mesma e falta um jeito de mostrar (ex.: paginação em trilho, tab bar com traço). Vira prop/variante do componente existente, com a mesma API.
- **Criar** só quando nenhuma peça cobre a função (ex.: bilhete com picote, anel de meta, faixa da semana). Componente novo segue `AGENTS.md` (tokens, sem `dark:`, foco, densidade, demo com seções, `changes`).
- **Evitar** quando o efeito não tem função ou fere uma regra (gooey, ripple do Material, paralaxe em tudo). O vocabulário registra o que usar no lugar.

Num projeto que usa o DS, "criar" significa: implemente local com tokens e anote em `DESIGN-NOTAS.md` para virar peça no repo do DS. Não crie uma segunda versão de componente que já existe.

## 4. Recriar sem copiar
- Troque marca, logo, ilustração, foto e texto por conteúdo do produto, em pt-BR, com dados brasileiros quando couber (R$, CPF, datas).
- Cores pelo tema (`bg-card`, `text-brand`, paleta `chart-*`); nunca o hex do print. O contraste é o do tema, não o da imagem.
- Medidas pelos tokens (densidade, raio, texto). Se o print usa 13px cinza claro, o DS usa `text-sm text-muted-foreground`.
- Movimento só com motivo e com as durações do tema. Animação vista em vídeo vira regra do vocabulário antes de virar código.
- Complete o que o print não mostra: estados, teclado, leitor de tela, escuro, celular estreito, movimento reduzido.

## 5. Registrar
- Componente/padrão novo: `changes` da demo diz a origem do conceito ("cartão de embarque de apps de viagem"), nunca o perfil ou app de onde veio o print.
- Nome novo de padrão: entra em `vocabulary/vocabulario.json` com status `pronto`, `variar`, `falta` (com o lote em `note`) ou `evitar` (com a alternativa). O build falha se apontar para algo que não existe.
- Lote de referências: um arquivo em `docs/referencias/<data>.md` com a tabela do passo 2 e o que ficou para depois.

## Checklist antes de dar por pronto
- [ ] Cada peça do print está no mapa (existe / variar / criar / evitar).
- [ ] Nada de cor, fonte, logo ou texto copiado do print.
- [ ] Claro e escuro, 375px sem rolagem horizontal, movimento reduzido.
- [ ] Teclado e leitor de tela (nome, papel, valor); estado nunca só por cor.
- [ ] Vazio, carregando, erro e texto longo.
- [ ] `npm run build` (vocabulário e registry válidos) e `npm run verify` com axe passaram.

## Como o agente de um projeto aplica isso
O `CLAUDE.md`/`AGENTS.md` gerado pelo DS (modelo em `docs/modelos/CLAUDE.md`) manda seguir este método quando a pessoa cola um print. Na prática, peça assim:

> "Recrie esta tela com o design system: mapeie cada peça (vocabulário, componentes, padrões), me mostre o mapa e implemente só com tokens."

O agente responde com o mapa primeiro, implementa e lista o que faltou no DS em `DESIGN-NOTAS.md`.
