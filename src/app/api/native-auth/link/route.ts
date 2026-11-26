import { openNativeLink } from "@/features/native/handoff";

// Ligar o Google Agenda no app da loja, no navegador do sistema (ver features/native/handoff-core.ts)
export function GET(req: Request) {
  return openNativeLink(req);
}
