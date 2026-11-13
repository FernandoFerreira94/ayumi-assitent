# Mobile

Celular não é desktop pequeno. A pessoa usa com uma mão, em pé, com sol na tela, sinal ruim e pressa. Este guia vale para web mobile e PWA (o padrão da WebCode) e indica a equivalência em React Native/Expo quando ela muda a decisão.

Trilha mobile no catálogo: filtre a galeria por **App mobile** ou leia os padrões citados aqui. Blueprints: `mobile-app`, `field-service`, `delivery-courier`, `ecommerce-app`, `habits`, `fintech`, `delivery`.

## Plataforma: decida antes de desenhar
| Situação | Escolha | Por quê |
| --- | --- | --- |
| Uso eventual, chega por link (WhatsApp, Google) | Site responsivo | Zero instalação; SEO |
| Uso frequente, interno ou B2B, orçamento curto | PWA instalável | Um código, atualização instantânea, offline com Service Worker |
| Precisa de push confiável no iOS, Bluetooth, NFC, background longo, câmera avançada ou loja | React Native/Expo | API nativa e distribuição pelas lojas |

- [ ] A decisão está registrada no `DESIGN.md` do projeto, com o motivo.
- [ ] PWA: `manifest` com `display: standalone`, ícones 192/512 + maskable, `theme-color` claro/escuro e `start_url` própria.
- [ ] Push no iOS só funciona em PWA adicionado à tela inicial (iOS 16.4+). Se notificação é crítica para o produto, isso pesa a favor de Expo.

## Tela e safe areas
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">`. Nunca `user-scalable=no` nem `maximum-scale=1` (WCAG 1.4.4).
- [ ] Barras fixas usam `env(safe-area-inset-top|bottom|left|right)`: nada atrás do notch, da Dynamic Island ou do indicador de início.
- [ ] Altura de tela cheia com `100dvh` (com `100vh` como fallback antes). `svh` para o que não pode pular quando a barra do navegador recolhe.
- [ ] `overscroll-behavior: contain` em áreas roláveis internas (sheets, listas em painel) para não arrastar a página de trás.
- [ ] Funciona em retrato e paisagem (WCAG 1.3.4) e em 320px de largura sem rolagem horizontal (WCAG 1.4.10).
- [ ] Dobrável e tablet: a partir de ~600px, a tab bar pode virar navigation rail lateral e listas viram lista + detalhe lado a lado.

## Alvos de toque e zona do polegar
- [ ] Alvo mínimo de 44×44px (Apple) e preferencialmente 48×48px (Material); `--wc-size-touch-min` = 44. O piso legal da WCAG 2.5.8 é 24×24px, mas não projete no piso.
- [ ] Espaço de pelo menos 8px entre alvos vizinhos; ícone pequeno ganha área com padding, não com tamanho de ícone.
- [ ] Ação principal no terço inferior da tela (FAB, botão grudado no rodapé, tab bar). Topo é para status, título e ações raras.
- [ ] Ações destrutivas longe da principal e nunca no mesmo lugar onde, na tela anterior, estava "Continuar".
- [ ] Listas tocáveis com 52–64px de altura de linha; a linha inteira é o alvo, não só o texto.

## Navegação
- [ ] Destinos de topo em tab bar (3–5, ícone + rótulo), padrão `ios-tab-bar`. Hambúrguer só para o que é secundário.
- [ ] Hierarquia dentro da aba em pilha: push da direita, voltar pela borda e botão com o título anterior (`ios-stack-navigation`). Cada aba guarda a sua pilha.
- [ ] Tarefa independente (criar, editar, avaliar) abre em modal em cartão ou sheet (`card-modal-sheet`, `bottom-sheet`), com Cancelar e ação explícita.
- [ ] Escolha rápida sobre um objeto em action sheet (`action-sheet`); decisão crítica em alert no centro (`confirm-alert-dialog`).
- [ ] Botão voltar do Android e do navegador fecham o sheet aberto e voltam a pilha (estado na URL/`history`).
- [ ] Busca é uma tela com foco, recentes e cancelar (`mobile-search-screen`), visível sem toque extra quando é o jeito principal de achar coisas.
- [ ] Nunca modal sobre modal. Precisa de mais um nível? Pilha dentro do sheet.

## Gestos
- [ ] Todo gesto tem alternativa visível de um toque (WCAG 2.5.1 e 2.5.7): swipe → botão ou menu ⋯; toque longo → ⋯ e clique direito; puxar para atualizar → botão.
- [ ] Gesto segue o dedo 1:1, pode ser interrompido e decide na soltura por distância **ou** velocidade (`swipe-row-actions`, `card-modal-sheet`).
- [ ] Não brigue com gestos do sistema: nada importante a menos de 20px das bordas laterais (voltar) e da borda inferior (início).
- [ ] `touch-action: pan-y` em itens com arraste horizontal; `-webkit-touch-callout: none` só onde o toque longo é seu.
- [ ] Toque longo entre 400–500ms, cancelado se o dedo andar mais de 10px (`long-press-context-menu`).
- [ ] Carrossel e onboarding com `scroll-snap` nativo antes de qualquer JS de gesto (`onboarding-pages`).
- [ ] Ao soltar, continue na velocidade do dedo e assente com **mola física** (`animateSpring` do `@webcode/gesture`), não com curva CSS que começa do zero. Decida pelo ponto projetado (`project`, desaceleração do iOS), não só pela posição.
- [ ] Passou do limite: elástico do iOS (`rubberband`, c = 0.55), nunca trava seca.

## Transições e movimento
- [ ] Movimento explica a navegação: push horizontal, modal sobe, sheet sai pelo lado de onde veio. Direção coerente ida e volta.
- [ ] Toque responde em até 100ms com estado pressionado (`scale(.97)`, `press-spring-button`); a ação pode demorar, o feedback não.
- [ ] Transições de tela entre 300–500ms com mola (`--wc-motion-spring-smooth`); saídas mais curtas que entradas.
- [ ] Tudo que a pessoa manipula usa mola e transição CSS interrompível, não keyframes.
- [ ] Anime só `transform`/`translate`/`scale` e `opacity`. Nada de `top`, `height` ou `box-shadow` animado em lista longa.
- [ ] `prefers-reduced-motion`: deslocamento vira fade curto (`--wc-motion-distance: 0`). `prefers-reduced-transparency`: vidro vira sólido (o build já gera).
- [ ] Haptics: leve em confirmação, troca de estado e limiar de gesto; nunca contínuo durante rolagem (o tique por item do `wheel-picker` é a exceção do próprio iOS). Use `haptic()` do `@webcode/gesture`: `navigator.vibrate` no Android, `<input type="checkbox" switch>` no Safari iOS 18+, nada nos demais. No Expo, `expo-haptics`. Haptic é reforço, nunca o único sinal.

## Formulários e teclado
- [ ] Teclado certo por campo (`inputmode`, `type`, `autocomplete`, `enterkeyhint`): tabela em `mobile-keyboard-form`.
- [ ] Fonte dos campos ≥ 16px (abaixo disso o iOS dá zoom ao focar).
- [ ] Botão de enviar visível com o teclado aberto: barra grudada acima dele (VisualViewport) ou ao fim do formulário curto.
- [ ] Um campo por linha; CEP + número podem dividir a linha.
- [ ] Erro depois do blur ou do envio, nunca no primeiro caractere; foco vai para o primeiro campo com erro.
- [ ] Código por SMS com `autocomplete="one-time-code"` (o teclado sugere o código); Pix copia e cola em um toque.
- [ ] Checkout curto em etapas com total sempre visível (`mobile-checkout-steps`).

## Feedback e estados
- [ ] Cada tela tem os cinco estados desenhados: carregando, vazio, erro, parcial (offline/desatualizado) e ok.
- [ ] Primeiro carregamento com skeleton no formato do conteúdo (`skeleton-shimmer`); spinner só em ação pontual.
- [ ] Ação reversível executa na hora e oferece Desfazer (`undo-delete`); só pergunte antes quando não há volta.
- [ ] Toasts no rodapé, acima da tab bar, sem cobrir a ação principal; nunca para erro que exige ação.
- [ ] Sem conexão: faixa discreta (`connection-status`), conteúdo já visto continua lá e ações entram em fila (`offline-action-queue`).
- [ ] Permissões pedidas no momento do uso, com explicação antes do diálogo do sistema e caminho claro se negar (`permission-priming`).

## Performance percebida
- [ ] Meta: INP < 200ms e LCP < 2,5s em um Android intermediário com 4G (não no seu iPhone com Wi-Fi).
- [ ] Rolagem a 60fps (120 em ProMotion): listas longas com virtualização ou `content-visibility: auto`.
- [ ] Imagens com `width/height`, `loading="lazy"` abaixo da dobra, AVIF/WebP e `sizes` corretos.
- [ ] Atualização otimista em ações frequentes (curtir, marcar, concluir); a rede confirma depois.
- [ ] Prefetch da próxima tela provável (detalhe ao tocar, próxima etapa do checkout).
- [ ] Listeners de `touch`/`scroll` passivos; trabalho pesado fora da thread principal.

## Acessibilidade mobile
- [ ] Texto em `rem`; layout aguenta 200% de zoom/fonte grande do sistema sem cortar nem sobrepor (Dynamic Type no nativo).
- [ ] Testado com VoiceOver (iOS) e TalkBack (Android): ordem de leitura, rótulos de ícones, foco depois de abrir/fechar sheet.
- [ ] Nada depende só de cor, só de gesto ou só de haptic.
- [ ] Contraste AA também no vidro (o build mede); em sol forte, prefira o tema claro e textos `fg`, não `fg-subtle`.

## QA em dispositivo
- [ ] Safari iOS e Chrome Android reais (o DevTools não mostra teclado, notch nem gesto de borda).
- [ ] Modo avião no meio de uma ação; rede 3G lenta; app em segundo plano e de volta.
- [ ] Fonte do sistema no máximo, modo escuro, redução de movimento, mão esquerda.
- [ ] `npm run verify` cobre overflow em 390px; os testes de interação cobrem foco e teclado.

## Componentes iOS do registry (grupo Mobile)
Use estes antes de montar à mão; todos sem dependência, com mola do tema, movimento reduzido e alternativa sem gesto.
- `list-group`: lista agrupada (Ajustes). `inset` para telas de ajustes/perfil, `plain` para listas longas.
- `swipe-actions`: ações ao deslizar (Mail). No máximo 3 por lado; a da ponta é a do full swipe; destrutiva em `danger`.
- `pull-to-refresh`: só em listas que mudam com o tempo (feed, pedidos, extrato). Sempre com botão Atualizar em algum lugar.
- `wheel-picker`: hora, data, parcelas, quantidade curta (≤ 50 itens). Mais que isso, use busca/Combobox.
- `live-island`: uma atividade ao vivo por vez (entrega, timer, gravação) e avisos curtos (`island.show`). Não substitui toast de erro.
- `stack-view`: navegação em pilha dentro do PWA com gesto de voltar pela borda; a barra de título vem do `navigation-bar` (grupo Vidro).
- `fab`: uma ação principal por tela (Novo pedido). `extended` + `useScrollCollapse` em listas longas; `FabMenu` com no máximo 4–5 ações. No iOS puro prefira o botão na navigation bar; FAB cabe em PWA/Android e apps operacionais.
- `search-bar`: busca do iOS (Cancelar ao focar, Esc/Enter fecham o teclado). Use `onActiveChange` para recolher o título grande e mostrar escopos/recentes.
- `quantity-stepper`: quantidade com − e +; `expand` em vitrine/carrinho (só + no zero), `removable` para tirar do carrinho no mínimo. Para valores longos (preço, peso livre) use campo numérico.
- `page-control`: indicador de páginas de onboarding, carrossel e galeria; sempre ligado a uma rolagem com snap e com outro jeito de avançar (botão Continuar).
- `section-index`: índice A–Z só em listas longas ordenadas (contatos, clientes, produtos por nome). Lista curta não precisa.
- `bottom-bar`: a ação principal da tela grudada no rodapé (comprar, salvar, enviar). Sobe com o teclado por padrão; use `keyboard="hide"` em barra de navegação. Base: hook `useKeyboard`.
- `keyboard-toolbar`: formulários com 3+ campos no celular ou campos com atalhos (domínio de e-mail, valores). Só aparece com teclado virtual.
- `hud`: confirmação rápida sem ação (copiado, salvo). Erro que exige ação vai em alerta/toast com botão.
- `action-sheet`: 2–5 ações sobre algo que a pessoa acabou de tocar, ou confirmar uma ação destrutiva iniciada por ela. Mais que isso, sheet com lista.
- `context-preview`: ações secundárias de itens visuais (foto, cartão, link) com prévia. Sempre com botão ⋯ visível ou outro caminho; nunca a única forma de chegar a uma ação.
- `notification-banner`: evento de outro contexto com o app aberto (pedido, mensagem, Pix). Um por vez; tocar leva ao detalhe.
- `share-sheet`: todo conteúdo que a pessoa possa querer mandar (produto, pedido, comprovante, convite). Usa a folha do sistema quando existe.
- `whats-new`: só em atualização com mudança que a pessoa vai notar; no máximo 4 itens, uma vez por versão.
- `install-prompt`: PWA de uso frequente, depois de um momento de valor; nunca na primeira tela.
- `stretchy-header`: tela de detalhe com foto (perfil, restaurante, produto); a barra compacta em vidro mostra o título quando a imagem sai.
- `story-viewer`: novidades e onboarding em cartões curtos; sempre com Pausar visível e conteúdo que faça sentido sem o tempo.
- `amount-pad`: tela de valor (Pix, transferência, recarga) com `max` = saldo/limite; no lugar do teclado do sistema, não junto.
- `select-list`: escolha única dentro de lista agrupada. `push` (padrão, na `stack-view`) para listas longas, com `searchable` acima de ~12; `inline` para 2 a 4 opções; `menu` para opções curtas sem descrição.
- `date-time-field`: data/hora em formulário de celular, na linha da lista; prefira ao `input type=date` quando a escolha precisa ficar visível (reserva, agenda).

Backlog completo da trilha (o que existe, o que falta, prioridade e onde cada peça mora): `docs/plano-mobile.md` no repositório do design system.

## Vidro no app (Expo)
- [ ] Vidro **só em barras e botões** (tab bar, barra de navegação, toolbar, botão flutuante, controles sobre mídia). Conteúdo fica sólido. Receita `vidro-barras-botoes`.
- [ ] Instale `npx shadcn@latest add @webcode/native-glass` (traz `expo-glass-effect` e `expo-blur`) e passe o JSON do tema: `<GlassThemeProvider theme={require("./aurora.json")}>`. Use `GlassBar`, `GlassButton` (`tone="accent"` na ação principal, uma por tela) e `GlassGroup` (funde os botões próximos no iOS 26).
- [ ] iOS 26: Liquid Glass do sistema com tinta leve do tema para o texto não perder contraste; `glassStyle="clear"` só para ícone sobre foto ou vídeo. iOS antigo: blur do sistema + token. Android e web: cor do token, sem blur. "Reduzir transparência": sólido.
- [ ] Confira em aparelho real (iOS 26 e Android) antes de lançar: simulador não mostra o custo do blur.

## Equivalências React Native/Expo
| Web (WebCode) | Expo/React Native |
| --- | --- |
| `ios-tab-bar` | `expo-router` Tabs (ou `NativeTabs`) |
| `ios-stack-navigation` | `@react-navigation/native-stack` (gesto de voltar nativo) |
| `card-modal-sheet` | `presentation: "modal"` / `"formSheet"` no Stack.Screen |
| `bottom-sheet`, `action-sheet` | `@gorhom/bottom-sheet`, `ActionSheetIOS` |
| `long-press-context-menu` | `zeego` / `react-native-ios-context-menu` |
| `mobile-keyboard-form` | `keyboardType`, `returnKeyType`, `react-native-keyboard-controller` |
| `pull-to-refresh` | `RefreshControl` |
| `swipe-actions` | `ReanimatedSwipeable` (react-native-gesture-handler) |
| `list-group` | `SectionList` + `Pressable` (SwiftUI: `.listStyle(.insetGrouped)`) |
| `wheel-picker` | `@react-native-picker/picker` / `datetimepicker display="spinner"` |
| `live-island` | Live Activities (ActivityKit) via `expo-live-activity` |
| `stack-view` | `@react-navigation/native-stack` |
| `search-bar` | `headerSearchBarOptions` (native-stack) |
| `quantity-stepper` | `Pressable` + `onLongPress` com intervalo |
| `page-control` | `react-native-pager-view` + indicador próprio |
| `section-index` | índice próprio sobre `SectionList` (`scrollToLocation`) |
| `useKeyboard`, `bottom-bar`, `keyboard-toolbar` | `react-native-keyboard-controller` (`KeyboardStickyView`, `KeyboardToolbar`) |
| `hud` | `burnt` (SPAlert/AlertKit) |
| `action-sheet` | `ActionSheetIOS` / `@expo/react-native-action-sheet` |
| `context-preview` | `zeego` (ContextMenu com Preview) |
| `notification-banner` | `react-native-notifier` (in-app) ou banner do `expo-notifications` |
| `share-sheet` | `Share.share()` / `expo-sharing` |
| `whats-new` | tela modal `presentation: "formSheet"` |
| `install-prompt` | não se aplica (app de loja) |
| `stretchy-header` | `Animated.ScrollView` + `interpolate` (Reanimated `useScrollViewOffset`) |
| `story-viewer` | `react-native-insta-story` ou PagerView + Reanimated |
| `amount-pad` | teclado próprio em `Pressable` + `Haptics.selectionAsync()` |
| `select-list` | tela na pilha com `Pressable` + check; `Picker` do @expo/ui para menu |
| `date-time-field` | DateTimePicker do @expo/ui (`variant="compact"`) |
| `animateSpring`, `rubberband` | Reanimated `withSpring({ velocity })`, `withDecay({ rubberBandEffect })` |
| `offline-action-queue` | TanStack Query offlineFirst + MMKV + NetInfo |
| `env(safe-area-inset-*)` | `react-native-safe-area-context` |
| Tokens `--wc-*` | `build/json/<tema>.json` |
| `haptic()` (`navigator.vibrate` / switch iOS) | `expo-haptics` |
| `@webcode/glass`, `glass-group`, `tab-bar`/`navigation-bar` em vidro | `@webcode/native-glass` (`expo-glass-effect`: GlassView/GlassContainer no iOS 26, `expo-blur` no iOS antigo, cor do token no Android) |

## Recomendações para o Estúdio de tema (modo mobile)
Proposta para quando o Estúdio ganhar o alternador Web | Mobile. Nada disso muda tokens semânticos existentes; são presets sobre os mesmos tokens.
- **Densidade mobile (implementado, ADR 0012):** tokens `mobile.*` do tema: controles 44/48/56px, linhas de 56px e margem lateral de 16px na confortável; o Estúdio troca para compacta/espaçosa e o texto do corpo (16–19px). Na web use `--wc-mobile-*`; no Expo, a chave `mobile` do JSON do tema.
- **Alvos de toque:** prévia com sobreposição opcional mostrando alvos < 44px em vermelho.
- **Raio:** sugestão de 12–16px para cartões e sheets, `pill` para chips e tab bar flutuante; botões seguem `--wc-radius-button`.
- **Tipografia:** tamanho base 16–17px no mobile (título grande 30–34px), checagem de fonte do sistema a 200%.
- **Safe area:** prévia em moldura de iPhone com notch e indicador de início (padrão `device-frames`), mostrando tab bar e barra de ação com `env()`.
- **Movimento:** escolher a mola padrão das transições de tela (smooth ou snappy) e ver ao vivo push/pop e sheet.
- **Vidro:** ligar/desligar vidro em barras com checagem de contraste sobre conteúdo claro e escuro.
- **Exportar (implementado):** aba Expo do Estúdio copia o JSON resolvido (`build/json`), com cores por modo e a chave `mobile`.

## Fontes
- Apple HIG, Layout, Navigation and search, Sheets, Action sheets, Context menus, Gestures, Onboarding, Privacy: https://developer.apple.com/design/human-interface-guidelines/layout · https://developer.apple.com/design/human-interface-guidelines/navigation-and-search · https://developer.apple.com/design/human-interface-guidelines/sheets · https://developer.apple.com/design/human-interface-guidelines/action-sheets · https://developer.apple.com/design/human-interface-guidelines/context-menus · https://developer.apple.com/design/human-interface-guidelines/gestures · https://developer.apple.com/design/human-interface-guidelines/onboarding · https://developer.apple.com/design/human-interface-guidelines/privacy
- Apple WWDC18, Designing Fluid Interfaces: https://developer.apple.com/videos/play/wwdc2018/803/
- Apple HIG, Lists and tables, Pickers, Live Activities, Playing haptics: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables · https://developer.apple.com/design/human-interface-guidelines/pickers · https://developer.apple.com/design/human-interface-guidelines/live-activities · https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- Ilya Lobanov, How UIScrollView works (rubber band e projeção): https://medium.com/@esskeetit/how-uiscrollview-works-e418adc47060
- Material 3, Gestures, Navigation bar, Extended FAB, Bottom sheets: https://m3.material.io/foundations/interaction/gestures · https://m3.material.io/components/navigation-bar/guidelines · https://m3.material.io/components/extended-fab/guidelines · https://m3.material.io/components/bottom-sheets/guidelines
- Android, Accessibility touch target size: https://support.google.com/accessibility/android/answer/7101858
- WCAG 2.2 (2.5.1, 2.5.7, 2.5.8, 1.3.4, 1.4.4, 1.4.10): https://www.w3.org/TR/WCAG22/
- Steven Hoober, How do users really hold mobile devices?: https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php
- web.dev, Sign-up form best practices, Offline UX design guidelines, Learn PWA, INP: https://web.dev/articles/sign-up-form-best-practices · https://web.dev/articles/offline-ux-design-guidelines · https://web.dev/learn/pwa · https://web.dev/articles/inp
- MDN, env(), VisualViewport, inputmode, enterkeyhint, overscroll-behavior: https://developer.mozilla.org/en-US/docs/Web/CSS/env · https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport · https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode · https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint · https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior
- Baymard Institute, Mobile e-commerce e Checkout usability: https://baymard.com/research/checkout-usability
- NN/g, Mobile UX: https://www.nngroup.com/topic/mobile-and-tablet-design/
- Expo e React Navigation: https://docs.expo.dev/router/introduction/ · https://reactnavigation.org/docs/native-stack-navigator/
