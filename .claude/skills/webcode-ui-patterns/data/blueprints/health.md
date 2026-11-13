---
id: health
title: Saúde e agendamento
family: Serviços e verticais
summary: Clínica, consultório ou laboratório: agendar, confirmar, lembrar e receber resultados. Público amplo e às vezes fragilizado: clareza e calma acima de tudo.
kpi: Agendamentos concluídos online e taxa de faltas (no-show)
themes: [clean-saas, editorial]
patterns: [glass-sticky-header, bottom-sheet, skeleton-shimmer, toast-stack, empty-state, copy-feedback, confirm-alert-dialog, side-sheet-detail, cpf-cnpj-field, form-error-summary, otp-code-input, skip-link-focus, progress-stepper, connection-status, large-title-collapse, segmented-control, calendar-heatmap, product-tour, auth-sliding-panels, auth-animated-tabs, password-recovery-flow, two-factor-challenge, footer-app-download, file-upload-dropzone, time-slot-picker, chat-thread, faq-accordion]
density: comfortable
radius: 10
components: [button, input, field, select, calendar, toggle-group, radio-group, card, dialog, alert-dialog, drawer, sheet, tabs, badge, sonner, skeleton, avatar, tour]
status: stable
---

## Objetivo
Paciente agenda em menos de 1 minuto pelo celular; a recepção vê a agenda do dia e confirma presenças sem ligar para todo mundo.

## Duas faces
- **Paciente (site/app):** especialidade ou profissional → convênio → data e horário → dados → confirmação com lembrete.
- **Clínica (app):** agenda por profissional e sala, confirmações, encaixes, prontuário restrito.

## Telas-base
| Tela | Conteúdo | Padrões |
| --- | --- | --- |
| Agendar | especialidade, profissional com foto e formação, convênio, próximos horários livres | bottom-sheet |
| Horários | dias com disponibilidade marcada, horários em chips grandes, fuso explícito em teleconsulta | — |
| Confirmação | data, endereço com mapa, preparo do exame, adicionar ao calendário, WhatsApp | copy-feedback |
| Meus agendamentos | próximos, remarcar, cancelar (com prazo), resultados de exames | confirm-alert-dialog |
| Agenda da clínica | grade por profissional, status (confirmado, aguardando, faltou), encaixe | side-sheet-detail, skeleton-shimmer |

## Regras
- Fonte de corpo 16–18px e contraste acima do mínimo; botões grandes. Público mais velho é a regra, não a exceção.
- Mostre os próximos horários livres de cara ("Amanhã, 9h30"); calendário completo é a segunda opção.
- Convênio antes do horário quando muda disponibilidade ou preço.
- Lembrete por WhatsApp 24h antes com confirmar/remarcar em um toque.
- Dados de saúde são sensíveis (LGPD art. 11): explique o uso, peça o mínimo, sessão expira em telas de resultado.
- Linguagem humana: "Seu exame está pronto", não "Laudo liberado".
- Primeiro acesso (opcional por projeto): tour guiado `product-tour` / `@webcode/tour`, agenda, próximo atendimento e prontuário; nunca por cima de dados clínicos abertos. Abre uma vez, Pular sempre visível, reabre pelo menu de ajuda.

## Recomendações
- **Tema:** Clean SaaS com acento calmo (verde/azul) ou Editorial para clínicas premium.
- **Densidade:** confortável para o paciente; compacta na agenda da recepção.
- **Componentes-chave:** Calendar, ToggleGroup de horários, Field com máscara de CPF/telefone, Drawer no mobile.

## Estados críticos
- Sem horários no período: oferece lista de espera e outro profissional.
- Cancelamento fora do prazo: explica a regra antes de cancelar.
- Resultado que exige conversa com o médico: não exibir valores críticos sem orientação.

## Anti-padrões
- Cadastro completo antes de mostrar horários.
- Calendário minúsculo como única forma de escolher.
- Linguagem técnica e siglas.

## Referências
- GOV.UK Design System, padrões de serviço: https://design-system.service.gov.uk/patterns/
- NHS digital service manual (saúde pública, padrões de conteúdo): https://service-manual.nhs.uk/
