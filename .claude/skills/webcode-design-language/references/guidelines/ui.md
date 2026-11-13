# UI visual

Como fazer uma tela parecer clara, calma e cara sem depender de efeito.

## Hierarquia
- [ ] Cada tela tem **um** elemento mais importante, e ele é óbvio em 3 segundos (título ou ação primária).
- [ ] A hierarquia vem de tamanho, peso e espaço antes de cor. Teste em escala de cinza: a ordem de leitura continua a mesma.
- [ ] No máximo 3 níveis de ênfase de texto por bloco: `fg` (principal), `fg-muted` (apoio), `fg-subtle` (metadado não essencial).
- [ ] Rótulo e valor: o valor é o protagonista ("R$ 12.400" grande, "Receita do mês" pequeno e `fg-muted`), não o contrário.
- [ ] Uma ação primária por contexto. As outras são secundárias (outline/ghost) ou viram menu.
- [ ] Ações destrutivas não são vermelhas por padrão na tela: só ficam vermelhas no momento da confirmação.

## Espaço e layout
- [ ] Todo espaçamento vem da escala de 4px (`--wc-space-*`). Nenhum `13px` ou `22px` avulso.
- [ ] Espaço agrupa: o que está relacionado fica mais perto entre si do que de vizinhos (lei da proximidade). Espaço entre grupos ≥ 2× o espaço dentro do grupo.
- [ ] Comece com espaço demais e retire. Tela apertada é o erro mais comum; densidade vem do blueprint, não do acaso.
- [ ] Largura de leitura entre 60 e 75 caracteres (`max-width: 65ch`) para texto corrido.
- [ ] Alinhamento por uma grade: bordas esquerdas de títulos, campos e botões coincidem. Ícone + texto alinham pelo centro óptico, não pela caixa.
- [ ] Containers aninhados: raio interno = raio externo − padding (cantos concêntricos). Nunca raio interno maior que o externo.
- [ ] Layout responsivo por conteúdo (container queries) quando o componente vive em larguras diferentes; breakpoints da página só para a estrutura.

## Tipografia
- [ ] Escala modular dos tokens (`--wc-font-size-*`). No máximo 4–5 tamanhos por tela.
- [ ] Corpo: 16px em sites, 14–15px em apps densos. Nunca abaixo de 12px para texto que precisa ser lido.
- [ ] Entrelinha: 1.5 no corpo, 1.1–1.25 em títulos grandes. Títulos grandes com `tracking` levemente negativo.
- [ ] `text-wrap: balance` em títulos, `text-wrap: pretty` em parágrafos curtos.
- [ ] `font-variant-numeric: tabular-nums` em tabelas, preços em coluna, timers e contadores.
- [ ] Textos longos alinhados à esquerda. Centralizado só em blocos de até 3 linhas.
- [ ] Caixa alta só em rótulos curtos, com `tracking` positivo. Nunca em frases.

## Cor
- [ ] Só tokens semânticos (`bg`, `surface`, `fg`, `accent`, `success`…). Paleta primitiva e hex ficam fora dos componentes.
- [ ] Uma cor de destaque por tela. Se tudo é destaque, nada é.
- [ ] Neutros fazem 90% da interface. A cor da marca marca: ação primária, seleção, foco, links.
- [ ] Status nunca só por cor: ícone, texto ou forma acompanham (`Pago` com ✓, não só verde).
- [ ] Fundos coloridos suaves (`*-soft`) com texto da mesma família em tom forte; nunca texto cinza sobre fundo colorido.
- [ ] Modo escuro não é inversão: superfícies mais altas ficam mais claras, sombras dão lugar a bordas e luz, saturação cai um pouco.

## Profundidade e superfícies
- [ ] Cada camada tem um token: `bg` → `surface` → `surface-raised` → overlay com `scrim`. Não invente cinzas intermediários.
- [ ] Elevação diz "está acima". Card estático não precisa de sombra se já tem borda ou contraste de fundo; escolha um dos dois.
- [ ] Sombra pela escala do tema (ADR 0013): `shadow-wc-xs` controle · `shadow-wc` card · `shadow-wc-md` menu/popover/card flutuante · `shadow-wc-lg` sheet/drawer · `shadow-wc-xl` diálogo. Nada de `shadow-md` genérico do Tailwind nem valor solto.
- [ ] Vidro (blur) só em elementos que flutuam sobre conteúdo em movimento: barras, tab bar, sheets, controles. Nunca atrás de texto longo, nunca em cards de conteúdo.
- [ ] `prefers-reduced-transparency` respeitado (os temas já trocam vidro por sólido).

## Ícones e imagens
- [ ] Uma família de ícones por produto, com o mesmo traço e tamanho óptico (16/20/24). Ícone com texto acompanha a altura de linha.
- [ ] Ícone sozinho como botão tem `aria-label` e tooltip. Ícone ambíguo (estrela, raio, nuvem) ganha rótulo visível.
- [ ] Imagens com proporção fixa (`aspect-ratio`), `object-fit: cover` e fundo `sunken` enquanto carregam.
- [ ] Avatares e logos de terceiros com borda sutil (`border`) para não vazarem no fundo de mesma cor.

## Acabamento (o que faz parecer caro)
- [ ] Estados completos em todo controle: padrão, hover, press, foco, desabilitado, carregando.
- [ ] Hit area maior que o desenho (pseudo-elemento ou padding), mínimo 44×44 no toque.
- [ ] Sem saltos de layout: reserve espaço de imagens, badges e mensagens de erro.
- [ ] Textos cortados com reticências têm o texto completo em tooltip ou no detalhe.
- [ ] Cursor correto (`pointer` só em links e controles clicáveis, `text` em campos, `grab` no que arrasta).
- [ ] Seleção de texto, scrollbar e `accent-color` usam o tema.

## Fontes
- Refactoring UI, Adam Wathan e Steve Schoger: https://www.refactoringui.com/
- Apple HIG, Layout e Typography: https://developer.apple.com/design/human-interface-guidelines/layout · https://developer.apple.com/design/human-interface-guidelines/typography
- Apple HIG, Materials (vidro e Liquid Glass): https://developer.apple.com/design/human-interface-guidelines/materials
- Material 3, Color roles: https://m3.material.io/styles/color/roles
- Laws of UX (proximidade, Prägnanz, região comum): https://lawsofux.com/
- Vercel Web Interface Guidelines: https://vercel.com/design/guidelines
