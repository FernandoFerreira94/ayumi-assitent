import type { Metadata } from "next";
import { shareMeta } from "@/lib/share-meta";
import Link from "next/link";
import { LegalPage, LegalSection, SUPPORT_EMAIL } from "@/features/legal/LegalPage";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Regras de uso do bubbly, app de agenda para salões e profissionais de beleza.",
  ...shareMeta("Termos de uso · bubbly", "Regras de uso do bubbly, app de agenda para salões e profissionais de beleza.", "/termos"),
};

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      intro={
        <p>
          Estes termos valem para quem usa o <strong>bubbly</strong>, app de agenda, clientes e lembretes para salões,
          estúdios e profissionais de beleza, desenvolvido e operado pela <strong>WebCode</strong>. Ao criar a conta ou
          usar o app, você concorda com eles e com a{" "}
          <Link href="/privacidade" className="font-bold text-primary-text">
            Política de privacidade
          </Link>
          .
        </p>
      }
    >
      <LegalSection n={1} title="O que o bubbly faz">
        <ul>
          <li>Organiza agenda, clientes, serviços, horários livres e financeiro do salão.</li>
          <li>Envia confirmações e lembretes pelo WhatsApp do número que você conectar.</li>
          <li>Usa inteligência artificial para entender respostas das clientes e sugerir ações.</li>
          <li>Sincroniza com o Google Agenda e importa contatos, se você conectar o Google.</li>
          <li>Manda avisos no seu celular.</li>
        </ul>
      </LegalSection>

      <LegalSection n={2} title="Sua conta">
        <ul>
          <li>Você precisa ter 18 anos ou mais e usar o app para a sua atividade profissional.</li>
          <li>Mantenha seu login e sua senha em segredo. O que for feito na sua conta é responsabilidade sua.</li>
          <li>Informe dados verdadeiros e mantenha-os atualizados.</li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Dados das suas clientes">
        <p>
          Você decide quem cadastra e o que escreve sobre cada cliente. Por isso, cabe a você ter uma base legal para
          isso (por exemplo, o atendimento que a cliente pediu), informar a cliente quando necessário e atender os
          pedidos dela previstos na LGPD. A WebCode ajuda no que for preciso pelo e-mail de suporte.
        </p>
        <p>
          Nesse papel, você é a <strong>controladora</strong> dos dados das suas clientes e a WebCode é a{" "}
          <strong>operadora</strong>: tratamos esses dados só para o app funcionar para você, seguindo as suas
          instruções e a Política de privacidade, sem usar para outro fim. Você também se compromete a avisar as
          clientes de que elas recebem mensagens automáticas do salão pelo WhatsApp e de que podem parar a qualquer
          momento respondendo <strong>SAIR</strong>.
        </p>
      </LegalSection>

      <LegalSection n={4} title="WhatsApp">
        <ul>
          <li>
            A conexão é feita com o número que você escolher. Siga os termos e as políticas do WhatsApp, que é um
            serviço de terceiros.
          </li>
          <li>
            O bubbly se conecta ao WhatsApp por uma <strong>integração não oficial</strong> (não é a API oficial da
            Meta). O WhatsApp pode desconectar a sessão a qualquer momento; nesse caso, é só conectar de novo em Ajustes.
          </li>
          <li>Use o envio só para clientes que você atende, nunca para propaganda em massa ou spam.</li>
          <li>
            O WhatsApp pode limitar ou bloquear números por decisão própria. A WebCode não controla isso e não responde
            por bloqueios ou mensagens que não chegarem.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={5} title="Inteligência artificial">
        <p>
          A leitura das respostas das clientes e alguns textos do app são feitos por inteligência artificial e podem
          errar. Confira os agendamentos importantes. A decisão final sobre remarcar, cancelar ou confirmar é sempre sua.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Uso proibido">
        <ul>
          <li>Enviar spam, conteúdo ofensivo, enganoso ou ilegal.</li>
          <li>Tentar acessar dados de outros salões, atacar ou sobrecarregar o app.</li>
          <li>Copiar, revender ou fazer engenharia reversa do app.</li>
        </ul>
        <p>Nesses casos a conta pode ser suspensa ou encerrada.</p>
      </LegalSection>

      <LegalSection n={7} title="Disponibilidade">
        <p>
          Trabalhamos para o app ficar sempre no ar, mas pode haver pausas para manutenção ou falhas de serviços de
          terceiros (hospedagem, WhatsApp, Google). O app é fornecido como está, e novas funções podem entrar, mudar ou
          sair com o tempo.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Responsabilidade">
        <p>
          Na medida permitida pela lei, a WebCode não responde por perdas indiretas, como faltas de clientes, lucros
          que deixaram de entrar ou mensagens não entregues por falha de terceiros. Nada aqui afasta direitos que a lei
          garante a você.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Propriedade">
        <p>
          O app, a marca bubbly, o mascote e o código são da WebCode. Os dados que você cadastra continuam sendo seus, e
          você pode pedir uma cópia ou a exclusão a qualquer momento.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Encerrar a conta">
        <p>
          Você pode parar de usar e excluir a conta a qualquer momento em <strong>Meu perfil &gt; Excluir minha
          conta</strong>, ou pelo e-mail{" "}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Excluir%20minha%20conta`}>{SUPPORT_EMAIL}</a>. Os dados são
          apagados como explicado na{" "}
          <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Mudanças e foro">
        <p>
          Estes termos podem mudar. A data no topo é atualizada e mudanças importantes são avisadas no app. Vale a lei
          brasileira, e fica eleito o foro do domicílio do usuário.
        </p>
      </LegalSection>

      <LegalSection n={12} title="Contato">
        <p>
          Suporte: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
