import { describe, expect, it } from "vitest";
import {
  isNoticeLive,
  newSupportAlert,
  noticeEndsAt,
  noticeInput,
  preview,
  sortConversations,
  supportBody,
  supportReplyAlert,
  type Conversation,
} from "@/features/support/rules";

const now = new Date("2026-11-16T15:00:00Z");

describe("suporte: regras", () => {
  it("limpa o texto e recusa vazio ou longo demais", () => {
    expect(supportBody.parse("  oi\r\n\r\n\r\n\r\ntudo bem?  ")).toBe("oi\n\ntudo bem?");
    expect(supportBody.safeParse("   \n ").success).toBe(false);
    expect(supportBody.safeParse("a".repeat(2001)).success).toBe(false);
  });

  it("prévia em uma linha, cortada na palavra", () => {
    expect(preview("oi\n\ntudo  bem")).toBe("oi tudo bem");
    expect(preview("palavra ".repeat(20), 30)).toBe("palavra palavra palavra…");
  });

  it("conversas esperando resposta vêm primeiro, a mais antiga no topo", () => {
    const c = (id: string, lastAuthor: "salon" | "admin", h: number): Conversation => ({
      tenantId: id,
      salonName: id,
      lastBody: "x",
      lastAuthor,
      lastAt: new Date(now.getTime() - h * 3600_000),
      unread: 0,
    });
    const r = sortConversations([c("resp-velha", "admin", 9), c("esp-nova", "salon", 1), c("resp-nova", "admin", 2), c("esp-velha", "salon", 5)]);
    expect(r.map((x) => x.tenantId)).toEqual(["esp-velha", "esp-nova", "resp-nova", "resp-velha"]);
  });

  it("push sem nome nem trecho da mensagem", () => {
    const a = newSupportAlert("00000000-0000-0000-0000-000000000001");
    expect(a.url).toBe("/admin/suporte?salao=00000000-0000-0000-0000-000000000001");
    expect(a.body).not.toMatch(/salão [A-Z]/);
    expect(supportReplyAlert().url).toBe("/ajustes/suporte");
  });
});

describe("avisos do dono: regras", () => {
  it("valida o formulário", () => {
    expect(noticeInput.parse({ title: " Manutenção ", body: "Hoje 23h", tone: "important", days: "7" })).toEqual({
      title: "Manutenção",
      body: "Hoje 23h",
      tone: "important",
      days: 7,
    });
    expect(noticeInput.parse({ title: "a", body: "b", days: "" }).days).toBe("");
    expect(noticeInput.safeParse({ title: "", body: "b" }).success).toBe(false);
    expect(noticeInput.safeParse({ title: "a", body: "b", days: "90" }).success).toBe(false);
    expect(noticeInput.safeParse({ title: "a", body: "b", tone: "urgente" }).success).toBe(false);
  });

  it("no ar até encerrar ou vencer", () => {
    expect(isNoticeLive({ endsAt: null, endedAt: null }, now)).toBe(true);
    expect(isNoticeLive({ endsAt: new Date(now.getTime() + 1), endedAt: null }, now)).toBe(true);
    expect(isNoticeLive({ endsAt: now, endedAt: null }, now)).toBe(false);
    expect(isNoticeLive({ endsAt: null, endedAt: now }, now)).toBe(false);
    expect(noticeEndsAt(3, now)?.toISOString()).toBe("2026-11-19T15:00:00.000Z");
    expect(noticeEndsAt("", now)).toBeNull();
  });
});

describe("suporte: quando", () => {
  it("hoje = hora, ontem = Ontem, antes = dia/mês (fuso do Brasil)", async () => {
    const { whenLabel } = await import("@/features/support/rules");
    const agora = new Date("2026-11-16T22:00:00Z"); // 19:00 em SP
    expect(whenLabel(new Date("2026-11-16T15:37:00Z"), agora)).toBe("12:37");
    expect(whenLabel(new Date("2026-11-16T02:00:00Z"), agora)).toBe("Ontem"); // 23:00 do dia 15 em SP
    expect(whenLabel(new Date("2026-11-10T15:00:00Z"), agora)).toBe("10/11");
  });
});
