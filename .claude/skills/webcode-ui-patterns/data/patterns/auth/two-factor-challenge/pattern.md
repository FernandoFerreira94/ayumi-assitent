---
id: two-factor-challenge
title: Verificação em duas etapas (app, SMS ou código de backup)
category: auth
summary: Tela de 2FA depois da senha: código de 6 dígitos com colar e avanço automático, envio automático ao completar, erro com tremida curta, troca de método (app autenticador, SMS com reenvio temporizado, código de backup) e "confiar neste dispositivo".
themes: [clean-saas, aurora, editorial]
products: [fintech, saas, erp, admin, health, crm, devtools, b2b]
motion: low
tech: css-js
deps: []
a11y: Grupo de dígitos rotulado ("Código de 6 dígitos"), cada caixa com rótulo "Dígito n de 6", autocomplete="one-time-code" na primeira. Colar distribui os dígitos. Erro anunciado e ligado ao grupo; tremida desligada em reduced motion. Lista de métodos é radiogroup nativo.
perf: Sem libs; validação local de formato e chamada única ao completar. Reenvio por SMS só libera após 30s para não gerar custo de envio.
reference_name: GitHub 2FA e verificação do Banco Inter
reference_url: https://docs.github.com/authentication/securing-your-account-with-two-factor-authentication-2fa
react: Use o padrão otp-code-input (ou input-otp do shadcn) para os dígitos; o método escolhido vira estado e o servidor guarda o cookie de dispositivo confiável por 30 dias.
status: stable
---

## Quando usar
- Depois do login em produtos com dinheiro, saúde ou dados de empresa.

## Evite
- SMS como único método: ofereça app autenticador e códigos de backup.
- Limpar o código inteiro em cada erro sem dizer o motivo.
- Esconder a saída ("Usar outro método", "Perdi acesso").

## Implementação
- Base de dígitos igual ao `otp-code-input` do catálogo (input numérico por caixa, setas, Backspace volta).
- Ao completar, envia sozinho; enquanto verifica, as caixas ficam `readonly` e o botão mostra "Verificando…".
- Código de backup usa um campo único de 8 caracteres (formato `xxxx-xxxx`).
- Demo: o código certo é 123456 e o backup é abcd-1234.
