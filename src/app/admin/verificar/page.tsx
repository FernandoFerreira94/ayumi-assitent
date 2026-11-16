import type { Metadata } from "next";
import { requireAdmin } from "@/features/admin/guard";
import { AdminGateShell } from "@/features/admin/ui/AdminShell";
import { CodeForm } from "@/features/admin/ui/CodeForm";

export const metadata: Metadata = { title: "Confirmar acesso" };

/** Segundo fator ao entrar no painel: vale 12 h nesta sessão. */
export default async function AdminVerifyPage() {
  await requireAdmin({ stepUp: false });
  return (
    <AdminGateShell title="Confirme que é você" subtitle="Digite o código do app autenticador. Vale por 12 horas neste aparelho.">
      <CodeForm />
    </AdminGateShell>
  );
}
