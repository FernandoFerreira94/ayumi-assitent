# Marca e UI base

**Finalidade:** identidade (Bolha e 8 mascotes, temas de cor, datas comemorativas, splash), feedback (toasts, erro, vazio, offline) e navegação (barra de baixo em pílula de vidro, menu do avatar, sino). Usado por todas as telas.

## Arquivos

- Marca: `components/brand/mascots.ts` (registro dos mascotes → `mascot-themes.css`), `Mascot.tsx`/`MascotBodies.tsx` (SVG), `moods.ts` (tipo de retorno → expressão: `FEEDBACK_MOOD`), `season.ts` + `SeasonAccessory.tsx`, `useWeather.ts` (clima do aparelho via Open-Meteo, cache de 30 min no `localStorage`, só com localização já permitida; roupa por `outfitFor` em `owner-notices/weather.ts`, usada no `SideNavBrand` e no `DayHero`, que também ganha as falas do tempo), `Splash.tsx`, `applyMascot.ts`, `MascotSync.tsx`, `Wordmark.tsx` ("bubbly").
- Feedback: `components/feedback/toast.tsx` (`notify`, 5 tipos), `ErrorState`, `EmptyState`, `OfflineBanner`, `SubmitButton`.
- Menu lateral (tablet/desktop): `nav/SideNav.tsx` + `SideNavBrand.tsx` (topo = mascote escolhido parado, `bubbly` e o nome de quem está logado, de `getMenuData().userName`; sem nome a linha some; leva ao Painel) + `useNavIndicator.ts` (pílula da tela atual que desliza entre itens; usado também no `AdminNav`). Animações em `globals.css` (bloco "Menu lateral"), todas desligadas com reduzir movimento.
- Nav: `components/nav/TabBar.tsx` (aba atual mostra nome; Financeiro = "Finanças"), `AppMenu`/`HeaderMenu` (avatar: não mexer sem pedido; item Admin só com `isAdmin`, ver [admin.md](admin.md)), `NotificationBell`, `BackButton`, `AutoUpdate` (sem banner, só toast), `nav-icons.tsx`, `ServiceWorkerRegister`.
- UI: `components/ui/Icon.tsx` (único conjunto de ícones), `LetterPicker.tsx`, `MultiSelect.tsx`, `Switch.tsx` (estilo iPhone), `PageShell.tsx`, `Skeleton.tsx`.
- Passo a passo ilustrado: `components/ui/StepGuide.tsx` (carrossel com encaixe nativo, botões e pontos, texto sempre embaixo, ilustração `aria-hidden`, `data-vaul-no-drag`) + `GuideArt.tsx` (peças SVG: `Phone`, `Ring` que pulsa, `Callout`, `Arrow`, `Badge`, `Toggle`; área 320×190). Guias: `whatsapp/pairing-guide.tsx`, `calendar-feed/icloud-guide.tsx`.
- Estilos: `src/app/globals.css` (tokens, `--svc-*`, splash, glass).
- Prévia de link (WhatsApp/Instagram): `lib/share-meta.ts` (`shareMeta`, `siteUrl` → `metadataBase` = `BETTER_AUTH_URL`) + `public/og.png` (1200x630). Usado no `app/layout.tsx` e `/login`; `og.png` é público no `proxy.ts`. Trocou a imagem: subir o `?v=` (WhatsApp guarda cache).

## Cuidados

- Tema sempre claro; Lavanda Digital + Quicksand; vidro da biblioteca `webcode-design`.
- Ação nunca vira página: sheet/diálogo. Toast no topo, banner de atualização embaixo.
- Fala do mascote (balão do Painel `.speech-solid`, toast `.app-toast`): borda em `var(--m-rim-0)`, a cor do mascote de Meu perfil. Nunca hex fixo. O balão do Painel tem ainda `.speech-glow`: "corrente" de luz girando na borda com `--m-rim-0..4` (parada com reduzir movimento).
- Mascote novo ou expressão nova: registrar em `mascots.ts`/`moods.ts` e conferir push (`push/webpush`) e splash.
- **Regra de UX do teclado** (detalhe no AGENTS.md): campo focado sempre visível, sheet/diálogo nunca cortado, subida/descida suave junto com o teclado, fonte de campo ≥ 16px, barra de abas some. Sheet ou diálogo novo não precisa de nada (o `KeyboardWatcher` + `globals.css` cuidam); novo diálogo central deve usar `.notif-dialog`/`.notif-panel`. A barra de abas some com o teclado aberto.
- **`<dialog>` com `showModal()` + `cacheComponents`** (17/11): o Next guarda a tela anterior escondida (Activity) em vez de desmontar; um `<dialog>` modal aberto ficaria invisível e travaria a tela nova inteira. Todo `<dialog>` com `showModal()` chama `useCloseOnHide(ref)` (`lib/use-close-on-hide.ts`). Sair da conta (`nav/SignOutButton.tsx`) recarrega com `window.location.replace("/login")`, nunca `router.replace`: zera telas guardadas e dados da conta que saiu.
- **Folha (vaul) com conteúdo longo:** a rolagem fica num filho com `SHEET_SCROLL` (`components/ui/AdaptiveSheet.tsx`) e a folha com `flex flex-col` sem `overflow-y-auto`. O vaul põe `touch-action: none` na folha, então se ela mesma rolar o iPhone trava a rolagem. `Drawer.Handle` fica fora do miolo.
- Sino (`features/notifications`): cada `Aviso` traz `icon` (de `Icon.tsx`) e `tone` (`danger` vermelho, `warning` laranja, `success` verde, `info` azul), definidos em `core.ts`; a linha usa `IconTile` + `.aviso-row[data-tone]` no `globals.css`. Aviso de cliente leva `client` e mostra avatar com iniciais (nome + sobrenome, `initials` do `AppMenu`) na cor fixa `avatarColor(id)` (paleta `--svc-*`) com selo do tom no canto. Aviso novo: escolher ícone e tom lá; a cor nunca é a única pista.
- Ilustração de instrução: sempre mockup desenhado em SVG inline com tokens (`var(--primary)` segue o mascote), nunca print real nem dado de pessoa. Guia novo: um array `GuideStep[]` na feature, com o mesmo texto que antes estava na lista.
- **Confirmar digitando** (`components/ui/TypeToConfirmSheet.tsx`, 25/11): folha que só libera o botão vermelho depois de digitar a palavra (sem diferença de maiúscula). Usada no Excluir minha conta (EXCLUIR) e no Excluir de pacote/promoção em Planos (excluir). Ícones `trash` e `pencil` em `Icon.tsx`.
- Testes: `tests/e2e/splash.spec.ts`, `shell.spec.ts`, axe nos e2e; unit `mascots`, `season`, `feedback`, `step-guide`.
