---
id: mobile-keyboard-form
title: Formulário mobile com o teclado certo
category: form
summary: Cada campo abre o teclado adequado (numérico, telefone, e-mail, decimal), o Enter mostra "Próximo" e avança, o autofill preenche nome, endereço e código SMS, e o botão de enviar fica grudado logo acima do teclado.
themes: [clean-saas, aurora, playful]
products: [mobile-app, field-service, delivery, fintech, ecommerce, habits, health, booking]
motion: low
tech: js
deps: []
a11y: Rótulo visível acima de cada campo; erros por campo com aria-describedby e aria-invalid só depois do blur; fontes ≥16px (o iOS não dá zoom); foco rolado para longe do teclado com scroll-margin; botão sempre alcançável.
perf: Sem bibliotecas de máscara: inputmode + pattern + formatação no input. VisualViewport só para posicionar a barra (um rAF por evento). Nenhum layout shift ao abrir o teclado.
reference_name: web.dev (Sign-up form best practices) e MDN (inputmode, enterkeyhint, VisualViewport)
reference_url: https://web.dev/articles/sign-up-form-best-practices
react: Componentes Field/Input @webcode recebem inputMode, enterKeyHint e autoComplete direto. No Next, viewport.interactiveWidget = "resizes-content". Expo: keyboardType, returnKeyType, textContentType/autoComplete e KeyboardAvoidingView (ou react-native-keyboard-controller).
status: stable
---

## Quando usar
- Todo formulário que roda em celular: cadastro, endereço, checkout, abrir OS, registrar hábito.

## Evite
- `type="number"` para CPF, CEP, cartão e telefone (perde zeros, mostra setas, rola com o scroll). Use `inputmode="numeric"`.
- Placeholder no lugar do rótulo.
- Validar enquanto a pessoa digita o primeiro caractere.
- Rodapé `position: fixed; bottom: 0` sem considerar o teclado: no iOS ele fica escondido atrás dele.

## Implementação
| Campo | Atributos |
| --- | --- |
| Nome | `autocomplete="name"` `enterkeyhint="next"` `autocapitalize="words"` |
| Celular | `type="tel"` `inputmode="tel"` `autocomplete="tel-national"` |
| E-mail | `type="email"` `autocomplete="email"` `autocapitalize="off"` `spellcheck="false"` |
| CEP | `inputmode="numeric"` `autocomplete="postal-code"` `maxlength="9"` |
| Valor | `inputmode="decimal"` |
| Código SMS | `inputmode="numeric"` `autocomplete="one-time-code"` |
| Último campo | `enterkeyhint="send"` (ou `done`) |

- Meta viewport com `interactive-widget=resizes-content` (Chrome/Android) e `visualViewport` como fallback (iOS) para a barra de ação.
