import { describe, expect, it } from "vitest";
import {
  calendarsLine,
  connectionsSummary,
  notificationsLine,
  whatsappLine,
} from "@/features/settings/connection-status";

describe("selo das conexões", () => {
  it("WhatsApp: conectado verde, caiu âmbar, sem resposta cinza", () => {
    expect(whatsappLine("open").badge).toEqual({ tone: "ok", label: "Conectado" });
    expect(whatsappLine("other").badge).toEqual({ tone: "warn", label: "Desconectado" });
    expect(whatsappLine("unavailable").badge?.tone).toBe("off");
  });

  it("Calendários: qualquer um ligado conta como conectado", () => {
    expect(calendarsLine(true, false)).toEqual({
      status: "Google conectado",
      badge: { tone: "ok", label: "Conectado" },
    });
    expect(calendarsLine(true, true).status).toBe("Google conectado · iPhone ligado");
    expect(calendarsLine(false, false).badge).toEqual({ tone: "off", label: "Não conectado" });
  });

  it("Notificação: avisos e localização ligados = verde; faltando um = âmbar", () => {
    expect(notificationsLine("on", true).badge).toEqual({ tone: "ok", label: "Ligada" });
    expect(notificationsLine("on", false).badge).toEqual({ tone: "warn", label: "Sem localização" });
    expect(notificationsLine("off", true).badge?.tone).toBe("warn");
    expect(notificationsLine("denied", true).badge).toEqual({ tone: "warn", label: "Bloqueada" });
    expect(notificationsLine("checking", false).badge).toBeUndefined();
  });

  it("resumo: conta as ativas e as que pedem atenção; verificando não conta", () => {
    const s = connectionsSummary([
      whatsappLine("open").badge,
      calendarsLine(false, false).badge,
      undefined,
    ]);
    expect(s).toEqual({ active: 1, total: 3, attention: 0 });
  });
});
