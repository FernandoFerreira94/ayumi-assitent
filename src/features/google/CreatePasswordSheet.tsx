"use client";

import { useActionState, useState } from "react";
import { Drawer } from "vaul";
import { SidePanelClose, sheetClass, useSheetSide } from "@/components/ui/AdaptiveSheet";
import { SubmitButton } from "@/components/feedback/SubmitButton";
import { notify } from "@/components/feedback/toast";
import { Icon } from "@/components/ui/Icon";
import { messageFor, type ActionResult } from "@/lib/errors";
import { PASSWORD_MAX, PASSWORD_MIN, passwordPairState } from "@/lib/password";
import { createPassword } from "./actions";

const input = "min-h-13 w-full rounded-2xl border px-4 text-base font-semibold transition-colors";

/** Borda do "Repita a senha": vermelha se diferente, verde se igual (texto do aviso acompanha a cor). */
const confirmTone = { idle: "", mismatch: "border-fail", short: "border-ok", ok: "border-ok" } as const;

const PAIR_MESSAGE = {
  mismatch: "As senhas não são iguais.",
  short: `As senhas são iguais, mas precisam ter pelo menos ${PASSWORD_MIN} caracteres.`,
  ok: "As senhas são iguais.",
} as const;

/**
 * Sheet para quem só entra pelo Google criar uma senha (e poder desconectar o Google sem perder o acesso).
 * O campo oculto de e-mail faz o iPhone salvar a senha no Chaves com o login certo.
 */
export function CreatePasswordSheet({
  open,
  onOpenChange,
  email,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
  onCreated: () => void;
}) {
  const side = useSheetSide();
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const pair = passwordPairState(password, confirm);
  const confirmId = "create-password-confirm-hint";

  const changeOpen = (next: boolean) => {
    if (!next) {
      setPassword("");
      setConfirm("");
    }
    onOpenChange(next);
  };
  const [state, action] = useActionState(async (prev: ActionResult | null, fd: FormData) => {
    const res = await createPassword(prev, fd).catch(() => null);
    if (!res) {
      notify.error("NETWORK");
      return prev;
    }
    if (res.ok) {
      notify.success("Senha criada", email ? `Agora você também entra com ${email} e essa senha.` : undefined);
      changeOpen(false);
      onCreated();
    } else if (res.code !== "VALIDATION") notify.error(res.code);
    return res;
  }, null);
  const err = state && !state.ok && state.code === "VALIDATION" ? state : null;

  return (
    <Drawer.Root direction={side} repositionInputs={false} open={open} onOpenChange={changeOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/25" />
        <Drawer.Content
          className={sheetClass(
            side,
            "fixed inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-3xl px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4 outline-none",
            "sheet z-50",
          )}
        >
          <SidePanelClose />
          <Drawer.Title className="pb-1 text-xl font-bold">Criar senha</Drawer.Title>
          <Drawer.Description className="pb-4 text-sm font-semibold text-muted">
            {email ? (
              <>
                Depois, para entrar sem o Google, use <strong className="text-fg">{email}</strong> e esta senha.
              </>
            ) : (
              "Depois, para entrar sem o Google, use seu e-mail e esta senha."
            )}
          </Drawer.Description>
          <form action={action} className="grid gap-3">
            {email ? (
              <input
                type="email"
                name="username"
                autoComplete="username"
                value={email}
                readOnly
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            ) : null}
            <label className="grid gap-1 text-sm font-bold">
              Nova senha
              <span className="relative">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={PASSWORD_MIN}
                  maxLength={PASSWORD_MAX}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder={`Mínimo de ${PASSWORD_MIN} caracteres`}
                  className={`${input} pr-14`}
                  aria-invalid={err?.field === "password"}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 right-1 grid w-12 place-items-center text-muted"
                  aria-label={show ? "Esconder senha" : "Mostrar senha"}
                  aria-pressed={show}
                >
                  <Icon name={show ? "eyeOff" : "eye"} />
                </button>
              </span>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Repita a senha
              <input
                name="confirm"
                type={show ? "text" : "password"}
                required
                maxLength={PASSWORD_MAX}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={`${input} ${confirmTone[pair]}`}
                aria-invalid={pair === "mismatch" || err?.field === "confirm"}
                aria-describedby={confirmId}
              />
            </label>
            <p
              id={confirmId}
              aria-live="polite"
              className={`flex min-h-5 items-center gap-1.5 text-sm font-bold ${pair === "mismatch" ? "text-fail" : "text-ok"}`}
            >
              {pair === "idle" ? null : (
                <>
                  <Icon name={pair === "mismatch" ? "alert" : "checkCircle"} size={16} />
                  {PAIR_MESSAGE[pair]}
                </>
              )}
            </p>
            {err ? (
              <p role="alert" className="rounded-2xl bg-soft px-4 py-3 text-sm font-semibold">
                {err.field === "confirm"
                  ? "As duas senhas não são iguais."
                  : err.field === "password"
                    ? "A senha precisa ter pelo menos 8 caracteres."
                    : messageFor("VALIDATION")}
              </p>
            ) : null}
            <SubmitButton pendingLabel="Criando…" disabled={pair !== "ok"}>
              Criar senha
            </SubmitButton>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
