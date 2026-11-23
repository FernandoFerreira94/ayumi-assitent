# Perfil, Ajustes e casca do app

**Finalidade:** Meu perfil (dados do salão e da pessoa, segmentos, mascote/tema, endereço do estúdio) e Ajustes. Desde 13/11/2026 Ajustes é uma **lista de partida** no estilo dos Ajustes do iPhone (`/ajustes`): cada linha mostra o estado (Conectado, Desligada, "Seg a Sex") e, quando falta algo, um selo amarelo ("Conectar", "Configurar"); o toque abre a seção, que carrega só os dados dela. "Este aparelho" (atualizar, instalar, rever o tour) fica na própria lista.

## Arquivos
- `features/salon/actions.ts` (`saveSalon`, `saveAiSettings`; grava `tenants` pelo dono do banco, o papel do app só lê), `schema.ts` (segmentos), `SalonForm.tsx`, `AiRepliesForm.tsx`, `MascotPicker.tsx` + `mascot-actions.ts` (mascote por pessoa, vale em qualquer aparelho).
- `features/settings/*`: `sections.ts` (seções, `legacyTarget` para âncoras antigas `/ajustes#x`, `hoursSummary`), `SettingsList.tsx` (`SettingsGroup`/`SettingsRow`, linha com `id="ajuste-<secao>"`), `ConnectionsAccordion.tsx`, `connection-bodies.tsx`, `connection-status.ts`, `StatusBadge.tsx`, `use-live-lines.ts`, `live-events.ts`, `LegacyHashRedirect.tsx`, `SectionSkeleton.tsx`.
- `features/tour/*`: tour do primeiro acesso, **todo em Ajustes** e só depois da entrada: Oi, WhatsApp (`#ajuste-whatsapp`), Mensagens (`#ajuste-mensagens`) e fim (4 passos). `TourGate`, `ReplayTourButton`, `actions.finishTour`.
- `features/onboarding/*`: **entrada de primeiro acesso** em `/primeiro-acesso` (Horários → Avisos → Agenda → Localização → Tudo pronto). `steps.ts`/`hours.ts` são puros (ordem, pulo, resumo; `tests/unit/onboarding-*`); `EntryFlow.tsx` junta as telas e reusa `saveWorkingHours`, `push/enable.ts`, `owner-notices/enable-location.ts`, `linkSocial` do Google e o `IphoneCalendarCard`. Marcador `memberships.onboarding_done_at` (migration 0051); pendente = esse campo e `tour_done_at` nulos. O layout `(app)` redireciona quem está pendente.
- `features/install/*`: guia de instalar o PWA por sistema. `components/nav/AutoUpdate.tsx` (16/11: atualiza SOZINHO, sem banner nem diálogo; confere `api/version` ao abrir e ao voltar ao app, nunca por intervalo; só recarrega se `isBusy()` for falso, sem dialog/sheet aberto nem campo em foco; trava de laço por versão em sessionStorage; depois mostra só o toast "App atualizado") + `lib/update-check.ts` + `features/update/UpdateButton.tsx` (manual em Ajustes) + `api/version`. O diálogo "App atualizado"/changelog foi removido.
- `features/shell/status.ts`: estado da casca (WhatsApp/Google/pendências) para nav e Ajustes.
- Telas: `app/(app)/perfil`, `app/(app)/ajustes` (lista) e as seções abaixo (`PageShell back backHref="/ajustes"`: aberta direto, a seta volta para a lista).

## Seções de Ajustes e de onde vêm
| Rota | Cartões | Módulo |
|---|---|---|
| `/ajustes/whatsapp` | WhatsApp (`#whatsapp`) | [whatsapp.md](whatsapp.md) |
| `/ajustes/calendarios` | Google (`#google`, `?google=erro`), Calendário do iPhone (`#iphone`) | [google.md](google.md), [calendario-iphone.md](calendario-iphone.md) |
| `/ajustes/notificacoes` | Notificação (`#avisos-celular`), localização (`#localizacao`) | [avisos-push.md](avisos-push.md) |
| `/ajustes/mensagens` | Mensagens (`#mensagens`), IA (`#ia`) | [lembretes.md](lembretes.md), `salon/AiRepliesForm` |
| `/ajustes/expediente` | Expediente (`#expediente`) | [vagas.md](vagas.md) |
| `/perfil#endereco` (atalho; `/ajustes/endereco` redireciona) | Endereço do estúdio (`#endereco`) | `salon/AddressCard` |

Links internos apontam direto para a seção (`/ajustes/whatsapp`, `/ajustes/calendarios`). Link velho `/ajustes#google` é redirecionado no cliente (`LegacyHashRedirect`). Actions revalidam com `revalidatePath("/ajustes", "layout")` (lista + seções).

## Dados
- `tenants` (nome curto/completo, segmentos, IA, templates, localização), `memberships` (papel e mascote da pessoa).

## Cuidados
- Seção nova: entrada em `settings/sections.ts` (+ âncora em `LEGACY_HASH` se substituir algo), linha na lista, `loading.tsx`, passo no `tour/steps.ts` e teste em `tests/e2e/ajustes.spec.ts`.
- Ações continuam em sheet/diálogo **dentro** da seção; seção nova é só para organizar assunto, nunca para uma ação.
- O webhook do WhatsApp não é religado no render: `WhatsAppCard` chama `whatsappStatus` uma vez ao abrir conectado.
- Ícone da tela de início e login são sempre da Bolha; o mascote escolhido troca cores e splash, não o ícone.
- Testes: `tests/e2e/ajustes.spec.ts`, `tour.spec.ts`, `install.spec.ts`, `shell.spec.ts`; unit `settings-sections`, `tour`, `salon-profile`, `install-platform`, `update-check`.

## LGPD em Meu perfil (13/11)
- **Baixar meus dados** (`salon/ExportDataButton` → `actions.exportMyData`): 3 CSV (clientes, agendamentos, despesas), `;` + BOM para o Excel; `salon/export-csv.toCsv`.
- **Excluir minha conta** (`salon/DeleteAccountSheet` → `actions.deleteAccount` → `delete-account.deleteAccountData`): digitar EXCLUIR; revoga Google (`google/server.revokeGoogleOfUser`), logout + `admin.remove` da instância Evolution, apaga `tenants` do dono (cascata) e o `user` (cascata em sessões/contas/vínculos). Teste `tests/db/delete-account.test.ts`.

## Ajustes no desktop (18/11)
- `ajustes/layout.tsx`: no tablet/desktop (`userAgent`, celular não consulta) monta `SettingsNav`, a coluna de seções à esquerda (`lg`), com estado e selo de cada seção e a atual marcada (`aria-current`). Em `/ajustes` a coluna some, porque a página já é a lista; lá o `lg` põe "Este aparelho" à direita.
- Os resumos vêm de `settings/summary.tsx` (`loadSettingsSummary`, com `cache`), usados pela lista e pela coluna. Ids `#ajuste-*` do tour só existem na lista de `/ajustes`.

## Conexões em acordeão (18/11)
- Em `/ajustes` (celular e desktop) o grupo **Conexões** (WhatsApp, Calendários, Notificações) é um acordeão (`ConnectionsAccordion`): a seta gira para baixo e o cartão de conectar abre ali mesmo, um por vez. O cartão só monta na 1ª abertura (o WhatsApp não é consultado antes). Botão da linha mantém `id="ajuste-<secao>"` (tour); painel `#conexao-<secao>`.
- O miolo de cada conexão mora em `connection-bodies.tsx` (`WhatsAppBody`, `CalendarsBody`, `NotificationsBody`), usado pelo acordeão e pelas telas `/ajustes/<secao>` (que continuam para links diretos, `?google=erro` e a coluna do desktop).
- Selo por linha (`connection-status.ts`): verde = ligado, âmbar = pede ação, cinza = opcional desligado; resumo "X de 3 ativas · N pede(m) atenção". Notificação junta push DESTE aparelho (`push/use-push-state.ts`) + localização do salão (`locationSource === "device"`); resolvida no cliente por `useLiveLines`. `PushToggle`/`NativePushToggle`/`LocationToggle` emitem eventos de janela (`live-events.ts`) e o selo acompanha sem recarregar. A Siri saiu de Ajustes em 23/11 (só no app nativo, sem ligar/desligar); `/ajustes/siri` redireciona para `/ajustes` (`next.config.ts`).
- Ponto âmbar no avatar e em Ajustes (`AppMenu`, `SideNav` `attention`) quando o WhatsApp caiu. Cartões dentro do acordeão ficam planos (`.conexao-corpo` no `globals.css`).
- Testes: `tests/unit/connection-status.test.ts`, `app-menu.test.tsx`; e2e `ajustes.spec.ts` e `largura.spec.ts`.

## Endereço do estúdio (23/11)
- Mora no **Meu perfil** (`/perfil#endereco`, depois dos dados do salão), pedido do usuário em 23/11. Ajustes mantém só a linha de atalho (grupo "Clientes e agenda"; selo "Cadastrar" sem endereço) que leva ao Perfil; `/ajustes/endereco` redireciona (`next.config.ts`). Não confundir com a localização do GPS (Ajustes > Notificações), que é só para clima/feriados. `salon/AddressCard.tsx` mostra a linha pronta + "Ver no mapa" e edita num sheet (vaul): CEP → `address-actions.lookupCep` busca no ViaCEP e, se falhar, na BrasilAPI, **pelo servidor** (timeout 4s cada, só logado; falhou = preenche à mão), depois rua, número, complemento, bairro, cidade, UF. `saveAddress` valida com `salon/address.addressInput` e grava pelo dono do banco.
- Colunas `tenants.address_cep/street/number/complement/district/city/state` (migration 0054) + `tenants.address` = linha pronta (`formatAddress`). A 0054 copiou `city/state` (localização dos avisos do dia) para `address_city/state`; `city/state/latitude/longitude` continuam só para previsão do tempo e feriados.
- Quem usa `tenants.address`: convite da cliente (`calendar-feed/invite.ts`, LOCATION do .ics), evento do Google (`google/sync.ts`, `location`) e as chaves `{endereco}`/`{mapa}` das mensagens (`reminders/text.ts`; sem endereço, a linha só com a chave some).
- `saveAddress` revalida `/perfil` e o layout de `/ajustes`.
- Testes: unit `studio-address`, `booking-text`, `settings-sections`; e2e `endereco.spec.ts`, acessibilidade de `/perfil` em `ajustes.spec.ts`.
