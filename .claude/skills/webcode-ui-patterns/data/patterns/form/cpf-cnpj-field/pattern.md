---
id: cpf-cnpj-field
title: Campo CPF/CNPJ com máscara e validação
category: form
summary: Um campo só que reconhece CPF ou CNPJ (inclusive o CNPJ alfanumérico de 2026), aplica a máscara enquanto digita sem pular o cursor, aceita colar com ou sem pontuação e valida os dígitos verificadores no blur.
themes: [clean-saas, aurora, editorial]
products: [ecommerce, erp, crm, admin, fintech, b2b, saas, health, marketplace, pos]
motion: none
tech: css-js
deps: []
a11y: Label visível, formato de exemplo em texto de ajuda, erro em texto ligado por aria-describedby com aria-invalid; validação só no blur e reavaliada ao corrigir; tipo detectado anunciado na ajuda.
perf: Formatação em uma passada de string no evento input, sem bibliotecas de máscara.
reference_name: Receita Federal (CNPJ alfanumérico, IN RFB 2.229/2024)
reference_url: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico
react: Mesma lógica num hook useDocumentMask com o Input do @webcode; valide também no servidor. Guarde só os caracteres (sem pontuação).
status: stable
---

## Quando usar
- Cadastro de cliente, checkout com nota fiscal, cadastro de fornecedor, emissão fiscal.

## Evite
- Dois campos separados (CPF e CNPJ) com seletor antes: o tamanho já diz qual é.
- Bloquear colar ou travar o cursor no fim ao editar no meio.
- Validar a cada tecla (erro aparece antes da pessoa terminar).

## Implementação
- Até 11 caracteres numéricos é CPF (`000.000.000-00`); acima disso, CNPJ (`00.000.000/0000-00`). Desde julho de 2026 novos CNPJs podem ter letras nas 12 primeiras posições; os 2 dígitos finais seguem numéricos.
- Dígito verificador do CNPJ alfanumérico: valor de cada caractere = código ASCII − 48 (os dígitos ficam iguais), pesos 2–9 como antes.
- O cursor é reposicionado contando quantos caracteres válidos havia antes dele, então editar no meio funciona.
- `inputmode="text"` (precisa aceitar letras do CNPJ novo) com `autocapitalize="characters"`; se o produto só aceitar CPF, use `inputmode="numeric"`.
