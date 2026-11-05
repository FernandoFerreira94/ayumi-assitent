import { toE164 } from "@/lib/phone";

export type Candidate = { name: string; phone: string; email?: string };
export type Parsed = { candidates: Candidate[]; ignored: number };

export const MAX_CANDIDATES = 2000;

/** Junta, tira duplicados por telefone e descarta sem nome ou com telefone inválido. */
type Raw = { name: string; phone: string; email?: string };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalize(raw: Raw[]): Parsed {
  const seen = new Map<string, Candidate>();
  let ignored = 0;
  for (const r of raw) {
    const phone = toE164(r.phone);
    const name = r.name.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!phone || name.length < 2) {
      ignored++;
      continue;
    }
    if (seen.has(phone)) continue;
    const email = r.email?.trim().toLowerCase();
    seen.set(phone, { name, phone, ...(email && EMAIL.test(email) ? { email } : {}) });
  }
  return { candidates: [...seen.values()].slice(0, MAX_CANDIDATES), ignored };
}

const unfold = (t: string) => t.replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "");
const vcfUnescape = (s: string) => s.replace(/\\([,;nN\\])/g, (_, c: string) => (c === "n" || c === "N" ? " " : c));

/** vCard 2.1/3.0/4.0: um contato pode ter vários telefones; cada um vira um candidato. */
export function parseVcf(text: string): Parsed {
  const raw: Raw[] = [];
  let ignoredNoPhone = 0;
  for (const card of unfold(text)
    .split(/BEGIN:VCARD/i)
    .slice(1)) {
    const lines = card.split("\n");
    let fn = "";
    let n = "";
    const phones: string[] = [];
    let email = "";
    for (const line of lines) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const key = line
        .slice(0, i)
        .split(";")[0]
        .toUpperCase()
        .replace(/^ITEM\d+\./, "");
      const value = line.slice(i + 1).trim();
      if (key === "FN") fn = vcfUnescape(value);
      else if (key === "N") n = value.split(";").filter(Boolean).reverse().join(" ");
      else if (key === "TEL") phones.push(value);
      else if (key === "EMAIL" && !email) email = value;
    }
    if (phones.length === 0) ignoredNoPhone++;
    for (const p of phones) raw.push({ name: fn || n, phone: p, email });
  }
  const r = normalize(raw);
  return { ...r, ignored: r.ignored + ignoredNoPhone };
}

function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  const first = text.replace(/^﻿/, "").split("\n")[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const s = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') ((cur += '"'), i++);
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) (row.push(cur), (cur = ""));
    else if (c === "\n") (row.push(cur), rows.push(row), (row = []), (cur = ""));
    else cur += c;
  }
  if (cur || row.length) (row.push(cur), rows.push(row));
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** CSV com cabeçalho. Reconhece Nome/Name/First Name e Telefone/Phone/Mobile (Google, Outlook, planilhas). */
export function parseCsv(text: string): Parsed {
  const rows = csvRows(text);
  if (rows.length < 2) return { candidates: [], ignored: 0 };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (re: RegExp) => head.flatMap((h, i) => (re.test(h) ? [i] : []));
  const nameCols = idx(/^(nome|name|full name|nome completo|display name)$/);
  const given = idx(/^(first name|given name|primeiro nome)$/);
  const family = idx(/^(last name|family name|sobrenome)$/);
  const emailCols = idx(/(e-?mail)/).filter((i) => !/type|label|tipo/.test(head[i]));
  const phoneCols = idx(/(telefone|celular|phone|mobile|whatsapp|tel)/).filter((i) => !/type|label|tipo/.test(head[i]));
  const raw: Raw[] = [];
  for (const r of rows.slice(1)) {
    const email = emailCols.map((i) => (r[i] ?? "").split(":::")[0].trim()).find(Boolean) ?? "";
    const name =
      (nameCols.length ? r[nameCols[0]] : "") ||
      [given[0] !== undefined ? r[given[0]] : "", family[0] !== undefined ? r[family[0]] : ""]
        .filter(Boolean)
        .join(" ");
    for (const i of phoneCols) {
      // Google CSV junta vários telefones com " ::: "
      for (const p of (r[i] ?? "").split(":::")) if (p.trim()) raw.push({ name: name ?? "", phone: p, email });
    }
    if (!phoneCols.some((i) => (r[i] ?? "").trim())) raw.push({ name: name ?? "", phone: "" });
  }
  return normalize(raw);
}

export function parseContactsFile(fileName: string, text: string): Parsed {
  return /\.vcf$/i.test(fileName) || /BEGIN:VCARD/i.test(text.slice(0, 200)) ? parseVcf(text) : parseCsv(text);
}
