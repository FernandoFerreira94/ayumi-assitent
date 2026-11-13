# Temas

| Tema | Fontes | Raios (sm/md/lg/xl) | Vidro | Mola padrão | Use em |
| --- | --- | --- | --- | --- | --- |
| Aurora | Geist + Geist Mono | 8/12/18/28 | blur 24px | smooth | landing tech, app, IA, lançamento, fintech consumer |
| Clean SaaS | IBM Plex Sans + Plex Mono | 4/6/10/14 | blur 12px, quase opaco | snappy | SaaS, dashboard, ERP, CRM, admin, helpdesk |
| Axion | Geist + Geist Mono | 8/12/16/20 | blur 12px, quase opaco | snappy | SaaS de operação e manutenção, ordens de serviço, ERP, white-label B2B |
| Custelo | Bodoni Moda + Inter | 8/12/16/20 | não usar (LOCK sem vidro) | snappy | Portaria, operação predial, cadeia de custódia, PWA operacional |
| OmniMesa | Inter | 8/12/16/20 | blur 12px, quase opaco | snappy | Restaurante: PDV, salão, KDS, gestão e delivery |
| Editorial | Instrument Serif + Instrument Sans + JetBrains Mono | 2/3/4/6 | sem blur (sólido) | smooth | institucional, portfolio, blog, agência, imobiliário premium |
| Cinematográfico | Inter Tight + Inter + JetBrains Mono | 6/10/16/24 | blur 32px | smooth + ease emphasized | lançamento, streaming e audiovisual, evento e show, produto premium, portfolio de foto e filme |
| Brutalista | Space Grotesk + Space Mono | 0/0/0/0 (botão reto) | sem blur (sólido) | snappy | marca jovem e streetwear, agência criativa, criador e newsletter, ferramenta indie, campanha |
| Playful | Fredoka + Nunito + JetBrains Mono | 10/14/22/32 (botão pílula) | blur 16px | bouncy | EdTech e infantil, app de hábitos e consumo, gamificação, comunidade, delivery e food |

### Os três temas expressivos
- **Cinematográfico:** pensado para começar no escuro (`startMode: dark`). Preto quente, marfim e luz âmbar; botão principal âmbar com texto escuro no escuro e preto com texto âmbar no claro. Gradientes âmbar → brasa → carmim → petróleo para hero e fundos. Motion é a assinatura: use `motion.duration.slow/slower`, `ease-emphasized` e padrões de entrada (`blur-text-reveal`, `scroll-reveal-stagger`, `view-transition-morph`), sempre com `--wc-motion-distance` para movimento reduzido. Evite em ERP, formulário longo e saúde.
- **Brutalista:** borda preta (no escuro, marfim) em tudo, sombra dura sem desfoque (`3px 3px 0` e `6px 6px 0`), raio 0, sem vidro (`glass-bg` sólido). Amarelo de sinalização para preencher, azul para link. Movimento curto e seco (snappy); nada de mola longa. Evite em saúde, fintech conservadora e ERP.
- **Playful:** creme quente e uva profunda, acento framboesa, gradientes de bala (coral, girassol, menta, céu). O "3D leve" vem da sombra com base sólida (`0 3px 0` + difusa) e da mola `bouncy` nos toques; o botão já nasce pílula. Use a mola com moderação: um ponto de celebração por tela. Evite em jurídico, B2B enterprise e saúde crítica.

### Tema de produto
- **Axion:** tema do produto Axion (SaaS de manutenção da WebCode), vindo das pranchas D1–D7. Grafite azulado (Ardósia `#11212D`) como acento e botão, fundo `#E8EBEA` com card branco, sombra sutil em controles e cards (é o único tema com sombra no input), raio 12 nos controles e 16 nos cards. Começa no claro; o escuro existe e passa no contraste, mas o Axion ainda não usa. Os status de OS do Axion (`--sinal-*`) não fazem parte do tema: o texto deles não passa AA e precisa ser refeito antes de entrar no DS.
- **Custelo:** tema do produto Custelo (recebimento e custódia em portarias). Deep Blue `#182350` como acento e botão, fundo Floral White `#FEFAEF`, card branco, Powder Blue como acento no escuro, Bodoni Moda só em títulos. O produto proíbe vidro e blur: os tokens de vidro existem só porque todo tema precisa deles; não use `variant="glass"` no Custelo. Os estados de encomenda (`--state-*`) ficam no projeto.
- **OmniMesa:** tema do produto OmniMesa (SaaS para restaurante). Plum `#30232D` no texto e na sidebar, coral como marca. O coral da marca (`#D55053`) não passa 4,5:1 com texto branco, então o botão usa `#C8424A` e o texto de destaque usa `#B83A3E`; o coral puro fica para gradiente, ilustração e marketing. Claro e escuro são oficiais (o KDS começa no escuro).

Cada tema traz `useFor`, `avoidFor` e `startMode` em `$extensions.com.webcode.theme`; o build copia para `build/index.json` e o site mostra na seção Temas.

## Decisão rápida
- O produto é usado todo dia por horas? → Clean SaaS.
- O produto vende uma ideia ou uma marca? → Aurora (tech) ou Editorial (humano/autoral).
- A marca quer impacto e emoção (lançamento, entretenimento)? → Cinematográfico. Atitude e ruptura? → Brutalista. Leveza e diversão? → Playful.
- Os temas expressivos são para presença e consumo. Produto denso do mesmo cliente continua em Clean SaaS com o mesmo accent.
- Marketing site + app do mesmo cliente: marketing em Aurora/Editorial e app em Clean SaaS, **com o mesmo accent**. Para isso, crie um tema de cliente (abaixo).

## Criar um tema de cliente
1. Copie `tokens/themes/<base>.tokens.json` para `tokens/themes/<cliente>.tokens.json` no repositório `webcode-design`.
2. Troque só o necessário: `accent*`, `focus`, `gradient-*`, fontes. Mantenha a estrutura.
3. `npm run build`: o build bloqueia contraste abaixo de AA e chaves faltando.
4. Se o cliente tiver Penpot, os mesmos tokens alimentam a biblioteca de lá.

## Tokens semânticos (iguais em todos os temas)
Superfícies: `bg`, `surface`, `surface-raised`, `sunken`, `glass-bg`, `glass-border`, `glass-highlight`, `scrim`.
Texto: `fg`, `fg-muted` (≥4.5:1), `fg-subtle` (≥3:1, só texto não essencial).
Bordas: `border` (decorativa, cards e botões de contorno), `border-strong` (contorno fino de campo de texto, apelido `--input`), `control-border` (≥3:1: checkbox, radio, switch, marcador; e campos sob `prefers-contrast: more`). Espessura 1px; 2px só em estado (seleção, anel) ou estilo declarado (brutalista). ADR 0020.

Filete: `rule` (ADR 0025) é a linha de acabamento de 1px (ouro nas paletas de luxo do Estúdio; nos temas, igual ao destaque): `Separator variant="rule"` sob título ou `border-rule` no contorno de um cartão de destaque. Decorativo (≥1.5:1), nunca a única pista de estado e nunca cor de texto. Texturas (mármore, madeira, linho, papel) vêm de `@webcode/texture`, só CSS, só em hero/capa/cartão de destaque.
Marca: `accent` (texto/ícone/link), `accent-hover`, `accent-solid` + `accent-solid-fg` (preenchimentos), `accent-soft`, `focus`.
Status: `success`, `warning`, `danger` + `-soft`.
Decoração: `gradient-1..4` e a escala de elevação `shadow-xs` (controles), `shadow` (cards), `shadow-md` (menus, popovers, cards flutuantes), `shadow-lg` (sheets, drawers), `shadow-xl` (diálogos) — ADR 0013. No Tailwind: `shadow-wc-xs`, `shadow-wc`, `shadow-wc-md`, `shadow-wc-lg`, `shadow-wc-xl`.
Comuns: `font-display/body/mono`, `radius-sm/md/lg/xl/pill/button`, `blur-glass`, `motion-default-ease/spring`, `text-xs…6xl` (escala de texto web, rem), `density-control-xs/sm/md/lg` + `density-row` (densidade web) e `mobile-*` (controles, linha, margem e texto do app mobile/Expo). O build exige o mesmo conjunto em todos os temas e valida as escalas (crescentes, `text-base` ≥ 16px, controle web ≥ 24px, mobile ≥ 44px). ADR 0012.
Base: `space-*` (grid 4px), `size-*`, `font-size-xs…8xl`, `line-height-*`, `font-weight-*`, `tracking-*`, `motion-duration-*`, `motion-ease-*`, `motion-spring-*`.
