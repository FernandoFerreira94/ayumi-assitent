import { describe, expect, it } from "vitest";
import { adminIds, isPlatformAdmin } from "@/features/admin/access";
import { digestAlert, signupAlert } from "@/features/admin/alerts-text";

const base = { newSalons: 0, activeSalons: 3, appointments: 12, messagesOut: 40, whatsappDown: 0, idleSalons: 0 };

describe("avisos do dono", () => {
  it("resumo normal: sem alerta, plural certo", () => {
    const p = digestAlert(base);
    expect(p.title).toBe("Bubbly Admin · ontem");
    expect(p.body).toBe("3 salões usaram o app ontem · 12 agendamentos e 40 mensagens");
    expect(p.url).toBe("/admin/uso");
  });

  it("WhatsApp caído vai na frente e muda o título; singular", () => {
    const p = digestAlert({ ...base, whatsappDown: 1, newSalons: 1, activeSalons: 1, appointments: 1, messagesOut: 1, idleSalons: 2 });
    expect(p.title).toBe("Bubbly Admin · atenção");
    expect(p.body).toBe(
      "⚠️ 1 salão com WhatsApp caído · 1 salão novo · 1 salão usou o app ontem · 1 agendamento e 1 mensagem · 2 salões parados há 7+ dias",
    );
  });

  it("aviso de cadastro não leva nome nem e-mail", () => {
    expect(signupAlert().body).toBe("Novo salão cadastrado. Toque para ver no painel.");
  });

  it("ids de admin: espaços e vazios saem", () => {
    expect(adminIds(" a, ,b ")).toEqual(["a", "b"]);
    expect(adminIds(undefined)).toEqual([]);
    expect(isPlatformAdmin("b", "a,b")).toBe(true);
    expect(isPlatformAdmin(null, "a")).toBe(false);
  });
});
