import { describe, expect, it } from "vitest";
import { initials } from "@/components/nav/AppMenu";

describe("initials", () => {
  it("usa a primeira letra do primeiro e do último nome", () => {
    expect(initials("Yumi Tanaka")).toBe("YT");
    expect(initials("ana maria de souza")).toBe("AS");
  });

  it("aceita nome único e espaços sobrando", () => {
    expect(initials("  Yumi  ")).toBe("Y");
  });

  it("mostra ? sem nome", () => {
    expect(initials(null)).toBe("?");
    expect(initials("   ")).toBe("?");
  });
});
