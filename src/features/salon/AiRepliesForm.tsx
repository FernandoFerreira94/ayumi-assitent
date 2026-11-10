import { TileTitle } from "@/components/ui/Icon";

/**
 * A IA por ora só LÊ a resposta da cliente ao aviso e repassa para a profissional. O campo de regras
 * (atendimento, atrasos...) fica oculto até a fase em que a IA também marca e responde.
 */
export function AiRepliesForm() {
  return (
    <div className="glass grid gap-2 rounded-[1.75rem] px-5 py-4">
      <TileTitle as="h2" icon="sparkles" tint="pink">
        Leitura das respostas
      </TileTitle>
      <p className="text-sm font-semibold text-muted">
        A IA lê o que a cliente responde ao aviso, entende se ela confirmou, quer cancelar ou remarcar, e avisa você.
        Cancelar, remarcar e qualquer dúvida ficam com você, e a cliente recebe um aviso de que você continua a
        conversa.
      </p>
    </div>
  );
}
