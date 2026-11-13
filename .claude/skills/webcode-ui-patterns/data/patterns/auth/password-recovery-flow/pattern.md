---
id: password-recovery-flow
title: Recuperar senha (e-mail → verificação → nova senha)
category: auth
summary: Fluxo completo de "esqueci a senha" em quatro telas ligadas por View Transitions: pedir o link, conferir o e-mail (com reenvio temporizado e atalhos para o app de e-mail), criar a nova senha com confirmação e concluir com entrada direta.
themes: [clean-saas, aurora, editorial]
products: [saas, ecommerce, fintech, health, edtech, erp, crm, subscription, marketplace, admin]
motion: medium
tech: css-js
deps: []
a11y: Resposta neutra ("se houver uma conta com esse e-mail…") evita enumeração. Cada tela leva o foco ao título. Reenvio desabilitado mostra a contagem em texto. Confirmação de senha valida igualdade com mensagem ligada ao campo. Botão Voltar em todas as telas intermediárias.
perf: document.startViewTransition quando existe (crossfade + deslize nativo); fallback é troca direta com animação CSS curta. Nenhum timer roda fora da tela de verificação.
reference_name: OWASP (Forgot Password Cheat Sheet), recuperação do Google e do Mercado Pago
reference_url: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
react: Em Next com rotas separadas (/esqueci, /verifique, /nova-senha) use o ViewTransition do React/Next quando disponível; o token chega por query e o servidor invalida após uso.
status: stable
---

## Quando usar
- Todo produto com senha. Este é o fluxo padrão WebCode de recuperação.

## Evite
- Dizer "e-mail não encontrado": confirma quem tem conta.
- Reenvio liberado sem espera (vira spam) ou sem espera visível (parece quebrado).
- Exigir a senha antiga ou pergunta secreta.

## Implementação
- Telas são `<section>` no mesmo container; só uma visível. `startViewTransition(() => trocar())` com `view-transition-name` no cartão.
- Reenvio: 30s com texto "Reenviar em 24s"; depois do clique, reinicia e anuncia "E-mail reenviado".
- Atalhos "Abrir Gmail" e "Abrir Outlook" ajudam no celular.
- No sucesso, encerre as outras sessões no servidor e ofereça "Entrar agora".
