import type { Metadata } from "next";
import { LegalPage, LegalSection, SUPPORT_EMAIL } from "@/features/legal/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o bubbly coleta, usa, guarda e protege os seus dados e os das suas clientes.",
};

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      intro={
        <p>
          O <strong>bubbly</strong> é um app de agenda para salões, estúdios e profissionais de beleza, desenvolvido e
          operado pela <strong>WebCode</strong>. Aqui explicamos, em linguagem simples, quais dados usamos, para quê e
          quais são os seus direitos pela Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
        </p>
      }
    >
      <LegalSection n={1} title="Quem é quem">
        <p>
          Você, profissional que usa o bubbly, é quem decide quais dados das suas clientes entram no app (no papel de
          <strong> controladora</strong> desses dados). A WebCode trata esses dados só para fazer o app funcionar para
          você (no papel de <strong>operadora</strong>). Para os dados da sua própria conta, a WebCode é a controladora.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Quais dados usamos">
        <ul>
          <li>
            <strong>Sua conta:</strong> nome, e-mail, foto do perfil do Google (se entrar com Google), nome do salão,
            telefone comercial, segmentos e preferências do app.
          </li>
          <li>
            <strong>Suas clientes:</strong> nome, telefone, e-mail (opcional) e observações que você mesma escrever.
          </li>
          <li>
            <strong>Agenda e serviços:</strong> agendamentos, serviços, valores, descontos, despesas, horários de
            atendimento, pausas e bloqueios.
          </li>
          <li>
            <strong>Mensagens do WhatsApp:</strong> as mensagens trocadas entre o número do salão e as clientes sobre
            agendamentos e lembretes.
          </li>
          <li>
            <strong>Avisos no celular:</strong> o endereço técnico de notificação do seu aparelho e, se você ligar a
            previsão do tempo, a localização aproximada do celular.
          </li>
          <li>
            <strong>Dados técnicos:</strong> registros de acesso e de erros, usados para segurança e para corrigir
            problemas.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Para que usamos">
        <ul>
          <li>Montar a sua agenda, os horários livres e o resumo financeiro.</li>
          <li>Enviar pelo WhatsApp a confirmação do agendamento e os lembretes para as clientes.</li>
          <li>Entender a resposta da cliente (confirmou, pediu para remarcar ou cancelar) e avisar você.</li>
          <li>Mandar avisos no seu celular (confirmações, pedidos das clientes, resumo do dia).</li>
          <li>Manter o app seguro, funcionando e fazer cópias de segurança.</li>
        </ul>
        <p>
          <strong>Não vendemos, não alugamos e não usamos seus dados para publicidade.</strong> Não fazemos perfil de
          consumo das suas clientes.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Google (login, Agenda e Contatos)">
        <p>Se você escolher entrar ou conectar sua conta Google, o bubbly pede só o necessário:</p>
        <ul>
          <li>
            <strong>Login:</strong> nome, e-mail e foto, para criar e identificar a sua conta.
          </li>
          <li>
            <strong>Google Agenda</strong> (<code className="text-sm">calendar</code>): criar, atualizar e apagar no seu
            Google Agenda os eventos dos agendamentos feitos no bubbly (a cliente com e-mail recebe o convite), e ler
            os seus outros eventos só para marcar esses horários como ocupados.
          </li>
          <li>
            <strong>Google Contatos</strong> (<code className="text-sm">contacts.readonly</code>): só leitura de nome,
            telefone e e-mail, quando você toca em importar clientes. Só os contatos que você marcar são salvos.
          </li>
        </ul>
        <p>
          O uso e a transferência, para qualquer outro aplicativo, de informações recebidas das APIs do Google seguem a{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
            Política de Dados do Usuário dos Serviços de API do Google
          </a>
          , incluindo os requisitos de Uso Limitado. Em resumo: os dados do Google são usados só para as funções acima,
          não são vendidos, não são usados para anúncios, não são usados para treinar modelos de inteligência
          artificial e nenhuma pessoa os lê, a não ser com a sua autorização, para suporte, por segurança ou por
          exigência legal.
        </p>
        <p>
          Você pode desconectar o Google em <strong>Ajustes &gt; Conexões</strong> ou revogar o acesso em{" "}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
            myaccount.google.com/permissions
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection n={5} title="Com quem os dados passam">
        <p>Só com serviços que o app precisa para funcionar, todos com contrato e medidas de segurança:</p>
        <ul>
          <li>
            <strong>Railway:</strong> hospedagem do app, do banco de dados e das cópias de segurança.
          </li>
          <li>
            <strong>WhatsApp (via Evolution API):</strong> envio e recebimento das mensagens pelo número que você
            conectar.
          </li>
          <li>
            <strong>Anthropic (Claude):</strong> inteligência artificial que lê o texto da resposta da cliente para
            entender o pedido e escreve avisos. O texto não é usado para treinar o modelo.
          </li>
          <li>
            <strong>Google:</strong> login, Agenda e Contatos, só se você conectar.
          </li>
          <li>
            <strong>Open-Meteo:</strong> recebe só a localização aproximada para a previsão do tempo, sem nome nem
            e-mail.
          </li>
          <li>
            <strong>Sentry:</strong> registros técnicos de erro.
          </li>
          <li>Autoridades, apenas quando a lei exigir.</li>
        </ul>
        <p>
          Alguns desses serviços ficam fora do Brasil. Nesses casos a transferência segue as regras da LGPD (art. 33).
        </p>
      </LegalSection>

      <LegalSection n={6} title="Bases legais">
        <p>
          Tratamos os dados para executar o contrato de uso do app (art. 7º, V), cumprir obrigações legais (art. 7º, II)
          e por legítimo interesse em manter o serviço seguro (art. 7º, IX). A previsão do tempo e as notificações só
          funcionam com o seu consentimento, que você pode retirar a qualquer momento nos Ajustes.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Por quanto tempo guardamos">
        <ul>
          <li>Enquanto a sua conta estiver ativa.</li>
          <li>
            Depois de um pedido de exclusão, apagamos os dados em até 30 dias. As cópias de segurança são substituídas
            automaticamente em até 14 dias.
          </li>
          <li>Registros de acesso ficam guardados por 6 meses, como pede o Marco Civil da Internet.</li>
        </ul>
      </LegalSection>

      <LegalSection n={8} title="Como protegemos">
        <ul>
          <li>Conexão sempre criptografada (HTTPS).</li>
          <li>Os dados de cada salão ficam isolados no banco: um salão nunca vê os dados de outro.</li>
          <li>Acesso só com login, senha guardada com criptografia e chaves de acesso fora do código.</li>
        </ul>
      </LegalSection>

      <LegalSection n={9} title="Seus direitos (LGPD)">
        <p>Você e as suas clientes podem pedir, a qualquer momento e sem custo:</p>
        <ul>
          <li>Confirmar se tratamos seus dados e ter acesso a eles.</li>
          <li>Corrigir dados errados ou desatualizados.</li>
          <li>Receber uma cópia dos dados (portabilidade).</li>
          <li>Apagar os dados, anonimizar ou bloquear o que não for necessário.</li>
          <li>Saber com quem os dados foram compartilhados.</li>
          <li>Retirar o consentimento.</li>
        </ul>
        <p>
          Peça pelo e-mail <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Respondemos em até 15 dias. Se a
          cliente de um salão nos procurar, avisamos o salão e ajudamos a atender o pedido.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Excluir a conta e os dados">
        <p>
          Envie um e-mail para <a href={`mailto:${SUPPORT_EMAIL}?subject=Excluir%20minha%20conta`}>{SUPPORT_EMAIL}</a>{" "}
          com o assunto <strong>Excluir minha conta</strong>, a partir do e-mail cadastrado. Apagamos a conta, as
          clientes, a agenda, as mensagens e os acessos ao Google e ao WhatsApp em até 30 dias, e confirmamos por e-mail.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Crianças">
        <p>O bubbly é feito para profissionais maiores de 18 anos e não é direcionado a crianças.</p>
      </LegalSection>

      <LegalSection n={12} title="Mudanças nesta política">
        <p>
          Se esta política mudar, a data no topo é atualizada e, se a mudança for importante, avisamos dentro do app.
        </p>
      </LegalSection>

      <LegalSection n={13} title="Contato">
        <p>
          WebCode, responsável pelo bubbly. Encarregado de dados (DPO) e suporte:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
