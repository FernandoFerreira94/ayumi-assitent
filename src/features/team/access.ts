import type { Role } from "./permissions";

/**
 * Telas que cada papel enxerga. Função pura: o menu esconde o item e a página redireciona.
 * Profissional (D5): sem Financeiro do salão (o "só o próprio faturamento" exigiria filtrar por profissional na
 * tela; por ora a tela inteira fica escondida), sem WhatsApp, Mensagens e Equipe. Serviços abre só para ver.
 */
const HIDDEN_FOR_PROFESSIONAL = ["/financeiro", "/ajustes/whatsapp", "/ajustes/mensagens", "/ajustes/equipe"] as const;

/** Caminho (ou filho dele) que o papel não abre. */
export function canOpenPath(role: Role, pathname: string): boolean {
  if (role !== "professional") return true;
  return !HIDDEN_FOR_PROFESSIONAL.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Serviços: dona e gerente editam; profissional só visualiza. */
export const canEditServices = (role: Role) => role === "owner" || role === "admin";
