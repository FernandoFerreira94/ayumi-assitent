/** Regras de senha compartilhadas entre o formulário (feedback ao vivo) e o servidor (zod). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/**
 * Estado do par "senha + repita a senha" enquanto a pessoa digita.
 * - `idle`: ainda não começou a repetir (sem aviso, para não acusar erro cedo demais).
 * - `mismatch`: as duas são diferentes.
 * - `short`: iguais, mas abaixo do mínimo.
 * - `ok`: iguais e válidas; só aqui o botão libera.
 */
export type PasswordPairState = "idle" | "mismatch" | "short" | "ok";

export function passwordPairState(password: string, confirm: string): PasswordPairState {
  if (!confirm) return "idle";
  if (password !== confirm) return "mismatch";
  if (password.length < PASSWORD_MIN) return "short";
  return "ok";
}
