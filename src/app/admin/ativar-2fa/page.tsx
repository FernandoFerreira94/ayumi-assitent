import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdminWithoutTwoFactor } from "@/features/admin/guard";
import { AdminGateShell } from "@/features/admin/ui/AdminShell";
import { TwoFactorSetup } from "@/features/admin/ui/TwoFactorSetup";

export const metadata: Metadata = { title: "Ativar 2FA" };

/** Primeiro acesso ao painel: liga o segundo fator (TOTP + códigos de recuperação). */
export default async function AdminEnable2faPage() {
  const { enabled } = await requireAdminWithoutTwoFactor();
  if (enabled) redirect("/admin/verificar");
  return (
    <AdminGateShell title="Proteja o painel" subtitle="O painel do dono só abre com um código do app autenticador.">
      <TwoFactorSetup />
    </AdminGateShell>
  );
}
