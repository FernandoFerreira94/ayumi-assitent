/** Dúvidas comuns da tela Ajuda e suporte (links para a seção que resolve). */
export const FAQ: { q: string; a: string; href?: string; link?: string }[] = [
  {
    q: "Os lembretes não chegaram para a cliente",
    a: "Confira se o WhatsApp está conectado e se os avisos estão ligados em Mensagens para a cliente.",
    href: "/ajustes/whatsapp",
    link: "Ver WhatsApp",
  },
  {
    q: "Não recebo as notificações no celular",
    a: "Ligue a Notificação neste aparelho. No iPhone, o app precisa estar na tela de início.",
    href: "/ajustes/notificacoes",
    link: "Ver Notificações",
  },
  {
    q: "Meus agendamentos não aparecem no Google ou no iPhone",
    a: "Conecte o Google ou ligue o calendário do iPhone em Calendários.",
    href: "/ajustes/calendarios",
    link: "Ver Calendários",
  },
  {
    q: "Como divulgo meus horários livres?",
    a: "Em Vagas você escolhe os dias e copia um texto pronto para o WhatsApp ou o status.",
    href: "/vagas",
    link: "Abrir Vagas",
  },
];
