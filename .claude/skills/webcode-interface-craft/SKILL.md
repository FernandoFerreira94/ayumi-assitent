---
name: webcode-interface-craft
description: Método WebCode para criar uma tela ou fluxo com qualidade de produto (hierarquia, layout, estados, detalhes invisíveis de interação, motion com propósito e microcopy pt-BR). Use ao desenhar ou implementar uma tela, formulário, dashboard ou fluxo novo, ao refazer uma tela que "funciona mas não convence", ao propor variações/direções de uma tela ou ao recriar uma tela a partir de print/referência visual. Gatilhos: "faz uma tela de…", "melhora essa tela", "me dá 3 opções", "recria esse print", "escreve os textos da tela".
---

# WebCode Interface Craft

Como pensar e construir a tela. Tokens e regras fixas ficam na `webcode-design-language`; receitas e padrões na `webcode-ui-patterns`; componentes na `webcode-components`. Para avaliar uma tela pronta, use `webcode-design-review`.

Base: Rauno Freiberg, Emil Kowalski, Dieter Rams, Linear, Refactoring UI, Jony Ive, Bret Victor, Apple WWDC, Vercel, Primer, Atlassian e NN/g. Só virou regra o que tem duas fontes ou mais.

## Quando usar
- Desenhar ou implementar tela, formulário, dashboard ou fluxo novo.
- Refazer tela que funciona mas não convence; propor 3 direções.
- Recriar a partir de print, Dribbble ou app concorrente → `references/referencias.md`.
- Escrever microcopy pt-BR → `references/ux-writing.md`.

**Princípios (o filtro de toda decisão)**
1. **O conteúdo manda, a interface recua.** Navegação e moldura discretas; menos bordas, menos ícones decorativos.
2. **Cada elemento responde "para que serve?".** Se não ajuda a tarefa, sai. O que fica precisa ter caráter: minimalismo vazio não é qualidade.
3. **Cuide do que ninguém pede**: vazio, erro, carregando, foco, texto longo, sem permissão.
4. **Resposta imediata.** Prévia ao vivo, UI otimista com desfazer, nada de esperar animação.
5. **Honesto.** Sem progresso inventado, skeleton que não bate com o layout ou preço com asterisco escondido.
6. **Opinião em vez de configuração.** Um bom padrão vale mais que cinco opções.

## Processo
1. **Para quem e para quê.** Uma frase: "Quando `<situação>`, quero `<ação>`, para `<resultado>`", mais a frequência de uso (decide densidade e quanto animar) e um critério de pronto mensurável ("fecha a venda em ≤ 3 toques"). Fluxo com mais de uma tela: lugares → afordâncias → conexões em texto antes de escolher componentes.
2. **Comece pelo conteúdo real**, nunca por "lorem". Liste os dados, o pior caso (nome de 60 caracteres, 0 itens, 10 mil itens) e o idioma (pt-BR, R$, datas).
3. **Hierarquia antes de estilo.** Uma ação primária por tela. Ordem de leitura por tamanho, peso e espaço; cor por último. Rebaixe o secundário em vez de aumentar o principal.
4. **Variações.** Pedido aberto ("faz uma tela de…", "melhora isso") ganha **3 direções** (segura, ousada, fora da caixa), cada uma mudando um eixo (densidade, material, estrutura, navegação, movimento), com o mesmo conteúdo e uma recomendada. Pedido fechado segue direto.
5. **Composição.** Uma receita por tela (`find_recipe` query → id, ou `INDICE.md` → `receitas/<id>.md` da `webcode-ui-patterns`): comando no contêiner que ele afeta, uma primária por contêiner, secundária no hover e visível no toque, no máximo 3 superfícies.
6. **Layout.** Grade e espaçamento dos tokens; agrupe por proximidade; linhas de texto de 60 a 75 caracteres; números à direita e `tabular-nums`; raio interno = raio externo − padding. Cor: `references/cor.md` (60/30/10).
7. **Estados**, antes de dar por pronto: vazio (primeira vez / sem resultado / erro), carregando (nada abaixo de ~1 s; skeleton com o layout real; determinado acima de ~3 s), erro com saída, sucesso, desabilitado com motivo, sem permissão, offline.
8. **Interação.** Tudo por teclado com foco visível; alvos ≥ 44px no toque; gesto sempre com alternativa por clique; estado na URL (filtros, abas, painel aberto); Esc sempre sai sem perder o que foi digitado.
9. **Motion com motivo.** Só anime para explicar origem/destino, confirmar uma ação ou dar continuidade. Ação frequente = pouca ou nenhuma animação.
10. **Copy.** Botão no infinitivo com objeto ("Salvar endereço"), instrução no imperativo com "você", a mesma palavra do botão ao toast ("Publicar" → "Publicado"), erro diz o que houve e como resolver, sem culpar e sem "Ops". Detalhes: `references/ux-writing.md`.
11. **Revise com olhos novos**: screenshots em claro, escuro, celular e movimento reduzido; testes de 1 minuto (desfoque, escala de cinza, 5 segundos, tirar um, polegar); checklist da `webcode-design-language` e, se a tela for importante, a `webcode-design-review`.

## Regras
**Motion**
- UI abaixo de 300ms; modal 200–300ms; sheet até 360ms. Saída ≈ 60–70% da entrada.
- Entrada parte de escala .95–.97 + opacity, nunca de 0. Popover, dropdown e tooltip crescem do gatilho; modal no centro.
- Só `transform`, `opacity`, `filter`; nunca `transition: all`. Transição (interrompível) no que o usuário pode reverter; keyframes só no que roda sozinho.
- Mola com bounce 0 por padrão; um pouco de bounce só no fim de gesto ou em celebração.
- Gesto segue o dedo 1:1 e decide ao soltar, por posição + velocidade; dá para desistir no meio.
- Capricho só em momentos raros e em resposta a uma ação; nunca em ferramenta usada o dia todo.
- Movimento reduzido: tira deslocamento e escala, mantém fade curto; indicador de progresso continua.
- Tabela por overlay (Dialog, Sheet, Popover, Toast): `webcode-design-language/references/guidelines/overlays.md`.

**Feedback**
- Resultado de ação → toast curto com "Desfazer" quando reversível. Assíncrono → um toast só que muda de carregando para sucesso/erro.
- Erro que exige ação não é toast: fica na tela, ao lado de onde se resolve. Toast nunca é o único registro.
- Destrutivo: prefira desfazer; confirme só o irreversível e raro, com o verbo no botão ("Excluir 3 pedidos").
- Não desabilite "Enviar" antes da tentativa: valide ao enviar, foque o primeiro erro e mantenha o que foi digitado.

**Anti-padrões** (vistos como "feito por IA" ou descuido)
- Tudo em cards iguais com a mesma sombra; gradiente como enfeite; ícone decorativo em todo título.
- Sobretítulo em CAIXA ALTA acima de cada seção; números "01 / 02 / 03" sem sequência real.
- Fade-up em cada seção e hover que pula em todo card.
- Spinner na tela inteira para carregar um pedaço; skeleton que não bate com o layout.
- Modal dentro de modal; toast para erro de validação; "Tem certeza?" com Sim/Não.

**Referência visual:** ensina estrutura, hierarquia e comportamento; cor, fonte, ilustração, texto e marca vêm do tema e do produto. Mostre o mapa (peça → usar / variar / criar / evitar) antes de codar e recrie sem copiar.

## Referências (sob demanda)
Leia **só a seção da etapa**:
- `references/metodos.md`: enquadrar (JTBD, critério de pronto), breadboard, 3 direções e eixos de variação, Gestalt e Laws of UX, testes rápidos, percurso cognitivo, tipografia como método.
- `references/detalhes.md`: interação, formulários e datas, feedback, layout e acabamento, tipografia, copy, performance percebida, capricho, materiais e camadas (vidro).
- `references/referencias.md`: recriar a partir de print, passo a passo e checklist.
- `references/ux-writing.md`: tom por momento, fórmulas e glossário pt-BR.
- `references/cor.md`: 60/30/10, neutros que não são puros, checagem de proporção.

## Outras skills WebCode
- `webcode-design-language`: tokens, temas e regras fixas.
- `webcode-ui-patterns`: receitas, padrões e blueprints.
- `webcode-components`: componentes @webcode.
- `webcode-design-review`: revisar a tela pronta.
