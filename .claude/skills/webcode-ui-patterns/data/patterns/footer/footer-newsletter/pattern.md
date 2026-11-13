---
id: footer-newsletter
title: Footer com newsletter em destaque
category: footer
summary: Footer que abre com um bloco de inscrição (proposta clara, frequência, prova social), campo com validação e estado de sucesso animado, seguido de links enxutos. Para blogs, criadores e marcas que vivem de audiência.
themes: [editorial, aurora, clean-saas, cinematografico, brutalista]
products: [editorial, landing, portfolio, edtech, subscription, launch, ecommerce]
motion: low
tech: css-js
deps: []
a11y: Label visível ou associado ao campo, erro em aria-describedby e anunciado; sucesso numa região viva que recebe o foco. Consentimento LGPD em texto curto junto ao botão. Botão mantém largura e indica envio com aria-busy.
perf: Envio por fetch sem recarregar; o formulário funciona sem JS (action/method) e o JS só melhora. Nenhuma imagem pesada.
reference_name: Substack e newsletters de marcas (The Browser Company, Stripe Press)
reference_url: https://substack.com
react: Server Action no form (progressive enhancement) + useActionState para pendente/erro/sucesso; double opt-in no servidor.
status: stable
---

## Quando usar
- Sites de conteúdo, criadores, lançamentos e lojas com clube/ofertas por e-mail.

## Evite
- Popup de newsletter e footer de newsletter na mesma página.
- Pedir nome, telefone e data de nascimento: só o e-mail converte melhor.

## Implementação
- Diga o que chega e com que frequência ("1 e-mail por semana, toda quinta").
- Prova social curta ("12 mil leitores") com avatares decorativos.
- Sucesso troca o formulário por mensagem com ícone que entra com mola; foco vai para a mensagem.
- Erros: vazio, formato e "já inscrito" (servidor) com texto específico.
