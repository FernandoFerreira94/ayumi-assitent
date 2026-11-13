# Marca e UI base

**Finalidade:** identidade (Bolha e 8 mascotes, temas de cor, datas comemorativas, splash), feedback (toasts, erro, vazio, offline) e navegação (barra de baixo em pílula de vidro, menu do avatar, sino). Usado por todas as telas.

## Arquivos
- Marca: `components/brand/mascots.ts` (registro dos mascotes → `mascot-themes.css`), `Mascot.tsx`/`MascotBodies.tsx` (SVG), `moods.ts` (tipo de retorno → expressão: `FEEDBACK_MOOD`), `season.ts` + `SeasonAccessory.tsx`, `Splash.tsx`, `applyMascot.ts`, `MascotSync.tsx`, `Wordmark.tsx` ("bubbly").
- Feedback: `components/feedback/toast.tsx` (`notify`, 5 tipos), `ErrorState`, `EmptyState`, `OfflineBanner`, `SubmitButton`.
- Nav: `components/nav/TabBar.tsx` (aba atual mostra nome; Financeiro = "Finanças"), `AppMenu`/`HeaderMenu` (avatar: não mexer sem pedido), `NotificationBell`, `BackButton`, `UpdateBanner`, `nav-icons.tsx`, `ServiceWorkerRegister`.
- UI: `components/ui/Icon.tsx` (único conjunto de ícones), `LetterPicker.tsx`, `MultiSelect.tsx`, `Switch.tsx` (estilo iPhone), `PageShell.tsx`, `Skeleton.tsx`.
- Estilos: `src/app/globals.css` (tokens, `--svc-*`, splash, glass).
- Prévia de link (WhatsApp/Instagram): `lib/share-meta.ts` (`shareMeta`, `siteUrl` → `metadataBase` = `BETTER_AUTH_URL`) + `public/og.png` (1200x630). Usado no `app/layout.tsx`, `/login`, `/privacidade`, `/termos`; `og.png` é público no `proxy.ts`. Trocou a imagem: subir o `?v=` (WhatsApp guarda cache).

## Cuidados
- Tema sempre claro; Lavanda Digital + Quicksand; vidro da biblioteca `webcode-design`.
- Ação nunca vira página: sheet/diálogo. Toast no topo, banner de atualização embaixo.
- Mascote novo ou expressão nova: registrar em `mascots.ts`/`moods.ts` e conferir push (`push/webpush`) e splash.
- **Regra de UX do teclado** (detalhe no AGENTS.md): campo focado sempre visível, sheet/diálogo nunca cortado, subida/descida suave junto com o teclado, fonte de campo ≥ 16px, barra de abas some. Sheet ou diálogo novo não precisa de nada (o `KeyboardWatcher` + `globals.css` cuidam); novo diálogo central deve usar `.notif-dialog`/`.notif-panel`. A barra de abas some com o teclado aberto.
- Sino (`features/notifications`): cada `Aviso` traz `icon` (de `Icon.tsx`) e `tone` (`danger` vermelho, `warning` laranja, `success` verde, `info` azul), definidos em `core.ts`; a linha usa `IconTile` + `.aviso-row[data-tone]` no `globals.css`. Aviso de cliente leva `client` e mostra avatar com iniciais (nome + sobrenome, `initials` do `AppMenu`) na cor fixa `avatarColor(id)` (paleta `--svc-*`) com selo do tom no canto. Aviso novo: escolher ícone e tom lá; a cor nunca é a única pista.
- Testes: `tests/e2e/splash.spec.ts`, `shell.spec.ts`, axe nos e2e; unit `mascots`, `season`, `feedback`.
