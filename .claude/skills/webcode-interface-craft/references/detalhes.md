# Detalhes de interface por área

Regras práticas cruzadas de Vercel Web Interface Guidelines, Linear, GitHub Primer, Atlassian, Stripe, Smashing Magazine (2025–2026), Josh W. Comeau, NN/g e GOV.UK. Fontes e URLs: `docs/pesquisa/ux-craft.md` no repo webcode-design. Leia só a área da tarefa.

## 1. Interação
- **Tudo funciona por teclado** e segue o padrão APG do componente. (Vercel)
- **Alvo de toque**: o que parece clicável é clicável ("sem zona morta"); mínimo 24 px no desktop, 44 px no mobile. Checkbox/radio dividem o alvo com o rótulo. (Vercel)
- **Tooltip**: atraso só no primeiro do grupo; os vizinhos abrem na hora. (Vercel, Emil)
- **Estado na URL**: filtros, abas, paginação, painel aberto. F5, compartilhar e voltar funcionam. (Vercel; Linear testa cada mudança por tipo de visão)
- **Otimista com saída**: atualize a UI antes do servidor e, se falhar, desfaça ou ofereça Desfazer. (Vercel)
- **Destrutivo**: confirmação **ou** desfazer numa janela segura; para mudança arriscada já salva, ofereça desfazer. (Vercel, Primer Saving)
- **`overscroll-behavior: contain`** em modais e drawers. (Vercel)
- **Gesto sempre com alternativa** de clique/teclado (arrastar, swipe, pinça). (Vercel; WCAG 2.5.7 já está no overlays.md)
- **Link é `<a>`**, para Ctrl+clique e "abrir em nova aba" funcionarem. (Vercel)
- **Atalhos**: mostre o símbolo da plataforma (⌘ vs Ctrl) e funcione em teclados não-QWERTY. (Vercel)
- **Pense em quem usa o dia todo**: velocidade é recurso. A Linear construiu arquitetura local-first porque a reclamação nº 1 de ferramentas corporativas era lentidão. (Karri Saarinen, First Round)

## 2. Formulários
- **Não desabilite o botão de enviar** antes da tentativa, nem quando o formulário está inválido ou sem mudanças. Ao enviar: desabilite, mostre spinner, mantenha o rótulo. (Vercel, Primer Saving)
- **Erro ao lado do campo** e foco no primeiro erro ao enviar. (Vercel; Primer Loading manda focar a mensagem de erro)
- **Não bloqueie digitação nem colar**; valide e mostre o problema. Corte espaços de texto colado. (Vercel)
- **`autocomplete`, `name`, `type` e `inputmode` corretos**; `spellcheck=false` em e-mail, código e usuário; fonte ≥ 16 px em input no mobile (evita zoom no iOS). (Vercel)
- **Enter envia** em formulário de um campo; em textarea, ⌘/Ctrl+Enter envia. (Vercel)
- **Salvar explícito vs automático**: comece com salvar explícito; **não misture os dois no mesmo formulário**. Automático só para controles imperativos (switch, segmented control). Multi-select tem Salvar/Cancelar e não salva ao fechar o menu. (Primer Saving)
- **Rótulo de botão é verbo + objeto**: "Salvar endereço", não "Continuar". (Primer, Vercel)
- **Falhou ao salvar? Mantenha os dados** digitados no formulário. (Primer)
- **Aviso de alterações não salvas** antes de sair. (Vercel, Primer)
- **Placeholder mostra exemplo** e nunca substitui o rótulo; a dica de formato fica fora do campo (GOV.UK, NN/g); o placeholder só repete o exemplo (Vercel).

#### Data (date picker e campos de data)
- **Digitar primeiro, calendário como complemento.** Aceite separadores variados e formatos curtos; dica de formato visível. (Smashing 2017; Ark UI tem `parse`/`format`)
- **Data conhecida (nascimento, validade de documento) não usa calendário**: três campos (dia, mês, ano) ou um campo com máscara; sem auto-avançar entre campos; nunca dropdown de ano. (Smashing 2021)
- **Atalhos**: hoje, amanhã, em 7 dias; em relatório, "últimos 7/30 dias", "este mês", "mês passado". (Smashing 2017; presets do Ark UI)
- **Range**: no máximo 6 toques; vai do início ao fim sem abrir um segundo seletor; **dois meses lado a lado** no desktop; faixa selecionada com fundo contínuo e anunciada ao leitor de tela. (Smashing 2017; `numOfMonths` do Ark UI)
- **Marque o hoje**, separe fim de semana, esmaeça o indisponível e avise na hora se o intervalo não terá resultado. (Smashing 2017)
- **Início da semana pelo público** (Smashing manda escolher domingo ou segunda pelo público; no calendário brasileiro o costume é domingo, a confirmar com o produto). Use `Intl`/locale e nunca formate data à mão. (Atlassian Date-time; Smashing)
- **Mobile**: overlay em tela cheia (ou bottom sheet) no estreito, painel no desktop. (Smashing 2017)
- **Relativo para recente, absoluto depois de 7 dias**, sempre com o carimbo exato no tooltip. Intervalos com "a"/"até", não hífen. (Atlassian Date-time)

## 3. Feedback (carregando, salvo, erro, toast)
- **Ciclo completo**: iniciado, em andamento, sucesso, falha. Cada um tem estado visível e anúncio (`role="status"` sempre no DOM). (Primer Loading)
- **Limiares de espera**: < 1 s sem indicador; 1–3 s indeterminado; 3–10 s determinado se possível; > 10 s determinado e, se der, em segundo plano. (Primer Loading)
- **Anti-pisca**: atrase spinner/skeleton ~150–300 ms e, se aparecer, mantenha ~300–500 ms. (Vercel)
- **Skeleton com as medidas do conteúdo final** (sem layout shift); um anúncio para o grupo de skeletons, não um por item. (Vercel, Primer)
- **Ação simples que deu certo não precisa de confirmação extra**: o resultado visível já é o feedback. (Primer Accessible notifications)
- **Toast é para o leve**: confirmação e alerta que pedem pouca interação. Crítico (perda de dados, função indisponível) vai para banner; ação obrigatória vai para inline ou dialog. (Atlassian Flag, Atlassian Messages, Primer)
- **Erro e aviso crítico nunca somem sozinhos.** Sucesso pode expirar. Não misture na mesma pilha toasts que somem com os que ficam. (Atlassian Flag)
- **Toast acima do modal ativo** quando os dois coexistem. (Atlassian Flag)
- **No dialog, mostre a mensagem dentro dele**, sem fechar e jogar um banner na página. (Primer Notification messaging)
- **Notificação (sistema)**: priorize o que vem de pessoas, agrupe em resumo, ofereça "silenciar por 24 h"; "na dúvida, adie". (Smashing 2025)
- **Divergência importante**: Primer/GitHub **não recomenda toasts** (problemas com WCAG 2.2.1, 1.3.2, 2.1.1, 4.1.3; somem, cobrem conteúdo, difíceis de ver com lupa). Adam Silver concorda. Sonner, Base UI, HeroUI, Atlassian e Vercel usam. Nossa posição: toast permitido **só para confirmação com desfazer ou informação que também existe em outro lugar**; nunca o único registro.

## 4. Layout e acabamento visual
- **Alinhamento intencional** (grade, linha de base, borda ou centro óptico) e ajuste óptico de ±1 px quando a geometria engana. (Vercel)
- **Raios concêntricos**: raio do filho ≤ raio do pai (raio interno = externo − padding). (Vercel)
- **Sombra em 2 camadas** (ambiente + direta) e borda semitransparente junto. (Vercel)
- **Hover, ativo e foco com mais contraste que o repouso.** (Vercel)
- **Estrutura se sente, não se vê**: menos divisórias, bordas de baixo contraste. (Linear 2026)
- **Navegação recua, conteúdo manda**: sidebar alguns níveis mais apagada que a área de trabalho, ícones menores, texto inativo atenuado. "Não dispute atenção que você não conquistou." (Linear 2026)
- **Menos ícones decorativos** (Linear tirou fundos coloridos dos ícones de time). (Linear 2026)
- **Tema gerado de poucas entradas** em espaço perceptual: Linear passou de 98 variáveis por tema para 3 (base, accent, contraste) em LCH; Stripe usou CIELAB para que cores a 5 níveis de distância sempre passem contraste de texto (4 níveis para ícones/texto grande). Valida o nosso estúdio OKLCH. (Linear 2024, Stripe)
- **Teste em mobile, notebook e ultrawide**; respeite `env(safe-area-inset-*)`; teste com barra de rolagem sempre visível no macOS. (Vercel)
- **Densidade não é desculpa para ruído**: Linear manteve densidade e reduziu ruído alinhando rótulos, ícones e botões vertical e horizontalmente. (Linear 2024)

## 5. Tipografia
- **Números tabulares** para comparar (tabelas, contadores, preços). (Vercel)
- **Aspas curvas e reticência de um caractere** (… e não ...). (Vercel)
- **Espaço não quebrável** entre número e unidade ("10 MB", "R$ 1.200"), atalhos e nomes compostos. (Vercel)
- **Sem viúvas e órfãs** em títulos (`text-wrap: balance`) e parágrafos (`text-wrap: pretty`). (Vercel)
- **Display para títulos, texto para o resto**: Linear usa Inter Display nos títulos e Inter no corpo. Vale como regra de tema: fonte ótica de display em tamanhos grandes. (Linear 2024)
- **`translate="no"`** em marca, código e identificadores. (Vercel)

## 6. Copy (microtexto)
- **Voz ativa, segunda pessoa, verbo específico**: "Gere uma nova chave em Configurações", não "Ocorreu um erro". (Vercel; Atlassian Messages)
- **Erro diz o que houve e o próximo passo**, sem culpar e sem jargão. (Atlassian Flag; Vercel)
- **Aviso fala do que vai acontecer**; o que já aconteceu é erro. (Atlassian Flag)
- **Sucesso confirma o resultado e oferece ver o item criado.** (Atlassian Flag)
- **Link descreve o destino** ("Sobre permissões de usuário"), nunca "Saiba mais". (Atlassian Flag)
- **Reticências** em item de menu que abre outra etapa ("Renomear…") e em estado em andamento ("Salvando…"). (Vercel)
- **Moeda com 0 ou 2 casas, consistente no contexto**; numerais para contagens ("8 propostas"). (Vercel)
- **Título de toast resume o motivo**; mensagem opcional e curta. (Atlassian Flag)

## 7. Performance percebida
- **Anime só `transform` e `opacity`**; nunca `transition: all`. (Vercel)
- **Ordem de escolha**: CSS → Web Animations API → biblioteca JS. (Vercel)
- **Interrompível**: input do usuário cancela a animação. (Vercel)
- **Duração**: feedback simples ~100 ms; mudança grande de tela (modal) 200–300 ms; quase tudo entre 100 e 400 ms; ≥ 500 ms parece arrastado. **Saída mais curta que entrada** (ex.: 300 ms entra, 200–250 ms sai). Quanto mais frequente, mais curta. (NN/g)
- **Interação 50–150 ms, transição 150–400 ms**; dropdown 150 ms, modal 250 ms; saídas mais rápidas para não bloquear o fluxo; uma animação focal por vez; nunca faça o usuário esperar a animação. (Atlassian Motion)
- **Reduced motion**: Atlassian desliga tudo (mudança instantânea); NN/g remove; Primer **mantém** o spinner girando mas sem efeito grande. Regra: tire deslocamento e escala, mantenha fade curto e indicadores de progresso.
- **Teste com CPU/rede limitadas, Safari e modo de pouca energia do iOS**; perfile re-render (React DevTools/React Scan); virtualize listas grandes ou use `content-visibility: auto`. (Vercel)
- **POST/PATCH/DELETE < 500 ms** como meta. (Vercel)
- **Loop de animação = vídeo** (`<video autoplay muted loop playsinline>`), não GIF. (Vercel)

## 8. Capricho (whimsy) sem atrapalhar
- **Capricho responde a uma ação do usuário** (apertar, arrastar), é curto e não se repete sozinho. (Josh Comeau, "A Million Little Secrets")
- **Novidade é o ingrediente**: efeito copiado de biblioteca perde a graça. (Josh Comeau)
- **Boop**: hover que dá um "pulo" e volta após ~150 ms mesmo com o cursor parado; mola `tension 300, friction 10`; com reduced motion não mexe; não dispara no foco de teclado (é decoração, não indicador de foco). (Josh Comeau, "Boop!")
- **Animação em SVG por grupo** (`<g>`) com `transform-box: fill-box` e origem no ponto físico do pivô. (Josh Comeau; Vercel)
- **Onde cabe**: momentos raros (onboarding, primeira vez, conquista). Em ferramenta usada o dia todo, não. (Emil; Thorsten Ball sobre a palestra de Andy Allen)


## 9. Materiais e camadas (vidro, Liquid Glass)
Fonte: Apple WWDC25 ("Meet Liquid Glass", "Get to know the new design system"), HIG Materials, ADR 0014 e 0022 do DS.
- **Duas camadas.** Conteúdo (lista, foto, texto, mapa) fica embaixo e é sólido; a camada funcional (barras, tab bar, controles flutuantes, menus, sheets) flutua por cima em vidro. Vidro dentro do conteúdo (card de lista em vidro sobre fundo liso) é enfeite: use `card`.
- **Vidro precisa de algo atrás.** Sobre fundo liso ele vira um cinza translúcido sem graça. Use quando há foto, mapa, vídeo ou rolagem passando por baixo; senão, superfície sólida.
- **Espessura pela função**: fino só para ícone/texto grande sobre mídia, regular para barras e botões, espesso quando há texto secundário (menus, avisos, campos). Nunca vidro sobre vidro: dentro do vidro, hover `foreground/8` e seleção em lente sólida `bg-card`.
- **Tinta = hierarquia.** Vidro tingido (`glass-prominent`, `glassTint`) só na ação principal sobre mídia, uma por tela. Status (sucesso, aviso) dentro do vidro vai no ícone; o texto fica na cor do tema.
- **Controles que viram lente.** No toque, o vidro reage: engrossa (`glassInteractive`), afunda com mola (`springPress`), o polegar do Switch/Slider vira lente (`thumb="lens"`), a luz nasce do ponteiro (`glassLight`). É resposta ao gesto, não decoração parada.
- **Concentricidade.** Forma interna acompanha a externa: raio interno = raio externo − padding; cápsula dentro de cápsula; botão circular no canto de um painel arredondado com o mesmo centro de curva.
- **Bordas da rolagem.** Onde o conteúdo passa sob a barra de vidro, esmaeça com `progressive-blur` em vez de borda dura.
- **Limite**: até ~3 camadas de vidro visíveis (desempenho e leitura); `prefers-reduced-transparency` vira sólido sozinho pelos tokens.
