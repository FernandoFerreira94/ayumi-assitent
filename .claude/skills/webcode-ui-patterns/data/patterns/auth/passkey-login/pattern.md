---
id: passkey-login
title: Entrar com passkey (Face ID, digital ou Windows Hello) com saída para senha
category: auth
summary: Login sem senha via WebAuthn: o campo de e-mail já oferece a passkey no preenchimento automático (conditional UI), um botão "Entrar com passkey" para quem não usa o autopreenchimento, estados de aguardando, cancelado e sem suporte, e sempre uma saída ("Usar senha" ou "Receber código por e-mail"). Depois do login com senha, oferece criar a passkey.
themes: [clean-saas, aurora, editorial]
products: [fintech, saas, mobile-app, ecommerce, health, b2b, admin, crm]
motion: low
tech: css-js
deps: []
a11y: E-mail com autocomplete="username webauthn" para o autopreenchimento do sistema. Estado da verificação num role=status (aguardando, cancelado, erro). Cancelar a biometria não é erro vermelho: é aviso neutro com o próximo passo. Botões com texto, não só ícone.
perf: Sem libs. Detecta suporte com PublicKeyCredential.isConditionalMediationAvailable() e só então liga o autopreenchimento; sem suporte, o botão de passkey some e a senha vira o caminho principal. O desafio vem do servidor por chamada.
reference_name: passkeys.dev (FIDO Alliance) e login do Google com passkey
reference_url: https://passkeys.dev/docs/use-cases/bootstrapping/
react: Use @simplewebauthn/browser (com ADR) ou a API nativa: navigator.credentials.get({ publicKey, mediation: 'conditional' }) no mount, com AbortController para cancelar ao clicar no botão. O servidor gera o desafio e valida a assinatura.
status: beta
---

## Quando usar
- Produto com conta recorrente (banco, SaaS, loja) que quer tirar a senha do caminho sem bloquear quem não tem passkey.

## Evite
- Passkey como único método: sempre ofereça senha ou código por e-mail.
- Tratar "cancelei o Face ID" como erro grave (vermelho, tremida).
- Pedir para criar passkey antes do primeiro login dar certo.
- Termos técnicos ("WebAuthn", "credencial FIDO") na interface: diga "passkey" e o nome da biometria do aparelho.

## Implementação
- Ao abrir: se `isConditionalMediationAvailable()`, chama `credentials.get` com `mediation: 'conditional'`; o sistema mostra a passkey na lista do campo de e-mail.
- Botão: aborta a chamada condicional e faz uma chamada modal (`mediation: 'optional'`).
- Erros: `NotAllowedError` = cancelado (aviso neutro); outros = "Não deu certo. Use a senha."
- Demo: a biometria é simulada (sem servidor). Use "Simular cancelamento" para ver o estado neutro.
