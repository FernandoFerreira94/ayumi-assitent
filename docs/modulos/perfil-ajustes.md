# Perfil, Ajustes e casca do app

**Finalidade:** Meu perfil (dados do salão e da pessoa, segmentos, mascote/tema) e Ajustes (Conexões, Mensagens, IA, expediente, avisos, tour, instalar, atualizar). Ajustes é uma tela que junta cartões de vários módulos.

## Arquivos
- `features/salon/actions.ts` (`saveSalon`, `saveAiSettings`; grava `tenants` pelo dono do banco, o papel do app só lê), `schema.ts` (segmentos), `SalonForm.tsx`, `AiRepliesForm.tsx`, `MascotPicker.tsx` + `mascot-actions.ts` (mascote por pessoa, vale em qualquer aparelho).
- `features/tour/*`: tour obrigatório do primeiro acesso (`steps.ts` passa por Ajustes na ordem dos cartões), `TourGate`, `ReplayTourButton`, `actions.finishTour`.
- `features/install/*`: guia de instalar o PWA por sistema. `features/update/UpdateButton.tsx` + `components/nav/UpdateBanner.tsx` + `api/version`.
- `features/shell/status.ts`: estado da casca (WhatsApp/Google/pendências) para nav e Ajustes.
- Telas: `app/(app)/perfil`, `app/(app)/ajustes`.

## Cartões de Ajustes e de onde vêm
WhatsApp → [whatsapp.md](whatsapp.md) · Google → [google.md](google.md) · Avisos no celular e localização → [avisos-push.md](avisos-push.md) · Mensagens (textos e horas) → [lembretes.md](lembretes.md) · Expediente → [vagas.md](vagas.md) · IA → `salon/AiRepliesForm`.

## Dados
- `tenants` (nome curto/completo, segmentos, IA, templates, localização), `memberships` (papel e mascote da pessoa).

## Cuidados
- Mudou ordem/nome de cartão em Ajustes: atualize `tour/steps.ts` (o tour segue a ordem de Ajustes).
- Ícone da tela de início e login são sempre da Bolha; o mascote escolhido troca cores e splash, não o ícone.
- Testes: `tests/e2e/tour.spec.ts`, `install.spec.ts`, `shell.spec.ts`; unit `tour`, `salon-profile`, `install-platform`, `update-check`.
