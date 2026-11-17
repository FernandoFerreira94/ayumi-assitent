import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { teamInvitePreview } from "@/features/team/invite-server";
import { getSession } from "@/lib/session";
import { ERROR_MESSAGES } from "@/lib/errors";
import { InviteStart } from "./InviteStart";

export const metadata: Metadata = { title: "Convite", robots: { index: false } };

/** Página pública do convite: quem recebe o link vê o salão e entra com o Google. Não vaza nada além do necessário. */
export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Quem já tem conta não precisa de convite
  if (await getSession()) redirect("/agenda");
  const invite = await teamInvitePreview(token);

  const problem = !invite
    ? ERROR_MESSAGES.INVITE_INVALID
    : invite.state === "expired"
      ? ERROR_MESSAGES.INVITE_EXPIRED
      : invite.state === "used"
        ? ERROR_MESSAGES.INVITE_USED
        : null;

  const who =
    invite?.role === "professional" && invite.professionalName
      ? `como ${invite.professionalName}`
      : invite?.role === "admin"
        ? "como gerente"
        : "";

  return (
    <main
      data-mascot="bolha"
      className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),24px)]"
    >
      <h1 className="text-center text-4xl">
        <Wordmark />
      </h1>
      {problem ? (
        <p role="alert" className="rounded-2xl bg-fail-bg px-4 py-3 text-center text-sm font-semibold text-fail">
          {problem}
        </p>
      ) : (
        <>
          <div className="grid gap-1 text-center">
            <p className="text-2xl font-bold">Você foi convidada!</p>
            <p className="text-base font-semibold text-muted">
              Entre na agenda do {invite!.salon} {who}.
            </p>
          </div>
          <InviteStart token={token} />
        </>
      )}
    </main>
  );
}
