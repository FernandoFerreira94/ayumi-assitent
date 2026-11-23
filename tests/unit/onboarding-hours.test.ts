import { describe, expect, it } from "vitest";
import {
  describeHours,
  draftFromWeek,
  draftToFormData,
  draftToWeek,
  ENTRY_DEFAULT_WEEK,
  hourLabel,
} from "@/features/onboarding/hours";

describe("expediente padrão da entrada", () => {
  it("é seg–sex, 9h às 18h, almoço 12h–13h", () => {
    expect(describeHours(ENTRY_DEFAULT_WEEK)).toBe("Seg a Sex · 9h às 18h · almoço 12h–13h");
  });

  it("vira os mesmos campos que Ajustes › Expediente envia", () => {
    const fd = draftToFormData(draftFromWeek(ENTRY_DEFAULT_WEEK));
    expect(fd.get("open-0")).toBeNull();
    for (const i of [1, 2, 3, 4, 5]) {
      expect(fd.get(`open-${i}`)).toBe("on");
      expect(fd.get(`opens-${i}`)).toBe("09:00");
      expect(fd.get(`closes-${i}`)).toBe("18:00");
    }
    expect(fd.get("open-6")).toBeNull();
    expect(fd.get("break-on")).toBe("on");
    expect(fd.get("break-start")).toBe("12:00");
    expect(fd.get("break-end")).toBe("13:00");
  });
});

describe("describeHours", () => {
  it("formata horas com minutos", () => {
    expect(hourLabel("09:00")).toBe("9h");
    expect(hourLabel("08:30")).toBe("8h30");
  });

  it("separa dias com horário diferente (sábado só de manhã)", () => {
    const draft = draftFromWeek(ENTRY_DEFAULT_WEEK);
    draft.days[6] = { open: true, opens: "08:00", closes: "12:00" };
    expect(describeHours(draftToWeek(draft))).toBe("Seg a Sex · 9h às 18h · almoço 12h–13h; Sáb · 8h às 12h");
  });

  it("a pausa que não cabe no horário do dia é ignorada nele, como ao salvar", () => {
    const draft = draftFromWeek(ENTRY_DEFAULT_WEEK);
    draft.days[6] = { open: true, opens: "08:00", closes: "12:00" };
    expect(draftToWeek(draft)[6]).toEqual({ opens: "08:00", closes: "12:00", breakStart: null, breakEnd: null });
  });

  it("dias soltos e semana sem atendimento", () => {
    const draft = draftFromWeek(ENTRY_DEFAULT_WEEK);
    draft.breakOn = false;
    draft.days = draft.days.map((d, i) => ({ ...d, open: i === 2 || i === 4 }));
    expect(describeHours(draftToWeek(draft))).toBe("Ter, Qui · 9h às 18h");
    draft.days = draft.days.map((d) => ({ ...d, open: false }));
    expect(describeHours(draftToWeek(draft))).toBe("Sem dias de atendimento");
  });

  it("domingo fecha a semana depois de sábado", () => {
    const draft = draftFromWeek(ENTRY_DEFAULT_WEEK);
    draft.breakOn = false;
    draft.days = draft.days.map((d, i) => ({ ...d, open: i === 6 || i === 0 }));
    expect(describeHours(draftToWeek(draft))).toBe("Sáb e Dom · 9h às 18h");
  });
});
