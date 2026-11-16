# Apps da loja (Android e iPhone)

**Finalidade:** publicar o Bubbly na Google Play e na App Store como casca nativa (Capacitor 8) que carrega o app web publicado. Um código só: mudança na web chega ao app sem passar pela loja. Plano completo: Claude Doc "Bubbly nas lojas: plano Android e iPhone".

## Arquivos
- `mobile/`: projeto Capacitor com dependências próprias (npm, fora do pnpm, do tsconfig e do eslint da raiz).
  - `capacitor.config.json`: `appId` **br.app.bubbly** (não muda depois de publicado), `server.url` = endereço do app (trocar para app.bubbly.app.br quando o domínio ativar), `appendUserAgent: "BubblyApp/<versão>"`, splash roxo, barras do sistema.
  - `www/offline.html` (e `index.html`): tela de sem internet ao abrir; o endereço do app está repetido nela.
  - `assets/`: imagens-fonte de ícone e splash, geradas por `pnpm icons:app` (`scripts/app-icons.tsx`). Depois `npm run assets` em `mobile/` gera os tamanhos nativos.
  - `android/`, `ios/` (SPM, sem CocoaPods): projetos nativos gerados por `npx cap add`; refaça `npx cap sync` após mudar config ou plugin.
- `codemagic.yaml` (raiz): `android-debug` (APK de teste) e `ios-testflight` (precisa da conta Apple e da integração "Bubbly App Store Connect" + variável `APP_STORE_APPLE_ID` no Codemagic).
- Web: `features/install/platform.ts` (`isNativeShell`: user agent com `BubblyApp/`), `useInstall` trata o app da loja como já instalado (não ensina a instalar o PWA).
- Web: `features/native/well-known.ts` + rotas `app/.well-known/assetlinks.json` e `app/.well-known/apple-app-site-association` (links do domínio abrem o app). Variáveis no Railway (web): `ANDROID_CERT_SHA256` (impressões SHA-256, vírgula) e `APPLE_TEAM_ID`; sem elas, lista vazia/404. `proxy.ts` deixa `.well-known` passar sem login.

## Build local (Windows)
- JDK 21 (Capacitor 8 exige; o JDK 17 do PC não serve): `$env:JAVA_HOME` apontando para um JDK 21.
- `cd mobile; npx cap sync android; cd android; .\gradlew.bat assembleDebug` → `android/app/build/outputs/apk/debug/app-debug.apk`.
- iPhone só no Codemagic (sem Mac).

## Cuidados
- Regra de loja: o app **não vende nada** (sem preço, botão de assinar ou link de pagamento) quando `isNativeShell`; assinatura só no site (Apple 3.1.3(f)).
- Login do Google não funciona dentro de WebView (o Google bloqueia): Bloco 2 leva o login ao navegador do sistema com volta por link. Até lá, no app só e-mail e senha.
- Push no app precisa de FCM/APNs (Bloco 3); Web Push não funciona na WebView do iPhone.
- Teclado: a WebView não é o Safari; conferir as regras de teclado do iPhone (`KeyboardWatcher`) no TestFlight antes de mexer.
- Segredos de assinatura (.p8, keystore) só no Codemagic; `.gitignore` de `mobile/` barra `*.jks`, `*.p8`, `*.p12`.
- Só teste (TestFlight e teste fechado) até o lançamento público (regra do usuário, 16/11/2026).
