# Catálogo @webcode (GERADO do registry — não edite)

Procure pelo nome; não leia inteiro.

## Famílias (25)
**Barras de navegação e ação**
- `tab-bar`: navegação principal do app mobile, 3 a 5 destinos, vidro
- `bottom-bar`: ação grudada no rodapé (Comprar, Salvar), sobe com o teclado
- `save-bar`: alterações não salvas: aparece só com o formulário sujo, Descartar + Salvar e Ctrl/⌘+S
- `navigation-bar`: topo de tela iOS com título grande que recolhe ao rolar
- `page-header`: topo de página web: h1, descrição, breadcrumb e ações
- `toolbar`: ferramentas de editor ou lista na web, um Tab e setas
- `menubar`: menus de app desktop (Arquivo, Exibir…)
- `dock`: atalhos no desktop com ampliação perto do ponteiro
- `keyboard-toolbar`: barra acima do teclado no celular (anterior, próximo, OK)
- `bottom-toolbar`: ações da tela atual no rodapé do iPhone (Mail), em cápsulas de vidro
- `glass-group`: poucos botões de vidro soltos sobre foto ou mapa que se fundem numa cápsula (iOS 26)
- `sidebar`: navegação lateral com a API do shadcn, quando a casca é sua
- `app-shell`: casca pronta de app web: sidebar que recolhe, topbar e menu no celular

**Escolher uma opção**
- `select`: lista curta na web, visual do Input
- `native-select`: formulário no celular: roda nativa no iPhone, folha no Android
- `combobox`: muitas opções, busca sem acento, seleção múltipla com chips
- `cascader`: opções em níveis (Estado → Cidade → Bairro)
- `select-list`: iOS: a linha mostra o valor e abre as opções como tela
- `wheel-picker`: iOS: roda com scroll-snap para valores curtos (hora, quantidade)
- `radio-group`: até 5 opções visíveis de uma vez
- `toggle-group`: 2 a 4 opções lado a lado (controle segmentado)

**Código e senha**
- `input-otp`: código recebido por SMS ou e-mail; teclado do sistema e colar
- `pin-pad`: senha do app em tela dedicada, teclado próprio, dígitos ocultos

**Data e hora**
- `input-date`: digitar dd/mm/aaaa com máscara; valor ISO
- `date-picker`: escolher no popover (data ou intervalo) na web
- `calendar`: calendário inline, quando ele é o conteúdo da tela
- `date-time-field`: iOS: pílulas compactas que abrem calendário ou rodas na própria lista
- `week-strip`: escolher o dia da semana corrente (agenda, hábitos)

**Painéis, folhas e confirmações**
- `dialog`: tarefa curta em modal na web; `mobile="sheet"` no celular
- `alert-dialog`: confirmação que interrompe, destrutiva e rara
- `popconfirm`: confirmação leve presa ao botão, sem bloquear a tela
- `sheet`: painel lateral ou inferior na web (detalhe ao lado da lista)
- `drawer`: gaveta arrastável no celular (ações, filtros)
- `action-sheet`: iOS: lista de ações com destrutiva e Cancelar separado
- `dialog-stack`: fluxo em etapas empilhadas (Esc volta uma)
- `context-preview`: segurar abre prévia grande com menu (iOS)
- `share-sheet`: compartilhar: nativo no celular, folha própria na web

**Avisos e mensagens**
- `sonner`: resultado de ação com Desfazer e promise (toast)
- `hud`: iOS: aviso central rápido (Copiado, Salvo) sem ação
- `shake-to-undo`: iOS: desfazer chacoalhando, com alerta de confirmação e botão junto
- `undo-snackbar`: ação destrutiva otimista: uma linha, Desfazer com contagem e commit no fim
- `progress-toast`: tarefa longa em segundo plano (envio, exportação) com % e tempo restante
- `capsule-toast`: aviso curto e expressivo, um por vez, que se desdobra em detalhe (promise)
- `notification-banner`: notificação in-app que desce do topo e some sozinha
- `banner`: faixa fechável no topo da página ou seção, persistente
- `announcement-bar`: site público: novidade ou promoção acima do menu, uma ou várias mensagens
- `alert`: mensagem em linha dentro do conteúdo, com ação no canto
- `result`: tela inteira de desfecho (sucesso, erro, 404, 500)
- `empty`: estado vazio: primeira vez, sem resultado, erro de lista

**Linhas e listas**
- `item`: linha de lista na web: mídia, título, descrição, ações
- `list-group`: iOS: lista agrupada (Ajustes) com ícone, valor e seta
- `description-list`: chave → valor em tela de detalhe
- `table`: dados tabulares simples, sem ordenar ou filtrar
- `data-table`: ordenar, buscar, filtrar, selecionar em lote, paginar
- `virtual-list`: milhares de linhas simples (extrato, contatos) com rolagem infinita
- `tree-view`: hierarquia com expandir e seleção por checkbox
- `transfer-list`: mover itens entre dois conjuntos
- `timeline`: eventos em ordem (rastreio, atividade, onboarding)

**Gestos em linha e reordenar**
- `swipe-actions`: ações ao deslizar a linha, estilo Mail do iOS
- `card-acao-lateral`: card de lista com bordinhas e presets de ação (ordens de serviço, Axion)
- `sortable-list`: reordenar por alça e teclado (opcional, Motion)
- `kanban`: arrastar entre colunas (opcional, Motion)
- `pull-to-refresh`: puxar para atualizar a lista

**Coleções de mídia**
- `photo-grid`: galeria de miniaturas com seleção em lote (Fotos do iPhone)
- `carousel`: slides com scroll-snap, indicadores e autoplay
- `card-stack`: pilha ou leque de cards para arrastar o da frente
- `story-viewer`: stories com progresso e toque para avançar
- `image-viewer`: lightbox com zoom e miniaturas
- `product-card`: vitrine de produto no celular, fotos com snap
- `video-player`: vídeo com controles próprios, capítulos e legendas
- `wavy-accordion`: vitrine de site com imagens em fatias: a aberta cresce e as outras ondulam em 3D
- `inspiration-grid`: mural de referências em alvenaria (alturas variadas) com Salvar e busca por cor; não é ranking

**Buscar**
- `search-bar`: iOS: pílula com Cancelar que entra ao focar
- `search-expand`: lupa que expande em pílula com sugestões, em barras e cabeçalhos
- `command`: paleta de comandos (⌘K) com busca sem acento
- `input-group`: campo de busca comum com ícone e atalho Kbd
- `mentions`: sugestões por @ e # dentro de um textarea
- `section-index`: índice A–Z para pular na lista longa
- `color-filter`: buscar ou filtrar por cor (paleta de até 5), em galeria ou loja

**Cards e efeitos de superfície**
- `card`: base: interactive, elevated, flat e glass
- `expandable-card`: destaque que abre em tela cheia (App Store Hoje)
- `shadow-card`: sombra de expressão editável (camadas, neumorfismo, brutalista)
- `spotlight-card`: luz que segue o cursor e acende a borda
- `border-beam`: feixe de luz percorrendo a borda (destaque pontual); aurora = a IA está aqui/trabalhando (prompt, Parar, busca)
- `stat-card`: KPI com variação, período e sparkline
- `ticket-card`: bilhete com picote e rota
- `price-tag`: preço BR com Pix, desconto e parcelas
- `project-card`: trabalho de portfólio em galeria: shot, estudo de caso ou ladrilho de logo, com autor e métricas

**Quem é (pessoa ou agente)**
- `avatar`: pessoa real ou marca: foto, iniciais, status online
- `bot-avatar`: agente de IA: mascote vivo que mostra o que o bot está fazendo

**Esperar algo terminar**
- `spinner`: espera curta e genérica (botão, carregando)
- `thinking-orb`: a IA está trabalhando e diz a etapa (resolvendo, buscando, pensando)

**Ações que saem de um botão**
- `fab`: speed dial com mola e rótulos, padrão de app
- `gooey`: menu radial ou pílula com efeito líquido (vitrine, criar novo); superfície sólida

**Mais conteúdo**
- `pagination`: páginas numeradas ou compactas, estado na URL
- `load-more`: botão Carregar mais ou rolagem infinita
- `spoiler`: texto longo recolhido com Mostrar mais
- `collapsible`: um bloco que abre e fecha
- `accordion`: vários blocos, um ou mais abertos

**Progresso, metas e contagem**
- `progress`: barra de progresso simples ou indeterminada
- `scroll-progress`: quanto do artigo já foi lido (barra) e voltar ao topo (anel)
- `usage-meter`: uso do limite do plano com aviso aos 80%
- `activity-ring`: anéis concêntricos de meta (calorias, hábito)
- `gauge-chart`: medidor em arco com faixas e meta
- `segmented-bar`: alocação proporcional em fatias (carteira, orçamento)
- `progress-columns`: progresso por dia ou categoria em colunas
- `stepper`: etapas de wizard ou checkout
- `countdown`: contagem regressiva com rótulo acessível
- `number-ticker`: número de KPI animado ao entrar na tela

**Animar um conjunto de componentes**
- `stagger`: entrada em ordem de um conjunto que já existe (KPIs, cards, lista) ao montar, ao rolar ou em fila conforme cada item chega à tela (grade longa)
- `animated-list`: feed em que item novo chega no topo (notificações, atividade)
- `presence-list`: itens saem e voltam (arquivar com Desfazer, remover do carrinho) e os vizinhos se reacomodam
- `swap`: o mesmo bloco troca de estado (carregando, resultado, vazio, passo) e a altura acompanha
- `screen-transition`: a TELA inteira troca (rota, passo de quiz, detalhe) com efeito de vitrine: portas, persianas, pilha 3D, desfoque ou varredura; voltar pela borda é a stack-view

**Navegar um acervo grande**
- `taxonomy-browser`: entrar pelo tipo visual (forma, objeto, letra) com subcategorias e índice A–Z
- `gallery-header`: já dentro da galeria: categoria atual, Seguir, ordenar e filtros
- `pill-filter`: uma dimensão com muitas categorias: pílulas de escolha única e o resto em "+N mais"
- `facet-bar`: várias dimensões ao mesmo tempo (categoria, indústria, plataforma): menus com várias escolhas e fichas removíveis

**Topo de site**
- `morph-nav`: topo de site de marketing completo: pílula no hover, painéis que mudam de forma, vidro ao rolar e menu no celular
- `navigation-menu`: menu com submenus (Radix) dentro da sua própria barra, quando a casca é sua
- `floating-nav`: landing de uma página: ilha que some ao descer e marca a seção visível
- `mega-menu`: muitos destinos agrupados em colunas com destaque, dentro da sua barra
- `fullscreen-nav`: portfólio ou estúdio com poucas páginas: menu cobre a tela com links grandes
- `drawer-nav`: loja ou catálogo com categorias em vários níveis: menu lateral com níveis empilhados e voltar
- `tabs-nav`: subnavegação entre páginas de uma seção, em abas com indicador

**Abertura de página (hero)**
- `hero-section`: hero de landing em 4 variações (centrado, dividido, editorial, palco), com qualquer visual
- `particle-hero`: hero em carrossel com partículas que mudam de forma, como efeito de assinatura
- `hero-video`: abertura de marca com vídeo ambiente em loop por trás do texto
- `spec-hero`: ferramenta técnica ou documentação: especificações mono, título serifado e figura explodida
- `detail-hero`: página de um item de catálogo (skill, template, ebook) com comando ou compra
- `award-hero`: destaque ou premiação do dia: meta com nota, título gigante, créditos e capa
- `floating-gallery-hero`: produto de inspiração ou acervo visual: colagem flutuante em volta de título e busca

**Assinatura de recebimento**
- `delivery-receipt`: canhoto completo: conferir, quem recebeu, assinatura, foto e comprovante
- `signature-pad`: só a área de assinar (contrato, aceite, vistoria) dentro do seu formulário

**Planos e assinatura**
- `pricing-plans`: escolher ou vender plano (colunas, lista no checkout, carrossel no app)
- `plan-comparison`: comparar recursos entre planos em tabela
- `subscription-manager`: plano atual, cancelar com retenção e prévia da troca
- `locked-feature`: recurso fora do plano no lugar dele, com o upgrade

**Botões de vitrine (site)**
- `ink-button`: a cor entra como tinta pelo lado do mouse; portfólio e estúdio
- `magnetic-button`: o botão é puxado na direção do mouse; CTA de hero
- `shimmer-button`: ação principal com brilho, halo ou borda viva; oferta e preço

**Chamadas para ação (site)**
- `cta-section`: seção inteira de CTA: faixa, dividido, newsletter ou download
- `waitlist-form`: pré-lançamento: e-mail, posição na fila e indicação
- `offer-cta`: promoção com prazo real, preço de/por e contagem
- `slide-in-cta`: oferta no canto para quem já leu parte da página, sem modal
- `app-download`: levar do site para o app: QR, lojas e nota

**Efeitos de rolagem**
- `scroll-zoom`: a imagem principal abre até ocupar a tela
- `text-scroll-reveal`: frase de impacto que acende palavra por palavra
- `sticky-cards`: passo a passo em cartões que empilham
- `horizontal-scroll`: galeria que anda de lado enquanto a página desce
- `parallax`: camadas decorativas em velocidades diferentes
- `scroll-path`: palco preso com caminho que se desenha e passos que trocam

## Catálogo atual (280)
| Item | Tipo | O que é |
| --- | --- | --- |
| `utils` | lib | cn(): clsx + tailwind-merge (conhece os espaçamentos da densidade do tema). |
| `spinner` | componente | Indicador de carregamento com rótulo pt-BR. |
| `button` | componente | Botão com loading sem salto, pressão com escala, variantes soft/glass e alvo de toque de 44px. |
| `input` | componente | Campo com borda 3:1, 40px e 16px no mobile. |
| `textarea` | componente | Área de texto que cresce com o conteúdo. |
| `label` | componente | Rótulo de formulário. |
| `separator` | componente | Divisor. |
| `field` | componente | Composição de formulário (rótulo, descrição, erro, grupos). |
| `checkbox` | componente | Caixa de seleção com estado indeterminado visível. |
| `radio-group` | componente | Grupo de opções exclusivas. |
| `switch` | componente | Interruptor com proporção e mola do iOS (sm, default, lg). |
| `badge` | componente | Selo com variantes de status e ponto. |
| `card` | componente | Cartão com variantes interactive, elevated, flat e glass. |
| `expandable-card` · beta | componente | Cartão que expande em tela (App Store Hoje): imagem e título viajam até a tela cheia pela View Transitions API; Dialog do Radix com foco preso, Esc e retorno do foco. |
| `dialog` | componente | Modal com tamanhos e corpo rolável (DialogBody). |
| `dialog-stack` · beta | componente | Diálogo em etapas empilhadas (a anterior aparece atrás), Esc volta uma etapa, progresso e foco por etapa. |
| `sheet` | componente | Painel lateral/inferior com safe-area e durações do tema. |
| `popover` | componente | Balão ancorado com movimento do tema. |
| `tooltip` | componente | Dica com atraso de 300ms e skip delay. |
| `dropdown-menu` | componente | Menu de ações com itens de 44px no toque. |
| `select` | componente | Seleção com os estados do Input. |
| `native-select` | componente | <select> do sistema com o visual do Select: roda nativa no iPhone, folha no Android. Para listas curtas. |
| `tabs` | componente | Abas com indicador deslizante (segmented control). |
| `sonner` | componente | Toasts que seguem os tokens, sem next-themes. |
| `command` | componente | Paleta de comandos com busca sem acento. |
| `table` | componente | Tabela com densidade do tema, cabeçalho fixo, colunas numéricas e fixas, zebra e grade. |
| `skeleton` | componente | Placeholder com brilho por transform. |
| `card-acao-lateral` | componente | Card de lista com bordinhas: puxar para a esquerda revela/executa a próxima ação (com Desfazer), para a direita abre painel de informação. Pointer events, toque e teclado; preset Colinas OS. |
| `alert` | componente | Mensagem em linha com variantes de status e ação no canto. |
| `alert-dialog` | componente | Confirmação que interrompe, com foco seguro em Cancelar. |
| `drawer` | componente | Gaveta com arrastar para fechar, sem vaul; detents e sheet que sobe com o teclado. |
| `hover-card` | componente | Prévia ao passar o mouse, com atrasos que evitam abrir de passagem. |
| `banner` | componente | Faixa de aviso fechável para topo de página ou seção. |
| `tour` | componente | Tour guiado de primeiro acesso: spotlight com scrim do tema, popover ancorado, progresso, teclado, foco preso, movimento reduzido e “já visto” por usuário/versão (localStorage ou API). |
| `br` | lib | Formatação e validação brasileiras sem dependência: CPF, CNPJ alfanumérico, CEP, R$ em centavos, parcelas e datas. |
| `use-mask` | hook | Máscara de campo que não pula o cursor ao editar no meio. |
| `input-document` | componente | Um campo para CPF e CNPJ (inclusive alfanumérico) com máscara, colar e validação no blur. |
| `input-cep` | componente | CEP com máscara que busca o endereço no 8º dígito, com cache, cancelamento e status acessível. |
| `input-currency` | componente | Valor em reais digitado pelos centavos, estado em centavos inteiros, colar 1.234,56. |
| `input-date` | componente | Data em dd/mm/aaaa com máscara, validação real, min/max e seletor nativo; valor ISO. |
| `input-phone` · beta | componente | Telefone BR com DDD: máscara que troca entre fixo e celular, valida DDD real e devolve E.164 (+55…). |
| `pagination` | componente | Paginação pt-BR com Paginator pronto (numerada, simples, compacta ‹ 2 / 5 › ou com progresso; números square/pill/bordered/track), resumo “1–50 de 1.240” e faixa estável; vidro com `material="glass"`. |
| `load-more` | componente | Carregar mais e rolagem infinita com progresso, anúncio acessível e fallback para botão. |
| `carousel` | componente | Carrossel com scroll-snap nativo (sem embla), indicadores e autoplay pausável e acessível; peek dos vizinhos e efeito de escala por CSS. |
| `card-stack` · beta | componente | Pilha ou leque de cards: arrastar o da frente o manda para o fim, botões e setas, cards de trás inert, carrossel acessível; vidro com `material="glass"`. |
| `image-viewer` | componente | Lightbox com zoom (duplo toque, roda, pinça), deslizar, teclado e galeria de miniaturas. |
| `file-upload` | componente | Envio de arquivos com arrastar/colar, validação pt-BR, prévia, progresso, cancelar e tentar de novo; resumo do lote com tempo restante (@webcode/eta). |
| `page-header` | componente | Cabeçalho de página: h1, descrição, breadcrumb e ações que descem no mobile. |
| `price-tag` | componente | Preço brasileiro: Pix em destaque, desconto, parcelas com total e "de" riscado acessível. |
| `ticket-card` · beta | componente | Bilhete (embarque, ônibus, ingresso) com picote recortado por máscara, rota origem → destino tracejada e campos do canhoto; vertical ou horizontal; vidro com `material="glass"`. |
| `empty` | componente | Estado vazio (API do shadcn) + EmptyState: primeira vez, sem resultado e erro. |
| `stat-card` | componente | KPI com variação pelo significado, período, sparkline SVG e card inteiro clicável. |
| `usage-meter` | componente | Uso de limite do plano: barra, anel ou compacto, aviso aos 80% e perigo no limite. |
| `pricing-plans` · beta | componente | Planos de assinatura em 3 variações (colunas, lista compacta, carrossel com espiada) com os mesmos dados; escolha por rádio ou botão Assinar, anual por mês com total e economia em R$, parcelas e Pix. BillingToggle mensal/anual com selo da economia. |
| `plan-comparison` · beta | componente | Tabela de recursos por plano: cabeçalho que gruda com preço e botão, coluna recomendada, ✓/— com texto para leitor de tela, grupos que recolhem e um plano por vez em tela estreita. |
| `subscription-manager` · beta | componente | Minha assinatura: SubscriptionCard (status, próxima cobrança, Pix/cartão/boleto, aviso por status), CancelSubscription (2 cliques, motivo opcional, oferta de retenção ao lado) e PlanChangeSummary (proporcional no upgrade, downgrade no fim do ciclo). |
| `filter-counters` | componente | Contadores que filtram a lista (clique de novo limpa), em pílulas ou cards, com tom por status. |
| `permission-matrix` | componente | Permissões por módulo: matriz papel × permissão com selo de alterado, e lista por pessoa com diferença do papel. |
| `appearance-preferences` | componente | Preferências do usuário: tamanho do texto, tom de fundo e cor principal com checagem de contraste e trava do administrador. |
| `locked-feature` | componente | Recurso fora do plano em card, linha ou véu sobre o conteúdo, com CTA só para quem pode contratar. |
| `chart-core` | componente | Peças comuns dos gráficos SVG: legenda, tooltip, tabela acessível, navegação por setas, escala redonda e formatos pt-BR. |
| `bar-chart` | componente | Colunas e barras em SVG puro: agrupadas, empilhadas, 100%, cascata (DRE), negativos, coluna + linha na mesma escala, meta, destaque, valores no topo, tooltip e tabela. |
| `line-chart` | componente | Linha e área em SVG puro: várias séries numa escala só, área empilhada, curva suave monotônica, cruz com tooltip, último valor e meta. |
| `donut-chart` | componente | Rosca e meia-rosca em SVG puro: até 5 fatias + Outros, total no centro, legenda com valor e %, tabela acessível. |
| `radar-chart` · beta | componente | Radar em SVG puro: até 3 séries em 3 a 10 critérios, anéis com escala, tooltip, setas e tabela acessível. |
| `gauge-chart` · beta | componente | Medidor em SVG puro: arco de 240° ou meia-lua, faixas com nome, meta e role=meter. |
| `segmented-bar` · beta | componente | Barra de alocação: fatias proporcionais em pílulas ou barra única, trilho do que sobra, legenda em texto com destaque e role=img com resumo; vidro com `material="glass"`. |
| `activity-ring` · beta | componente | Anéis de meta concêntricos (calorias, passos, hábito) com valor no centro, legenda lateral ou embaixo e role=meter por anel; vidro com `material="glass"`. |
| `candlestick-chart` · beta | componente | Gráfico de candles (OHLC) em SVG: alta vazada e baixa cheia, eixo de preço à direita, último preço, volume opcional, tooltip e tabela acessível; vidro com `material="glass"`. |
| `progress-columns` · beta | componente | Colunas em pílula com trilho hachurado e selo de percentual: progresso por dia ou categoria, role=meter por coluna; vidro com `material="glass"`. |
| `scatter-chart` | componente | Dispersão e bolhas em SVG puro: grupos com legenda, bolha por área, linha de tendência, ponto mais próximo no hover, teclado e tabela. |
| `heatmap-chart` | componente | Mapa de calor em SVG puro: linhas × colunas, escala sequencial de um matiz em 5 degraus (color-mix), célula vazia, teclado em grade e tabela. |
| `form-validation` | componente | useFormValidation + FormErrorSummary: validação nativa com mensagens pt-BR, regras por campo, blur/correção e resumo de erros (GOV.UK). |
| `stepper` | componente | Indicador de etapas para wizard e checkout: aria-current, ✓ nas concluídas, voltar clicando e versão compacta no celular. |
| `breadcrumb` | componente | Trilha com rótulos pt-BR, truncamento e níveis do meio recolhidos no celular. |
| `sidebar` | componente | Sidebar com a API do shadcn: provider, grupos, menus, submenus, badge, ações, recolher para ícones ou fora da tela, atalho ⌘/Ctrl+B, cookie e Sheet no celular. |
| `app-shell` | componente | Casca de app pronta sobre a Sidebar: recolhe para ícones (cookie, atalho [), topbar com vidro e Sheet no celular. |
| `data-table` | componente | Tabela de dados: ordenação acessível, busca sem acento, filtros com chips, seleção em lote (Shift), densidade, colunas, paginação, linhas expansíveis, agrupamento, colunas fixas, edição na célula, linha de total, exportar CSV e cards no celular. |
| `calendar` | componente | Calendário pt-BR sem react-day-picker: data única ou intervalo, teclado APG, hoje marcado e troca de mês animada. |
| `week-strip` · beta | componente | Faixa da semana para escolher o dia: círculo ou pílula, hoje e dias com registro, teclado de grupo de rádio, arrastar troca de semana, min/max; vidro com `material="glass"`. |
| `search-expand` · beta | componente | Busca que nasce como lupa circular e expande em pílula com sugestões (combobox APG): teclado completo, vidro opcional, respeita movimento reduzido. |
| `date-picker` | componente | DatePicker e DateRangePicker (Popover + Calendar) com valor ISO, limpar, min/max e atalhos de período. |
| `input-otp` | componente | Código de verificação com a API do shadcn sem a lib input-otp: colar, SMS (one-time-code) e leitor de tela. |
| `slider` | componente | Slider Radix com polegar do iOS, alvo de 44px, intervalo com rótulos e valor opcional acima do polegar. |
| `toggle` | componente | Botão liga/desliga com acento suave, contorno bg-card e alvo de 44px. |
| `toggle-group` | componente | Grupo de toggles com variante segmented (controle segmentado do iOS). |
| `theme-toggle` · beta | componente | Troca de tema claro/escuro/sistema no estilo do shadcn (menu) e três variações com efeito: revelar em círculo, interruptor sol → lua com cortina e segmentado com dissolve. Sem next-themes, sem flash. |
| `kbd` | componente | Tecla de atalho em relevo, com versão para Tooltip. |
| `input-group` | componente | Campo com adornos (ícone, texto, botão, Kbd) e os estados do Input no grupo inteiro. |
| `button-group` | componente | Botões colados com borda única, texto e separador. |
| `accordion` | componente | Accordion com altura animada pela curva do tema, seta com mola e variante card (estilo Ajustes do iOS). |
| `collapsible` | componente | Collapsible com altura animada e sem animação em movimento reduzido. |
| `avatar` | componente | Avatar com tamanhos, fade da imagem, iniciais em acento suave, status e grupo com +N. |
| `progress` | componente | Barra de progresso com tons, tamanhos e estado indeterminado. |
| `scroll-area` | componente | Área rolável com barra fina estilo macOS, foco por teclado e bordas esmaecidas opcionais. |
| `number-ticker` | componente | Contagem animada de KPI em pt-BR (R$, %), ao entrar na tela; leitor de tela ouve só o valor final. |
| `marquee` | componente | Faixa contínua (logos, depoimentos) só com CSS, com pausa no hover/foco e botão Pausar. |
| `particle-hero` | componente | Hero em carrossel automático com partículas em canvas nativo que mudam de forma a cada slide (pirâmides, lâmpada, pessoas, imagem), cores do tema e controles acessíveis. |
| `morph-nav` · beta | componente | Navbar de site com pílula que segue o mouse e painel único que muda de forma entre os menus (morph), painel largo da barra (mega) ou caixa por item (dropdown), variações bar/pill/minimal, faixa de anúncio, vidro ao rolar e menu em sanfona no celular. Sem Radix e sem Motion. |
| `hero-section` · beta | componente | Seção de abertura em 4 variações (centered com print que endireita na rolagem, split com números, editorial de letra gigante, stage com fundo animado), título que entra palavra por palavra, HeroBadge, HeroMedia, HeroInlineMedia e HeroCircleAction. |
| `cta-section` · beta | componente | Chamada para ação em 4 variações (banner brand/surface, split, newsletter com validação e estados, download com botões de loja e QR Code) e CtaStickyBar, barra fixa que aparece ao rolar. |
| `site-footer` · beta | componente | Rodapé de site em 4 variações (columns em grade fina, big-type com o nome do tamanho da largura subindo na rolagem, cta com cartão Vamos conversar, cards), redes, links legais e Voltar ao topo. |
| `shader-background` · beta | componente | Fundo animado em WebGL nativo com 5 presets (swirl, mesh, halftone, flame, aurora) nas cores do tema, véu para contraste do texto, Pausar, quadro parado com movimento reduzido e degradê CSS sem WebGL. |
| `ink-button` · beta | componente | Botão em que a cor entra como tinta pelo ponto onde o mouse chegou e sai por onde ele saiu (do centro no teclado); variações outline, solid, soft e ghost. |
| `icon-3d` · beta | componente | Ícone com volume só em CSS a partir de qualquer ícone lucide (clay, glossy, glass, metal) nos tons do tema, inclinação no mouse e flutuação opcionais; aceita src de render 3D que o projeto baixou (ex.: 3dicons V1, CC0). |
| `floating-nav` · beta | componente | Navbar em cápsula de vidro que flutua no topo, some ao descer e volta ao subir, com pílula que marca a seção visível (scroll spy). |
| `mega-menu` · beta | componente | Item de navegação que abre painel largo com colunas de links (ícone, título, descrição), destaque à direita e rodapé. |
| `drawer-nav` · beta | componente | Menu lateral com níveis empilhados: cada submenu desliza por cima e os anteriores viram tiras que voltam; título grande, Ver tudo e rodapé. |
| `wavy-accordion` · beta | componente | Galeria em acordeão horizontal: o painel aberto cresce e as fatias giram em 3D como uma fita ondulada; legenda com link no aberto. |
| `fullscreen-nav` · beta | componente | Botão Menu que abre a tela inteira (dialog nativo) com links grandes numerados em cascata e coluna de contato. |
| `announcement-bar` · beta | componente | Faixa de aviso no topo com uma ou várias mensagens (giro com pausa e setas), selo, link e fechar lembrado no navegador. |
| `tabs-nav` · beta | componente | Navegação entre páginas em abas (links) com indicador que desliza, sombra de hover que segue o mouse e contador; linha, pílula ou segmento. |
| `scroll-progress` · beta | componente | Progresso de leitura: barra fina no topo (decorativa) ou botão Voltar ao topo com anel e porcentagem lida. |
| `hero-video` · beta | componente | Hero com vídeo de fundo em loop, sem som, véu para o texto e botão Pausar; só toca na tela e nunca sozinho com movimento reduzido ou economia de dados. |
| `rotating-text` · beta | componente | Palavra do título que troca sozinha (slide, blur, flip ou digitando), com largura que acompanha e leitura única para leitor de tela. |
| `grid-pattern` · beta | componente | Fundo decorativo de grade, pontos, cruzes ou linhas com máscara nas bordas, feixes de luz opcionais e células em destaque. |
| `scroll-zoom` · beta | componente | Seção em que a imagem começa recortada no centro e abre até ocupar tudo conforme a página rola (CSS de rolagem nativo, sem JS). |
| `compare-slider` · beta | componente | Antes e depois com divisor arrastável (horizontal ou vertical), puxador circle/pill/line, selos nos cantos, teclado de slider e CompareShowcase com abas que trocam os pares. |
| `scroll-path` · beta | componente | Palco preso na rolagem com tubo em degradê que se desenha e esfera que anda pelo caminho (wave, loop, zigzag ou d próprio), passos que seguem o progresso; SVG nativo, sem GSAP. |
| `spec-hero` · beta | componente | Hero de ferramenta ou documentação: faixa de especificações mono, título serifado com palavra em acento, linha de números, SpecFigure com legenda FIG. e ExplodedStack (camadas em vista axonométrica). |
| `repo-overview` · beta | componente | Visão geral densa de projeto, pacote ou base de documentos: abas com contador, ações com número, lista de arquivos com última mudança e data, Leia-me e coluna Sobre com tópicos, versões e pessoas. |
| `detail-hero` · beta | componente | Topo de página de item de catálogo (skill, template, plugin, ebook): trilha mono com nível em acento, selo de categoria, título e subtítulo, metadados, comando com Copiar (DetailCommand), ações e capa (DetailCover). |
| `logo-cloud` · beta | componente | Prova social com logos de clientes em grade fina, linha ou faixa contínua, monocromáticos que acendem no hover. |
| `device-frame` · beta | componente | Moldura genérica de navegador, celular, notebook ou janela para print ou demo ao vivo, com inclinação 3D e brilho opcionais. |
| `magnetic-button` · beta | componente | Botão puxado de leve na direção do mouse quando ele chega perto, com o texto andando um pouco mais (profundidade); só no mouse. |
| `shimmer-button` · beta | componente | Botão principal com acabamento: brilho que atravessa (hover ou loop), halo da marca ou borda viva em degradê girando. |
| `waitlist-form` · beta | componente | Lista de espera: e-mail e botão numa pílula, prova social (rostos e contagem) e, ao entrar, a posição na fila com link de indicação. |
| `offer-cta` · beta | componente | Oferta com selo de desconto, preço de/por em R$, contagem regressiva e botão; cartão, faixa ou ingresso com picote. |
| `app-download` · beta | componente | Convite para baixar o app com QR code (no computador), botões de loja genéricos, nota e avaliações, e prévia do app. |
| `slide-in-cta` · beta | componente | Cartão que desliza para o canto depois de rolar parte da página ou de um tempo, sem modal: não rouba foco, fecha e não volta. |
| `buy-box` · beta | componente | Caixa de compra da página de produto: nome, nota, preço com Pix e parcelas, opções em fichas (esgotado riscado), quantidade, comprar e garantias. |
| `text-scroll-reveal` · beta | componente | Parágrafo grande em que cada palavra passa da cor secundária para a cor do texto conforme rola (CSS de rolagem nativo, sem JS). |
| `sticky-cards` · beta | componente | Cartões que grudam no topo um depois do outro e se empilham; o de baixo recua quando o próximo chega. |
| `horizontal-scroll` · beta | componente | Seção presa na tela em que a faixa de cartões anda para o lado enquanto a página desce; sem suporte vira faixa com rolagem lateral. |
| `parallax` · beta | componente | Camadas que andam em velocidades diferentes conforme a seção passa pela tela (CSS de rolagem nativo); paradas com movimento reduzido. |
| `text-scramble` · beta | componente | Texto que embaralha em símbolos e se acerta letra a letra ao aparecer, no hover ou ao trocar; leitor de tela lê só o final. |
| `bento-grid` · beta | componente | Grade bento de recursos: blocos sm, wide, tall e lg com título, texto e visual (print, ícone 3D, mini componente), link no bloco inteiro. |
| `animated-list` | componente | Lista que faz itens entrarem em sequência com a mola do tema; item novo anima sozinho. |
| `stagger` · beta | componente | Entrada escalonada de um conjunto (KPIs, grade de cards, lista) só com CSS: filhos diretos em ordem, ao montar, ao entrar na tela ou em fila conforme cada um chega à tela. |
| `presence-list` · beta | componente | Lista com saída animada sem Motion: item sai, a altura recolhe e os vizinhos sobem; item novo abre espaço. Base do arquivar com Desfazer. |
| `swap` · beta | componente | Troca o estado de um bloco (carregando, resultado, vazio, passo) com fade cruzado e altura animada, sem pulo no que vem abaixo. |
| `border-beam` | componente | Feixe de luz que percorre a borda de um card ou botão, só CSS. |
| `spotlight-card` | componente | Card com luz que segue o cursor e acende a borda. |
| `copy-button` | componente | Botão de copiar com troca de ícone animada e anúncio para leitor de tela. |
| `navigation-menu` | componente | Menu de site com painel que muda de tamanho animado e conteúdo deslizando na direção do item. |
| `context-menu` | componente | Menu de clique direito / toque longo com o visual do DropdownMenu. |
| `menubar` | componente | Barra de menus de app (Arquivo, Exibir…) em bg-card com os menus do DropdownMenu. |
| `combobox` | componente | Select com busca sem acento (Popover + Command), seleção única ou múltipla com chips. |
| `cascader` · beta | componente | Seleção em níveis (Estado/Cidade/Bairro) com colunas, drill-down no celular, busca sem acento e teclado. |
| `motion` | lib | Opcional (ADR 0011): molas do tema para a biblioteca Motion (SPRINGS, FADE, useThemeSpring). Só os itens com Motion dependem dele. |
| `gesture` | lib | Mola física com velocidade inicial (themeSpring lê a mola do tema), elástico do iOS, projeção de inércia, velocímetro e haptic() (vibrate no Android, switch nativo no iOS 18+). Sem dependência. |
| `deprecate` | lib | Contrato de estabilidade (ADR 0018): deprecate(nome, substituto, versão) avisa uma vez, só em desenvolvimento, que um componente descontinuado continua funcionando mas sai na próxima major. |
| `glass` | lib | Material de vidro do tema (ADR 0014): glass("thin"\|"regular"\|"thick") com contraste garantido sobre qualquer fundo, glassInteractive e springPress. Efeitos liquid/acrylic e cor de status por glassVariant() e vidro que antecipa (glassBleed) nas barras (ADR 0023). |
| `native-glass` · beta | lib | Vidro do tema no React Native/Expo (ADR 0024): Liquid Glass do iOS 26 com expo-glass-effect (GlassView, GlassContainer que funde os botões, isInteractive), expo-blur no iOS antigo e a cor do token no Android, na web e com Reduzir transparência. GlassThemeProvider lê build/json/<tema>.json; GlassBar, GlassButton e GlassGroup (só barras e botões). Núcleo puro testado. |
| `mascot` · beta | lib | Núcleo puro dos avatares de bot: 16 formas como união de círculos e cápsulas (desenháveis em canvas e com Views no RN), pose por quadro dos 7 estados (olhar, piscar, pensar, falar, saltitar, dormir, comemorar, pulo com volta), pelo determinístico por semente, assento do chapéu, paleta e tinta do rosto por contraste. Sem dependência, testado. |
| `native-bot-avatar` · beta | lib | Avatar de bot no React Native/Expo só com react-native (Views, sem Skia nem SVG): as mesmas 16 formas e 7 estados do bot-avatar web pelo núcleo @webcode/mascot, acabamento liso, rótulo acessível e quadro parado com Reduzir movimento. |
| `orb` · beta | lib | Núcleo puro das thinking orbs: pontos 3D de 7 figuras (esfera, grade, anel, enxame, constelação, círculo, triângulo), ligações de vizinhos, giro e projeção em perspectiva e o movimento de cada figura (parado com movimento reduzido). Sem dependência, testado. |
| `goo` · beta | lib | Filtro gooey (metaball) em SVG nativo: GooFilter, useGooId e gooMatrix(contrast). Aplique só na camada de formas sólidas e deixe ícone e texto por cima. Sem dependência. |
| `screen-motion` · beta | lib | Núcleo puro das transições de tela: quadros-chave de portas, persianas, pilha 3D, desfoque e varredura líquida para a Web Animations API, fade com movimento reduzido e screenInterpolator(efeito) para o cardStyleInterpolator do @react-navigation/stack no Expo (pilha 3D, desfoque e cortina; portas e persianas caem no desfoque). Sem dependência, testado. |
| `view-transition` · beta | lib | View Transitions nativas com o ritmo do tema: card que vira detalhe (elemento compartilhado), lista ↔ grade. Sem suporte ou com movimento reduzido, troca na hora. |
| `theme-mode` · beta | lib | Modo claro/escuro/sistema sem dependência: grava data-mode no <html>, lembra em wc-mode, script anti-flash, hook useThemeMode e troca animada por View Transitions (circle, wipe, fade). |
| `shadow` | lib | Sombras de expressão editáveis (ADR 0016): boxShadow() em 8 estilos, textShadow() em 5, elevationScale() para refazer a elevação do tema num estilo, tudo a partir dos tokens. |
| `shadow-card` | componente | Card com sombra de expressão editável: suave, camadas, flutuante, colorida, brilho, neumorfismo, brutalista e interna; interativo e com alto contraste. |
| `shadow-text` | componente | Sombra de texto editável: suave, relevo, neon, contorno e retrô 3D, sem afetar o contraste. |
| `sortable-list` · beta | componente | Opcional, usa Motion: lista reordenável por alça e teclado, anúncio em pt-BR, saída animada e mola do tema. |
| `kanban` · beta | componente | Opcional, usa Motion: quadro controlado com arraste entre colunas, teclado (Espaço/setas/Esc), limite WIP e onCardMove para salvar. |
| `tab-bar` | componente | Tab bar flutuante do iOS 26 em vidro: lente que desliza com mola, rótulos que recolhem ao rolar, badge, botão de ação separado e estilos neon, bounce, wave e spotlight. |
| `glass-group` · beta | componente | Botões de vidro que se fundem numa cápsula e se separam com a mola do tema (GlassContainer do iOS 26 na web): controles sobre foto, mapa ou vídeo, vertical para mapa e ação principal tingida. |
| `bottom-toolbar` · beta | componente | Barra de ferramentas inferior do iOS (Mail, Notas): grupos em cápsulas de vidro ou faixa inteira, status no meio, um Tab e setas. |
| `navigation-bar` | componente | Barra de navegação do iOS: título grande que recolhe para a barra ao rolar e vidro só quando há conteúdo por baixo. |
| `progressive-blur` | componente | Desfoque progressivo na borda de áreas que rolam (scroll edge do iOS 26), derivado do blur do tema. |
| `swipe-actions` | componente | Ações ao deslizar a linha (Mail do iOS): full swipe, mola com velocidade, uma linha aberta por vez, ações por teclado. |
| `pull-to-refresh` | componente | Puxar para atualizar do iOS: elástico, spinner de raios (ou arco), resposta tátil no limite, anúncio e controle sem gesto. |
| `list-group` | componente | Lista agrupada do iOS (Ajustes): inset ou plain, ícone em quadrado, valor, seta/marca/Switch e divisória alinhada ao texto. |
| `virtual-list` · beta | componente | Lista virtual sem dependência para milhares de linhas: só o visível no DOM, altura medida pela densidade, rolagem infinita com onEndReached e posição real anunciada (aria-setsize/posinset). |
| `wheel-picker` | componente | Seletor em roda do iOS com scroll-snap nativo, curva em cilindro, tique tátil e teclado; várias rodas com uma faixa. |
| `live-island` | componente | Ilha dinâmica (Dynamic Island) para atividade ao vivo: pílula que muda de forma com mola, compacta/expandida e island.show(). |
| `stack-view` | componente | Pilha de navegação do iOS: push/pop com paralaxe e sombra, gesto de voltar pela borda com velocidade, foco gerenciado. |
| `bot-avatar` · beta | componente | Avatar de bot/mascote vivo em canvas 2D, sem dependência: 16 formas felpudas, 7 estados (ocioso, olhando, pensando, falando, trabalhando, dormindo, feliz), pelúcia/plástico/liso/chapado, chapéu, óculos, fone e gravata, cor por token, olhos que seguem o ponteiro, cochilo quando ocioso e quadro parado com movimento reduzido. |
| `gooey` · beta | componente | Peças líquidas com o filtro gooey: GooeyMenu (o + solta ações em arco, coluna ou linha com efeitos morph, move, bend e melt) e GooeyPill (círculo que solta a pílula com rótulo). Ícones nítidos por cima, Esc fecha, inert fechado, sem dependência. |
| `screen-transition` · beta | componente | Troca de tela inteira com efeito: portas, persianas, pilha 3D, desfoque ou varredura líquida, com direção de voltar, tela que sai inerte, foco no título da nova e fade com movimento reduzido. Sem dependência. |
| `thinking-orb` · beta | componente | Indicador de IA trabalhando: figuras de pontos em 3D (esfera, grade, anel, enxame, constelação, círculo, triângulo) em canvas 2D, na cor do texto, e ThinkingIndicator com rótulo de brilho em pílula. Sem dependência; parado com movimento reduzido. |
| `hairline` · beta | componente | Figuras isométricas de linha (33, de @lucasmarkes/hairline, MIT) que respondem ao ponteiro, com as cores ligadas aos tokens do tema. Para ilustrar recurso, estado vazio ou seção de landing; parada com movimento reduzido. |
| `search-bar` | componente | Barra de busca do iOS: pílula preenchida, limpar, Cancelar que entra ao focar, Enter/Esc fecham o teclado e data-active para a tela reagir. |
| `quantity-stepper` | componente | Stepper de quantidade (UIStepper/iFood): segurar repete, número rola, variante expand (só + no zero) e lixeira no mínimo. |
| `page-control` | componente | Indicador de páginas do iOS: atual em pílula, arrastar para pular com tique tátil, pontas encolhem acima de 7 e role=slider. |
| `product-card` · beta | componente | Card de produto de vitrine mobile em duas versões (padrão e imersiva): carrossel de fotos com Page Control, preço em pílula, tags, favoritar e CTA. |
| `section-index` | componente | Índice A–Z da lista (Contatos): arrastar pelas letras com tique e balão, recolhe em A • D • G quando falta altura. |
| `use-keyboard` | hook | Teclado virtual aberto e a altura dele (VisualViewport), para subir barras e sheets acima do teclado no iOS e Android. |
| `use-scroll-edge` · beta | hook | Borda e direção da rolagem (scroll edge effect do iOS 26) com limiar: barra que some ao descer e volta ao subir, título grande que compacta, desfoque só com conteúdo por baixo. |
| `use-media-capabilities` · beta | hook | Toque × mouse, app instalado e preferências (movimento, transparência, contraste, escuro) por media query, ao vivo e sem user agent. |
| `bottom-bar` | componente | Barra de ação grudada no rodapé (Comprar, Salvar) com safe area, que sobe com o teclado ou some; sólida ou vidro. |
| `keyboard-toolbar` | componente | Barra acima do teclado (inputAccessoryView): campo anterior/próximo, OK e atalhos que inserem texto sem fechar o teclado. |
| `hud` | componente | Aviso central do iOS (Copiado, Salvo) com ícone grande ou pílula no topo: hud.show/success/error + HudHost, some sozinho. |
| `symbol-effect` · beta | componente | Efeitos de símbolo do iOS em qualquer ícone: bounce, wiggle, rotate e replace quando o valor muda; pulse, breathe, scale e rotate contínuos. Só CSS. |
| `jiggle-mode` · beta | componente | Modo de edição da tela de início do iOS: segurar entra, os itens tremem e ganham o − para remover; Esc, toque fora ou OK saem. |
| `shake-to-undo` · beta | componente | Agitar para desfazer do iOS: chacoalhar abre o alerta Desfazer/Cancelar; ⌘/Ctrl+Z e open controlado como alternativa. |
| `action-sheet` | componente | Action sheet do iOS: ações em vidro com destrutiva em vermelho e Cancelar separado, sobe com mola, setas e Esc. |
| `context-preview` | componente | Menu de contexto com prévia do iOS: segurar abre a prévia grande sobre fundo desfocado com menu; clique direito, Shift+F10 e botão ⋯. |
| `notification-banner` | componente | Notificação in-app que desce do topo: notify() + host, some sozinha, pausa com toque/foco, arrastar para cima dispensa. |
| `undo-snackbar` · beta | componente | Faixa escura de uma linha com Desfazer, anel de contagem e atalho ⌘Z/Ctrl+Z; a ação só vale quando o tempo acaba (onCommit). snackbar.undo + SnackbarHost. |
| `progress-toast` · beta | componente | Painel de tarefas longas no canto (envio, importação): barra, % e tempo restante por tarefa, cancelar, desfecho com ação e resumo que recolhe. progressToast.start + ProgressToastHost. |
| `capsule-toast` · beta | componente | Toast em cápsula que se desdobra em cartão ligado por cantos côncavos e recolhe antes de sair; um por vez, troca no lugar, promise de carregando a sucesso. capsule.show + CapsuleToastHost. |
| `share-sheet` | componente | Compartilhar: folha nativa (Web Share) no celular e folha própria com WhatsApp, Telegram, E-mail, SMS e Copiar link onde ela não existe. |
| `whats-new` | componente | Tela Novidades estilo Apple: título grande, itens com ícone em cascata e Continuar; useWhatsNew mostra uma vez por versão. |
| `install-prompt` · beta | componente | Instalar o PWA no celular e no computador: convite e botão com beforeinstallprompt (Chrome/Edge, Android e desktop) e passo a passo no Safari do iPhone e do Mac; some instalado e lembra o adiar. |
| `stretchy-header` | componente | Cabeçalho com imagem que estica ao puxar (elástico do iOS), parallax ao rolar e barra compacta em vidro com o título quando a imagem sai. |
| `story-viewer` | componente | Stories: barras de progresso, toque para avançar/voltar, segurar pausa, arrastar para baixo fecha; Pausar sempre visível e teclado. |
| `amount-pad` | componente | Campo de valor grande com teclado numérico próprio (Pix, transferência): dígitos entram pelos centavos, limite com tremida, atalhos e teclado físico. |
| `step-form` · beta | componente | Formulário em etapas com revisão antes de enviar: valida só a etapa atual (validação nativa + validate), foco no título a cada etapa, Alterar na revisão e envio assíncrono com erro; recebe FormData. |
| `save-bar` · beta | componente | Barra de alterações não salvas (Shopify, Stripe): Descartar e Salvar, Ctrl/⌘+S, confirmação ao fechar a aba e erro que treme; flutuante ou grudada, sólida ou vidro. |
| `editable-text` · beta | componente | Texto que vira campo ao clicar (título do Linear/Notion): Enter salva, Esc cancela, validação e salvar assíncrono com erro, uma ou várias linhas, sem pulo de layout. |
| `photo-grid` · beta | componente | Grade de fotos quadradas (Fotos do iOS) com modo de seleção: tocar marca, arrastar na horizontal marca uma faixa, vertical rola; setas e Espaço no teclado. |
| `curation` · beta | lib | hexToOklab e colorDistance (ΔE em OKLab), matchesColors (busca por paleta: cada cor escolhida perto de uma cor da peça), formatCount (2,8 mil · 1,2 mi), weightedScore (nota ponderada estilo Awwwards) e scatter (colagem flutuante determinística). Função pura, testada. |
| `color-filter` · beta | componente | Busca por cor: amostras redondas com aria-pressed e nome, até N cores, fita com a paleta escolhida e Limpar; faixa que rola ou grade. |
| `inspiration-grid` · beta | componente | Mural de inspiração em alvenaria (CSS columns) com proporção reservada, título e Salvar ao passar/focar, paleta da peça e estado vazio. |
| `project-card` · beta | componente | Cartão de trabalho em galeria de portfólio: shot (capa com ações no hover), case (estudo de caso com selo de curadoria) e logo (ladrilho com nota em estrelas). |
| `pill-filter` · beta | componente | Pílulas de categoria com escolha única, contagem e "+N mais" num Popover; a escolhida do resto entra na fileira. Slot `end` para cor e ordenação. |
| `facet-bar` · beta | componente | Filtros por faceta de acervo: tipo segmentado, Embaralhar, menu com caixas por faceta, fichas removíveis e total anunciado. |
| `taxonomy-browser` · beta | componente | Acervo por taxonomia visual: ladrilhos de categoria com símbolo que abrem as subcategorias com contagem, e índice A–Z com glifo por letra. |
| `award-hero` · beta | componente | Topo de premiação (Site do dia): selo, data, nota, título gigante, créditos e capa larga; AwardScore com nota por critério, peso e final ponderada. |
| `floating-gallery-hero` · beta | componente | Hero com colagem flutuante: miniaturas giradas em volta do título que flutuam e se afastam do ponteiro; centro livre para título, busca e chamada. |
| `gallery-header` · beta | componente | Cabeçalho de galeria: hero da categoria (subcategorias, título, Seguir) ou barra (ordenar, categorias que rolam, Filtros com painel). |
| `camera-capture` · beta | componente | Câmera na página com permissão só no toque, foto com prévia (Usar/Tirar outra), trocar câmera, leitura de QR/código de barras com BarcodeDetector e queda para o app de câmera do sistema. |
| `lens-reveal` · beta | componente | Tela de entrada com cúpula de vidro que, ao puxar, vira uma lente que segue o dedo e revela ampliada a tela seguinte, com borda em arco-íris (iridescent/brand/clear); soltar entra e solta bolhas (burst). Toque, Enter e ↑ também entram; movimento reduzido troca por esmaecimento. |
| `pin-pad` · beta | componente | Senha do app com teclado numérico próprio (bloqueio do iPhone, bancos BR): pontos ou caixas, senha errada treme e limpa, teclado embaralhado, biometria e Esqueci. |
| `signature-pad` · beta | componente | Assinatura na tela com dedo, caneta (pressão) ou mouse: traço suave na cor do tema, desfazer/limpar, exporta PNG ou SVG e alternativa Digitar para quem não desenha. |
| `delivery-receipt` · beta | componente | Assinatura de recebimento (canhoto digital): conferir com ressalva, quem recebeu (nome, vínculo, CPF/RG), assinatura, foto e local; 3 apresentações (card, fullscreen, sheet) e DeliveryProof com CPF mascarado, código de conferência, compartilhar e imprimir/PDF. |
| `color-picker` · beta | componente | Seletor de cor sem dependência: área de saturação/brilho, matiz, opacidade, hex que aceita rgb()/hsl(), conta-gotas, amostras e contraste WCAG; ColorSwatches e ColorField (Popover). |
| `select-list` | componente | Seleção do iOS em lista agrupada: a linha mostra o valor e abre as opções como tela na pilha (com busca), inline ou em menu pop-up; check na escolhida. |
| `date-time-field` | componente | Data e hora compactas do iOS: pílulas que abrem, na própria lista, o calendário ou as rodas de hora e minuto; min/max e passo de minutos. |
| `rating` | componente | Avaliação por estrelas ou corações: rádios nativos, prévia com rótulo, mola ao escolher e modo leitura com fração. |
| `tags-input` | componente | Campo de etiquetas: Enter/vírgula/colar, Backspace em dois toques, duplicadas piscam, validação pt-BR e anúncio. |
| `timeline` | componente | Linha do tempo (rastreio, atividade, onboarding) com status em ícone e texto, variante cartão e horizontal. |
| `chat` | componente | Conversa que gruda no fim, mensagens em bolha ou texto, status do WhatsApp, digitando, prompt com Parar e sugestões. |
| `text-effect` | componente | Entrada de texto por palavra/letra (blur, fade-up, scale, typewriter), WordRotate com pausa e TextShimmer, sem Motion. |
| `dock` | componente | Dock do macOS: ampliação perto do ponteiro sem Motion, toolbar com setas, balão e material de vidro. |
| `fab` | componente | Botão flutuante estendido que recolhe ao rolar e speed dial em menu com cascata, véu e foco gerenciado. |
| `item` | componente | Linha de lista (mídia, título, descrição, ações) com variantes outline/muted, ItemGroup e link via asChild. |
| `aspect-ratio` | componente | Caixa com proporção fixa via CSS aspect-ratio, fundo enquanto carrega e mídia em object-cover. |
| `resizable` | componente | Painéis redimensionáveis sem dependência: alça com teclado (Window Splitter), grupos aninhados, autoSaveId e onLayout. |
| `code-block` | componente | Bloco de código sem shiki: copiar, numeração, linhas destacadas, diff, recolher longo e abas npm/pnpm/yarn/bun que lembram a escolha. |
| `description-list` | componente | Lista chave → valor para telas de detalhe: horizontal, vertical ou grade, com borda, span e botão copiar. |
| `tree-view` · beta | componente | Árvore com teclado WAI-ARIA, foco itinerante, seleção única ou por checkbox com pai indeterminado e linhas-guia. |
| `transfer-list` · beta | componente | Duas listas com checkbox, marcar todos, busca sem acento, duplo clique e anúncio do que foi movido. |
| `popconfirm` · beta | componente | Confirmação leve presa ao botão, com onConfirm assíncrono, erro inline e foco em Cancelar no destrutivo. |
| `relative-time` · beta | componente | "há 5 minutos" com Intl em pt-BR, <time> com data completa, atualização no ritmo certo e data absoluta depois de N dias. |
| `countdown` · beta | componente | Contagem regressiva inline ou em cartões, role=timer com rótulo por minuto, alerta perto do fim e onComplete. |
| `result` · beta | componente | Tela de desfecho (sucesso, erro, aviso, info, 403, 404, 500) com ícone tingido, check desenhado e ações. |
| `password-strength` · beta | componente | Medidor de força da senha com rótulo, checklist de regras e penalidade para senhas comuns; use com o InputPassword. |
| `spoiler` · beta | componente | "Mostrar mais": recolhe texto longo com degradê, mede o conteúdo e só mostra o botão quando precisa. |
| `highlight` · beta | componente | Marca termos buscados com <mark>, ignorando acento e caixa, com vários termos. |
| `table-of-contents` · beta | componente | Sumário com scrollspy (IntersectionObserver), indicador deslizante, recuo por nível e rolagem suave. |
| `toolbar` · beta | componente | Barra de ferramentas com um único Tab e setas (sem primitivo), grupos de alternância, separador e variante flutuante. |
| `color` · beta | lib | parseColor (hex, rgb(), hsl()), rgbToHex, rgbToHsv/hsvToRgb e contrastRatio/contrastLevel do WCAG, sem dependência. |
| `virtual` · beta | lib | virtualWindow(scrollTop, altura, linha, total, overscan) e scrollToIndex: cálculo puro da lista virtual, sem dependência. |
| `qr` | lib | encodeQr(texto, nível): matriz do QR Code (modo byte, versões 1–40, L/M/Q/H, máscara automática), sem dependência. |
| `pix` | lib | pixPayload({ key, name, city, amount, txid }): BR Code estático com CRC16 para QR Code e botão copiar. |
| `csv` · beta | lib | toCSV(rows, columns) e downloadCSV: separador ;, BOM UTF-8, vírgula decimal, datas dd/mm/aaaa e proteção contra fórmula; abre certo no Excel em pt-BR. |
| `range-select` · beta | lib | rangeSelect(base, ids, from, to, on): marca ou desmarca a faixa do gesto e devolve ao estado anterior o que sai dela. |
| `eta` · beta | lib | estimateRemaining(amostras, total), createEta(total) com suavização e formatRemaining(s) em pt-BR ("Cerca de 20 s restantes"). Função pura, testada. |
| `shake` · beta | lib | createShakeDetector(opções) conta picos alternados do acelerômetro numa janela, com espera; needsMotionPermission/requestMotionPermission para o Safari do iOS. Função pura, testada. |
| `texture` · beta | lib | texture(tipo, { tone, strength, base }) devolve backgroundImage/backgroundSize só com gradientes CSS, cor do filete do tema (--wc-rule) via color-mix e teto de 14% de opacidade para o texto manter o contraste. Sem imagem. Função pura, testada (ADR 0025). |
| `notice-time` · beta | lib | readingTime(texto) entre 5 s e 15 s pelo tamanho do texto (WCAG 2.2.1) e createPausableTimer(ms, onEnd) que pausa e retoma de onde parou. Função pura, testada. |
| `billing` · beta | lib | cyclePrice (anual por mês, economia em R$ e %), maxSavingsPct, discounted (Pix), formatPlanPrice, addMonths/nextCharge (fim do mês como os gateways), prorate (troca de plano por dia) e formatDateShort. Centavos e datas ISO; função pura, testada. |
| `receipt` · beta | lib | maskDocument (CPF ***.456.789-**, CNPJ inteiro, RG só o fim), receiptCode (código curto de conferência), formatReceiptDateTime (no fuso), formatCoords, itemsSummary e receiptText para compartilhar. Função pura, testada. |
| `qr-code` · beta | componente | QR Code em SVG sem dependência, fundo claro fixo, logo com correção H e estados carregando/expirado; combine com pixPayload. |
| `watermark` · beta | componente | Marca d'água repetida (máscara SVG) com cor do token, várias linhas, rotação e espaçamento. |
| `mentions` · beta | componente | Textarea com sugestões por @ e #: combobox acessível, lista na altura do cursor, busca sem acento e ids citados. |
| `image-crop` · beta | componente | Recorte de imagem com arrastar, zoom (roda, pinça, controle), teclado, máscara círculo/retângulo e cropImage() em canvas. |
| `video-player` · beta | componente | Player de vídeo com controles próprios: capítulos, legendas, velocidade, PiP, tela cheia e teclado do YouTube, sem dependência. |
| `tela-agendamento` · beta | registry:block | Tela mobile de agendamento: saudação, filtro, próxima consulta em destaque com equipe, agenda do dia e tab bar. |
| `tela-carteira` · beta | registry:block | Tela mobile de carteira: saldo com ocultar, alocação segmentada, ativos com sparkline, candles com período e Comprar/Vender fixos. |
| `tela-habitos` · beta | registry:block | Tela mobile de hábitos: faixa da semana, lembrete com switch, rotina em checklist com contador e colunas da semana. |
| `tela-viagem` · beta | registry:block | Tela mobile de viagem: destinos em pilha de cards, próxima viagem como bilhete e tab bar. |
| `tela-boas-vindas` · beta | registry:block | Tela mobile de entrada: frase de abertura, cúpula que vira lente e revela o login, bolhas ao entrar e botões Google/Apple na zona do polegar. |
| `tela-planos` · beta | registry:block | Tela mobile para assinar: planos em carrossel de vidro com o recomendado no centro, mensal/anual com economia, comparação recolhida e pagamento com Pix (desconto), cartão em 12x ou boleto e CPF/CNPJ. |
| `tela-assinatura` · beta | registry:block | Tela mobile de gestão: plano atual com status e uso, faturas, mudar plano em folha com prévia do proporcional e cancelar em 2 cliques com oferta de retenção. |
| `tela-entregas` · beta | registry:block | Rota do entregador: paradas do dia com progresso, Entregar abre o canhoto digital em folha (conferir, quem recebeu, assinatura, foto) e as entregues mostram quem recebeu, a hora e o comprovante. |
| `tela-agentes` · beta | registry:block | Agentes de IA no celular: lista de bots com mascote vivo e status, chat em que o bot pensa, responde falando e comemora, campo com feixe aurora e Parar, e bottom nav líquida (tab bar gooey). |
