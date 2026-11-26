"use client";

import { Drawer } from "vaul";
import { SHEET_SCROLL, SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { Icon } from "@/components/ui/Icon";

/** Explicação detalhada de cada mensagem, para a tela de Mensagens ficar só com o essencial. */
const TOPICS = [
  {
    title: "Ao agendar",
    text: "Sai assim que você cria o agendamento e não pede resposta.",
  },
  {
    title: "1º aviso",
    text: "Pede para a cliente confirmar o horário. As opções 1, 2 e 3 vão sempre no fim: é por elas que o app entende a resposta. Com os dois avisos desligados, ela recebe só a mensagem do agendamento.",
  },
  {
    title: "2º aviso",
    text: "Lembrete perto do horário. Quem ainda não confirmou recebe as opções 1, 2 e 3; quem já confirmou recebe sem elas.",
  },
  {
    title: "Ao remarcar",
    text: "Sai quando você muda o dia ou o horário (no arraste, depois do Desfazer), com o mesmo link da agenda, que atualiza o horário salvo. Se o horário novo já estiver na hora do 1º aviso, ele vale como o 1º aviso.",
  },
  {
    title: "Ao cancelar",
    text: "Sai quando você cancela com “Avisar a cliente” ligado, depois do Desfazer. Se o que ela pagou virar crédito, uma linha avisa o valor.",
  },
  {
    title: "Sessão do pacote",
    text: "Quando o horário usa um pacote, a confirmação e os avisos ganham uma linha curta no fim, sem valores.",
  },
  {
    title: "Leitura das respostas",
    text: "A IA lê o que a cliente responde ao aviso, entende se ela confirmou, quer cancelar ou remarcar, e avisa você. Cancelar, remarcar e qualquer dúvida ficam com você, e a cliente recebe um aviso de que você continua a conversa.",
  },
] as const;

const NOTES = [
  "{nome} segue a escolha de “Como chamar a cliente”: só o primeiro nome ou o nome do contato.",
  "{valor} só aparece se estiver no texto.",
  "{endereco} e {mapa} usam o endereço do Meu perfil; sem endereço, somem da mensagem.",
] as const;

export function MessagesHowItWorks() {
  const side = useSheetSide();
  return (
    <Drawer.Root direction={side} repositionInputs={false}>
      <Drawer.Trigger className="inline-flex min-h-11 items-center gap-1.5 justify-self-start rounded-full px-3 text-sm font-bold text-primary-text">
        <Icon name="compass" size={16} />
        Como funciona
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Drawer.Content
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto max-h-[min(86dvh,calc(100dvh-env(safe-area-inset-top)-28px))] max-w-[520px] rounded-t-3xl pt-4 outline-none",
            "sheet z-50 flex flex-col",
          )}
        >
          <SidePanelClose />
          <div className={SHEET_SCROLL}>
            <Drawer.Title className="pb-1 text-xl font-bold">Como funciona</Drawer.Title>
            <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
              O Bubbly manda tudo sozinho pelo WhatsApp. Cancelar ou remarcar fica com você.
            </Drawer.Description>
            <ul className="grid gap-2 pb-4">
              {TOPICS.map((t) => (
                <li key={t.title} className="rounded-2xl bg-surface px-4 py-3">
                  <span className="block font-bold">{t.title}</span>
                  <span className="block text-sm font-semibold text-muted">{t.text}</span>
                </li>
              ))}
            </ul>
            <ul className="grid gap-1.5 rounded-2xl bg-soft px-4 py-3">
              {NOTES.map((n) => (
                <li key={n} className="flex gap-2 text-sm font-semibold">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
