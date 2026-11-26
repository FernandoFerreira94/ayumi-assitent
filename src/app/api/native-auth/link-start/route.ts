import { startNativeLink } from "@/features/native/handoff";

// Ligar o Google Agenda no app da loja: a WebView pede o token que o navegador do sistema vai usar
export function POST(req: Request) {
  return startNativeLink(req);
}
