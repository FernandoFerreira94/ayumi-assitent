import { exchangeNativeCode } from "@/features/native/handoff";

// Login do Google do app da loja: a WebView troca o código de volta + segredo pela sessão
export function POST(req: Request) {
  return exchangeNativeCode(req);
}
