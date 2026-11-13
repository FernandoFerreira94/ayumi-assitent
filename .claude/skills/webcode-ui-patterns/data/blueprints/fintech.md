---
id: fintech
title: Fintech e carteira digital
family: Serviços e verticais
summary: Conta, carteira, crédito ou investimentos no celular. Confiança, clareza de valores e segurança sem atrito são o produto.
kpi: Ativação (primeira transação em 7 dias) e taxa de contato com suporte por transação
themes: [aurora, clean-saas]
patterns: [ios-tab-bar, bottom-sheet, confirm-alert-dialog, skeleton-shimmer, toast-stack, copy-feedback, press-spring-button, ios-switch, splash-logo-reveal, currency-brl-input, otp-code-input, cpf-cnpj-field, kpi-stat-card, status-banner, async-button-states, progress-stepper, pix-copy-paste, large-title-collapse, segmented-control, pull-to-refresh, line-chart-crosshair, bullet-goal, product-tour, login-split-screen, signup-multi-step, password-recovery-flow, two-factor-challenge, footer-saas-columns, footer-app-download, ios-stack-navigation, card-modal-sheet, action-sheet, mobile-keyboard-form, permission-priming, onboarding-pages, notification-center, faq-accordion]
density: comfortable
radius: 12
components: [button, input, field, input-otp, drawer, dialog, alert-dialog, sheet, tabs, card, chart, badge, sonner, skeleton, switch, toggle-group, tour]
status: stable
---

## Objetivo
A pessoa sabe quanto tem, para onde foi o dinheiro e consegue pagar ou transferir em segundos, sentindo que está protegida.

## Navegação
- Tab bar: Início, Extrato, Pagar (Pix/boleto), Cartão, Perfil. Ação Pix no centro só se for o uso principal.
- Saldo no topo do Início com olho para esconder (lembrado entre sessões).

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Início | saldo, ações rápidas (Pix, pagar, cobrar), últimos lançamentos, avisos | skeleton-shimmer |
| Extrato | lançamentos agrupados por dia, entrada/saída com sinal e cor + ícone, busca e filtro | — |
| Pix | chave, QR, copia e cola; valor com teclado numérico; revisão com nome e banco do destinatário | bottom-sheet, copy-feedback |
| Confirmação | resumo, autenticação (biometria/senha), comprovante compartilhável | press-spring-button, toast-stack |
| Cartão | fatura, limite, bloquear/desbloquear, cartão virtual | ios-switch, confirm-alert-dialog |

## Regras
- Revisão antes de qualquer movimentação: destinatário (nome mascarado, banco), valor grande, data. Nunca confirmação implícita.
- Valores com `tabular-nums`, sinal explícito (−R$ 50,00) e cor + ícone para entrada/saída.
- Biometria/passkey em vez de senha digitada; OTP com `one-time-code` e colar.
- Bloquear cartão a 1 toque, sem confirmação; desbloquear pede autenticação.
- Comprovante com ID da transação copiável e compartilhamento nativo.
- Golpes: aviso contextual em Pix para chave nova e valor alto ("Primeira vez para esta chave").
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, saldo, Pix e extrato; nunca durante fluxo de pagamento ou autenticação. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Aurora para conta digital consumer; Clean SaaS para fintech B2B (gestão financeira, adquirência).
- **Densidade:** confortável; extrato com linhas de 56–64px.
- **Componentes-chave:** Drawer de revisão, InputOTP, Chart de gastos por categoria, AlertDialog para ações com perda.

## Estados críticos
- Transação em processamento: status claro e push quando concluir.
- Saldo insuficiente: mostrar quanto falta e alternativas (crédito, agendar).
- Dispositivo novo: fluxo de verificação explicado passo a passo.

## Anti-padrões
- Valores ambíguos sem sinal.
- Animações longas antes de mostrar o saldo.
- Termos bancários sem explicação ("TED D+1").

## Referências
- Banco Central, Regulamento Pix e Manual de Padrões para Iniciação do Pix (experiência do usuário): https://www.bcb.gov.br/estabilidadefinanceira/pix
- Apple HIG, Wallet e Apple Pay: https://developer.apple.com/design/human-interface-guidelines/apple-pay
