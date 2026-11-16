/** Ids de usuário com acesso ao painel do dono (ADMIN_USER_IDS, separados por vírgula). */
export function adminIds(raw = process.env.ADMIN_USER_IDS): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ids de usuário com acesso ao painel do dono. Fica no Railway: virar admin exige mexer no ambiente, não no banco. */
export function isPlatformAdmin(userId: string | null | undefined, raw = process.env.ADMIN_USER_IDS): boolean {
  if (!userId) return false;
  return adminIds(raw).includes(userId);
}
