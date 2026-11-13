---
id: signup-multi-step
title: Cadastro em etapas com força de senha
category: auth
summary: Cadastro dividido em três passos curtos (e-mail, senha, perfil) com barra de progresso, transição que respeita a direção (avançar vai para a esquerda, voltar para a direita), medidor de força e checklist de requisitos da senha ao vivo.
themes: [clean-saas, aurora, editorial, brutalista, playful]
products: [saas, fintech, erp, crm, edtech, ai-app, automation, marketplace]
motion: medium
tech: css-js
deps: []
a11y: Cada etapa é um fieldset com legend; "Etapa 2 de 3" está no título e na barra (progressbar com aria-valuenow). Ao trocar de etapa o foco vai para o título novo. Requisitos da senha são lista com estado em texto ("atendido"/"pendente"), não só cor. Voltar preserva o que foi digitado.
perf: Etapas no mesmo form (um envio só, o navegador oferece salvar senha). Animação de entrada por classe com keyframes curtos; força da senha calculada localmente sem biblioteca.
reference_name: GOV.UK Service Manual (Structuring forms, uma coisa por página), Stripe e Nubank
reference_url: https://www.gov.uk/service-manual/design/form-structure
react: Um form (react-hook-form) com step em estado e trigger(fields da etapa) antes de avançar; AnimatePresence só se o projeto já usa Motion, senão estas classes.
status: stable
---

## Quando usar
- Cadastros com 5+ campos ou que pedem dados sensíveis (empresa, CNPJ, cargo) depois do essencial.
- Quando o funil precisa medir onde as pessoas desistem.

## Evite
- Etapas com um campo trivial cada (cansa) ou mais de 4 etapas.
- Medidor de força que exige símbolos arbitrários: comprimento vale mais (NIST 800-63B).

## Implementação
- Avançar valida só os campos da etapa atual; o erro aparece no campo e o foco vai para ele.
- Classe `is-enter-forward` / `is-enter-back` define o lado de entrada (`translate` × `--wc-motion-distance`).
- Força: comprimento, variedade e lista curta de senhas comuns; 4 níveis com cor e rótulo.
- Na última etapa, o botão vira "Criar conta" e mostra estado de carregando; no sucesso, tela de confirmação.
