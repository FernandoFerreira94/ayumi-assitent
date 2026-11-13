---
id: login-split-screen
title: Login em tela dividida (senha, passkey e social)
category: auth
summary: Tela de entrada com formulário de um lado e painel de marca do outro. Inclui mostrar senha, aviso de Caps Lock, validação ao sair do campo, botão com estado de carregando, erro de credencial sem revelar qual campo errou, passkey e login social com "último usado".
themes: [clean-saas, aurora, editorial, cinematografico]
products: [saas, erp, crm, admin, helpdesk, fintech, ai-app, devtools, edtech, automation]
motion: low
tech: css-js
deps: []
a11y: Labels visíveis, autocomplete correto (username, current-password, webauthn), erros ligados por aria-describedby e anunciados em região viva; foco vai para o resumo do erro. Botão de mostrar senha é toggle com aria-pressed. Caps Lock anunciado. Painel de marca é decorativo no leitor de tela.
perf: Sem bibliotecas; validação nativa (Constraint Validation API) com mensagens próprias. O painel de marca é CSS puro e some abaixo de 900px.
reference_name: Linear, Vercel e Stripe Dashboard (login)
reference_url: https://linear.app/login
react: Form do shadcn (react-hook-form + zod) com os mesmos estados; o servidor responde erro genérico ("E-mail ou senha incorretos") e o client foca o alerta. Passkey via navigator.credentials.get com mediation "conditional".
status: stable
---

## Quando usar
- Entrada de qualquer app logado. É o login padrão WebCode.

## Evite
- Dizer qual campo errou ("senha incorreta"): facilita enumeração de contas.
- Desabilitar colar na senha ou bloquear gerenciadores de senha.
- Validar enquanto a pessoa ainda digita o e-mail pela primeira vez.

## Implementação
- `autocomplete="username webauthn"` no e-mail deixa o navegador oferecer a passkey no próprio campo.
- Validação no `blur` e no envio; depois do primeiro erro, revalida a cada tecla para o erro sumir assim que corrigir.
- Botão com `aria-busy` e rótulo "Entrando…" durante o envio; não troque a largura (use `min-width`).
- "Último usado" lido de `localStorage` (try/catch) marca o provedor social usado antes (selo dentro do botão, entra no nome acessível).
- Abaixo de 900px o painel de marca some e o formulário centraliza.
