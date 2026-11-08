import { connection } from "next/server";

// Versão em produção. O app aberto compara com a sua própria e se atualiza quando muda.
export async function GET() {
  await connection();
  return Response.json({ build: process.env.NEXT_PUBLIC_BUILD_ID ?? "" }, { headers: { "cache-control": "no-store" } });
}
