import { finishNativeLink } from "@/features/native/handoff";

// Volta do Google depois de ligar a agenda pelo app da loja: devolve ao app
export function GET(req: Request) {
  return finishNativeLink(req);
}
