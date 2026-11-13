# Perfil, Ajustes e casca do app

**Finalidade:** Meu perfil (dados do salão e da pessoa, segmentos, mascote/tema) e Ajustes. Desde 13/11/2026 Ajustes é uma **lista de partida** no estilo dos Ajustes do iPhone (`/ajustes`): cada linha mostra o estado (Conectado, Desligada, "Seg a Sex") e, quando falta algo, um selo amarelo ("Conectar", "Configurar"); o toque abre a seção, que carrega só os dados dela. "Este aparelho" (atualizar, instalar, rever o tour) fica na própria lista.

## Arquivos
- `features/salon/actions.ts` (`saveSalon`, `saveAiSettings`; grava `tenants` pelo dono do banco, o papel do app só lê), `schema.ts` (segmentos), `SalonForm.tsx`, `AiRepliesForm.tsx`, `MascotPicker.tsx` + `mascot-actions.ts` (mascote por pessoa, vale em qualquer aparelho).
- `features/settings/*`: `sections.ts` (seções, `legacyTarget` para âncoras antigas `/ajustes#x`, `hoursSummary`), `SettingsList.tsx` (`SettingsGroup`/`SettingsRow`, linha com `id="ajuste-<secao>"`), `LegacyHashRedirect.tsx`, `PushStatusText.tsx`, `SectionSkeleton.tsx`.
- `features/tour/*`: tour obrigatório do primeiro acesso, **todo em Ajustes**: saudação e depois cada linha (`#ajuste-whatsapp` … `#ajuste-expediente`), instalar (opcional) e fim. `TourGate`, `ReplayTourButton`, `actions.finishTour`.
- `features/install/*`: guia de instalar o PWA por sistema. `features/update/UpdateButton.tsx` (só "Verificar atualização"; ao atualizar abre o Painel) + `WhatsNewDialog.tsx` (abre só no Painel, lista as versões não vistas pelo aparelho em accordions fechados, `unseenReleases`) + `changelog.ts` + `components/nav/UpdateBanner.tsx` + `api/version`.
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

Links internos apontam direto para a seção (`/ajustes/whatsapp`, `/ajustes/calendarios`). Link velho `/ajustes#google` é redirecionado no cliente (`LegacyHashRedirect`). Actions revalidam com `revalidatePath("/ajustes", "layout")` (lista + seções).

## Dados
- `tenants` (nome curto/completo, segmentos, IA, templates, localização), `memberships` (papel e mascote da pessoa).

## Cuidados
- Seção nova: entrada em `settings/sections.ts` (+ âncora em `LEGACY_HASH` se substituir algo), linha na lista, `loading.tsx`, passo no `tour/steps.ts` e teste em `tests/e2e/ajustes.spec.ts`.
- Ações continuam em sheet/diálogo **dentro** da seção; seção nova é só para organizar assunto, nunca para uma ação.
- O webhook do WhatsApp não é religado no render: `WhatsAppCard` chama `whatsappStatus` uma vez ao abrir conectado.
- Ícone da tela de início e login são sempre da Bolha; o mascote escolhido troca cores e splash, não o ícone.
- Testes: `tests/e2e/ajustes.spec.ts`, `tour.spec.ts`, `install.spec.ts`, `shell.spec.ts`; unit `settings-sections`, `changelog`, `tour`, `salon-profile`, `install-platform`, `update-check`.
