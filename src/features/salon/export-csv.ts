/** CSV para o Excel brasileiro: separador ";", BOM UTF-8 e aspas só quando precisa. */
export function toCsv(rows: Record<string, string | number | null>[]): string {
  if (!rows.length) return "﻿";
  const cols = Object.keys(rows[0]);
  const cell = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [cols.join(";"), ...rows.map((r) => cols.map((c) => cell(r[c])).join(";"))].join("\r\n");
}
