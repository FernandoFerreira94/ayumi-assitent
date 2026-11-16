import { startNativeGoogle } from "@/features/native/handoff";

// Login do Google do app da loja, no navegador do sistema (ver features/native/handoff-core.ts)
export function GET(req: Request) {
  return startNativeGoogle(req);
}
