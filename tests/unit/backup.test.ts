import { describe, expect, it } from "vitest";
import { backupKey, expiredKeys } from "@/lib/backup";

describe("backup", () => {
  it("monta a chave por ano/mês com horário UTC", () => {
    expect(backupKey(new Date("2026-11-05T03:00:00.123Z"))).toBe("backups/2026/11/assist-2026-11-05T03-00-00Z.sql.gz");
  });
  it("só expira o que passou da retenção e ignora nomes estranhos", () => {
    const now = new Date("2026-11-20T03:00:00Z");
    const keys = [
      "backups/2026/11/assist-2026-11-01T03-00-00Z.sql.gz", // 19 dias → expira
      "backups/2026/11/assist-2026-11-10T03-00-00Z.sql.gz", // 10 dias → fica
      "backups/manual-importante.sql.gz", // fora do padrão → fica
    ];
    expect(expiredKeys(keys, now, 14)).toEqual([keys[0]]);
  });
});
