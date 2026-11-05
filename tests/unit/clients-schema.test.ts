import { describe, expect, it } from "vitest";
import { clientInput } from "@/features/clients/schema";

describe("validação de cliente", () => {
  it("normaliza telefone para E.164", () => {
    const r = clientInput.parse({ name: " Maria ", phone: "(11) 98765-4321" });
    expect(r).toEqual({ name: "Maria", phone: "+5511987654321", notes: undefined });
  });
  it("recusa nome curto e telefone incompleto", () => {
    expect(clientInput.safeParse({ name: "A", phone: "(11) 98765-4321" }).success).toBe(false);
    expect(clientInput.safeParse({ name: "Maria", phone: "(11) 9876" }).success).toBe(false);
  });
});
