import { describe, expect, it } from "vitest";
import { pageMainClass } from "@/components/ui/page-main";

describe("pageMainClass", () => {
  it("mantém a coluna do celular nas duas variantes", () => {
    for (const cls of [pageMainClass(), pageMainClass(true)]) {
      expect(cls).toContain("max-w-[520px]");
      expect(cls).toContain("pb-36");
    }
  });
  it("tablet: coluna de 720 px; tela larga: sem limite", () => {
    expect(pageMainClass()).toContain("md:max-w-[720px]");
    expect(pageMainClass(true)).toContain("md:max-w-none");
    expect(pageMainClass(true)).not.toContain("md:max-w-[720px]");
  });
});
