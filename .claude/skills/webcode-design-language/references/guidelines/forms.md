# Formulários

Formulário é onde o produto ganha ou perde dinheiro (cadastro, checkout, lead). Cada campo custa conversão.

## Estrutura
- [ ] Peça só o necessário agora. O resto pode vir depois (perfil progressivo). Cada campo cortado é conversão ganha.
- [ ] Uma coluna. Duas colunas só para pares curtos e óbvios (Cidade + UF, Validade + CVV).
- [ ] Rótulo acima do campo, sempre visível. Placeholder só para exemplo de formato, nunca como rótulo.
- [ ] Largura do campo sugere o tamanho da resposta (CEP curto, endereço longo).
- [ ] Agrupe com título (`fieldset` + `legend`): "Dados pessoais", "Entrega", "Pagamento".
- [ ] Opcional marcado como "(opcional)"; não marque obrigatório com asterisco quando quase tudo é obrigatório.
- [ ] Formulários longos: passos com progresso, uma decisão por passo no mobile (padrão GOV.UK "uma coisa por página").

## Campos e controles certos
- [ ] Até 5 opções excludentes: radio (visível). Mais que isso: select ou combobox com busca.
- [ ] Liga/desliga com efeito imediato: switch. Escolha que só vale ao salvar: checkbox.
- [ ] Data conhecida (nascimento): três campos ou campo com máscara; data próxima (agendamento): calendário.
- [ ] Quantidade pequena: stepper (− 1 +) com campo editável.
- [ ] Nunca dropdown para Sim/Não.

## Teclado móvel e preenchimento
- [ ] `inputmode` e `type` corretos: `numeric` para CPF/CEP/cartão, `tel`, `email`, `decimal` para valores.
- [ ] `autocomplete` em todo campo conhecido (`given-name`, `email`, `tel-national`, `postal-code`, `address-line1`, `cc-number`, `cc-exp`, `one-time-code`).
- [ ] `font-size` ≥ 16px nos inputs (evita zoom no iOS). Altura mínima 44px.
- [ ] Enter envia; Tab segue a ordem visual. `enterkeyhint` (`next`, `done`, `send`) no mobile.

## Padrões brasileiros
- [ ] **CPF/CNPJ:** um campo que aceita os dois, máscara aplicada enquanto digita, valida dígito verificador, aceita colar com ou sem pontuação.
- [ ] **CEP:** ao completar 8 dígitos, busca o endereço e preenche rua, bairro, cidade e UF; foco vai para "Número". Mantém editável se a busca falhar.
- [ ] **Telefone:** `(11) 98765-4321`, aceita fixo e celular, DDI opcional quando houver público estrangeiro.
- [ ] **Moeda:** `R$` fixo à esquerda, digitação da direita para a esquerda (centavos primeiro) ou formatação no blur; teclado `decimal`.
- [ ] **Data:** `dd/mm/aaaa`, nunca formato americano.
- [ ] **Pix:** copia e cola com botão "Copiar código" e QR; status atualiza sozinho quando o pagamento cai.
- [ ] Máscara nunca bloqueia colar e nunca move o cursor para o fim ao editar no meio.

## Validação e erros
- [ ] Valide no blur (ao sair do campo), não a cada tecla. Exceção: força de senha e limite de caracteres, que podem ser ao vivo.
- [ ] Ao corrigir um campo com erro, a mensagem some assim que ficar válido (validação ao vivo só depois do primeiro erro).
- [ ] Mensagem embaixo do campo, específica e com solução: "Digite o e-mail completo, como nome@empresa.com".
- [ ] No envio com erros: foco vai para o primeiro campo inválido; em formulário longo, resumo no topo com links.
- [ ] Erros de servidor (e-mail já existe, cupom inválido) aparecem no campo correspondente, não só em toast.
- [ ] Nunca apague o que o usuário digitou por causa de um erro (exceto senha, se a política exigir).
- [ ] Botão de envio sempre habilitado: desabilitar esconde o motivo. Ao clicar, mostra o que falta.

## Envio
- [ ] Botão com verbo e resultado ("Criar conta", "Pagar R$ 189,90"). Entra em loading e evita envio duplo.
- [ ] Sucesso leva ao próximo passo, não a uma tela vazia.
- [ ] Formulário longo salva rascunho (local ou servidor) e avisa ao sair com alterações.

## Autenticação
- [ ] Passkey ou login social primeiro quando o público permite; e-mail + senha como alternativa.
- [ ] Mostrar/ocultar senha. Colar sempre permitido. Requisitos de senha visíveis antes de errar.
- [ ] Código por SMS/e-mail com `autocomplete="one-time-code"`, um campo só (não 6 caixinhas que quebram o colar) ou caixas que aceitam colar o código inteiro.
- [ ] "Esqueci a senha" ao lado do campo de senha, não escondido.
- [ ] Não exija CAPTCHA de quebra-cabeça (WCAG 3.3.8). Prefira proteção invisível (rate limit, Turnstile).

## Checkout (e-commerce)
- [ ] Compra como visitante permitida; criar conta é opcional e oferecida depois do pagamento.
- [ ] Endereço por CEP, frete calculado antes de pedir dados pessoais quando possível.
- [ ] Pix, cartão (com parcelas e total por parcela) e boleto; o mais usado pelo público vem primeiro.
- [ ] Resumo do pedido sempre visível (lateral no desktop, colapsável no mobile) com total final.
- [ ] Cupom recolhido em link ("Tenho um cupom"), para não sugerir que o preço é negociável.

## Fontes
- Baymard Institute, Checkout Usability: https://baymard.com/research/checkout-usability
- NN/g, Website Forms Usability: https://www.nngroup.com/articles/web-form-design/
- NN/g, Error Message Guidelines: https://www.nngroup.com/articles/error-message-guidelines/
- GOV.UK Design System, Question pages e Validation: https://design-system.service.gov.uk/patterns/question-pages/ · https://design-system.service.gov.uk/patterns/validation/
- web.dev, Sign-in form best practices: https://web.dev/articles/sign-in-form-best-practices
- web.dev, Payment and address form best practices: https://web.dev/articles/payment-and-address-form-best-practices
- MDN, atributo autocomplete: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- passkeys.dev: https://passkeys.dev/
