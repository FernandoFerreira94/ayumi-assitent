/**
 * Traços dos ícones das telas, iguais no leque e no menu do avatar: a mesma tela tem o mesmo desenho
 * em qualquer lugar. Cada nav embrulha no próprio <svg> (tamanho e espessura dele).
 */
export const NAV_ICONS = {
  painel: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2.5" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="11" width="8" height="10" rx="2.5" />
      <rect x="3" y="14" width="8" height="7" rx="2" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  servicos: (
    <>
      <path d="M6 3l12 12M18 3L6 15" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
    </>
  ),
  clientes: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
    </>
  ),
  financeiro: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9h9" />
    </>
  ),
  vagas: (
    <>
      <path d="M12 7v5l3 2" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  pendencias: (
    <>
      <path d="M9 12l2 2 4-4" />
      <rect x="4" y="3" width="16" height="18" rx="3" />
    </>
  ),
  ajustes: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="2.5" />
      <circle cx="15" cy="17" r="2.5" />
    </>
  ),
  novo: <path d="M12 5v14M5 12h14" />,
};
