# Configuração que depende do Fernando

O código já está pronto e testado com simulações. Falta configurar o que só você pode.

## 1. Google (login + Agenda)

1. Google Cloud Console → novo projeto → **APIs e serviços** → ativar **Google Calendar API**.
2. **Tela de consentimento OAuth**: tipo externo, adicionar os e-mails de teste (Yumi e o seu). Escopo: `.../auth/calendar`.
3. **Credenciais** → ID do cliente OAuth (aplicativo da Web).
   - URI de redirecionamento: `https://<seu-domínio>/api/auth/callback/google` (e `http://localhost:3000/api/auth/callback/google` para testes).
4. Guardar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

## 2. Variáveis no Railway (serviço do app)

| Variável                                    | Valor                                           |
| ------------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`                              | URL do Postgres do Railway                      |
| `BETTER_AUTH_URL`                           | URL pública do app                              |
| `BETTER_AUTH_SECRET`                        | `openssl rand -base64 32`                       |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | do passo 1                                      |
| `ALLOWED_EMAILS`                            | e-mails que podem entrar, separados por vírgula |

Comando de release/deploy: `pnpm db:migrate` antes de `pnpm start`.

## 3. Ainda não construído (precisa de acesso externo para testar)

- WhatsApp + lembretes (Evolution API no Railway, fila pg-boss).
- Notificação push (chaves VAPID).
- Puxar mudanças feitas direto no Google Agenda para o app (hoje a sincronização vai do app para o Google).
