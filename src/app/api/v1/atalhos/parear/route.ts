import { connection } from "next/server";
import { handlePairing } from "@/features/atalhos/server";

/** Atalho "Bubbly": troca o código de pareamento (corpo do POST, nunca na URL) pela chave só de leitura. */
export async function POST(req: Request) {
  await connection();
  return handlePairing(req);
}
