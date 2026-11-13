---
id: time-slot-picker
title: Agenda de horários disponíveis
category: form
summary: Escolha de dia numa faixa de datas roláveis e de horário em grade por período (manhã, tarde, noite), com horários esgotados visíveis, fuso explícito e resumo fixo antes de confirmar.
themes: [clean-saas, aurora, editorial, playful]
products: [health, booking, field-service, edtech, saas, crm, realestate]
motion: low
tech: css-js
deps: []
a11y: Dias e horários são grupos de rádio nativos (fieldset/legend + input radio), então setas, Tab e leitor de tela funcionam sem ARIA extra. Horário indisponível fica disabled com texto "esgotado", não só riscado. O resumo é um status polite. Alvos de 44px.
perf: Só CSS e um render de lista por dia escolhido; disponibilidade viria de uma chamada por semana, com cache.
reference_name: Calendly e Doctoralia (agendamento) e GOV.UK (Dates)
reference_url: https://design-system.service.gov.uk/patterns/dates/
react: RadioGroup do @webcode (Radix) para dias e horários; dados de disponibilidade por semana via fetch com SWR/React Query. Sempre reconfirme o horário no servidor ao enviar (concorrência).
status: stable
---

## Quando usar
- Agendamento de consulta, aula, visita técnica, reserva de mesa ou demonstração.
- Quando a pessoa escolhe entre horários já calculados pelo sistema (não digita hora livre).

## Evite
- Calendário mensal inteiro quando só os próximos 7 a 14 dias importam.
- Esconder horários esgotados: mostrar que acabou cria urgência honesta e evita "não tem nada?".
- Confirmar sem resumo (profissional, dia, hora, local, preço).

## Implementação
- Faixa de dias com `overflow-x: auto` e `scroll-snap`; cada dia é `label > input[type=radio]` com dia da semana, número e "3 horários".
- Horários agrupados por período com `<fieldset>`; grade `repeat(auto-fill, minmax(84px, 1fr))`.
- Mostre o fuso quando o público não está todo no mesmo ("Horário de Brasília"). Use `Intl.DateTimeFormat('pt-BR')` para datas.
- Resumo fixo no rodapé no mobile com botão Confirmar desabilitado até escolher o horário.
