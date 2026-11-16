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

## Login do Google no app (Bloco 2)
O Google não deixa entrar dentro da WebView. Fluxo (`features/native/handoff-core.ts` explica cada passo):
1. `LoginForm` (com `isNativeShell`) chama `google-login.startNativeGoogleLogin`: cria um segredo (verifier) no `localStorage`, abre o navegador do sistema (`@capacitor/browser`) em `/api/native-auth/start?challenge=<sha256>`.
2. `start` guarda o challenge num cookie `bubbly_native_challenge` (Path=/api, 10 min) e manda para o Google pelo Better Auth (`signInSocial`, volta em `/api/native-auth/finish`).
3. `finish` (navegador): gera um token de uso único do Better Auth (plugin `oneTimeToken`, só pelo servidor) para a sessão do navegador, guarda {token, challenge} na tabela `verification` sob o hash de um código aleatório (2 min) e volta ao app por `br.app.bubbly://auth?code=...`. Apaga os cookies do navegador.
4. `NativeBridge` (root layout, só no app) recebe o link (`@capacitor/app` `appUrlOpen`), fecha o navegador e faz POST `/api/native-auth/exchange` {code, verifier}. O servidor consome o código, confere o segredo e abre a sessão (cookie) na WebView.
- Erro na volta do Google com o cookie do challenge: o wrapper de `api/auth/[...all]` manda para `finish?error=CODE`, que volta ao app com o erro (o `/login` do app mostra o texto).
- As rotas `/api/auth/one-time-token/*` respondem 404 pela rede (hook `before` em `lib/auth.ts`); o token nunca sai do servidor.
- Link de volta registrado em `AndroidManifest.xml` (intent-filter `br.app.bubbly://auth`) e `Info.plist` (`CFBundleURLTypes`).
- Testes: `tests/unit/native-handoff.test.ts`, `tests/db/native-auth.test.ts` (Better Auth real no Postgres de teste).
- Ainda não: conectar outra conta Google em Ajustes > Calendários dentro do app (linkSocial também é bloqueado na WebView) e Sign in with Apple (depende da conta Apple).

## Build local (Windows)
- JDK 21 (Capacitor 8 exige; o JDK 17 do PC não serve): `$env:JAVA_HOME` apontando para um JDK 21.
- `cd mobile; npx cap sync android; cd android; .\gradlew.bat assembleDebug` → `android/app/build/outputs/apk/debug/app-debug.apk`.
- iPhone só no Codemagic (sem Mac).

## Cuidados
- Regra de loja: o app **não vende nada** (sem preço, botão de assinar ou link de pagamento) quando `isNativeShell`; assinatura só no site (Apple 3.1.3(f)).
- Push no app precisa de FCM/APNs (Bloco 3); Web Push não funciona na WebView do iPhone.
- Teclado: a WebView não é o Safari; conferir as regras de teclado do iPhone (`KeyboardWatcher`) no TestFlight antes de mexer.
- Segredos de assinatura (.p8, keystore) só no Codemagic; `.gitignore` de `mobile/` barra `*.jks`, `*.p8`, `*.p12`.
- Só teste (TestFlight e teste fechado) até o lançamento público (regra do usuário, 16/11/2026).
