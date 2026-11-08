import { describe, expect, it } from "vitest";
import { detectPlatform } from "@/features/install/platform";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36";

describe("plataforma para instalar o app", () => {
  it("iPhone mostra o caminho do Compartilhar", () => {
    expect(detectPlatform(IPHONE, 5)).toBe("ios");
  });
  it("iPad que se diz Mac é reconhecido pelo toque", () => {
    expect(detectPlatform(IPAD, 5)).toBe("ios");
    expect(detectPlatform(IPAD, 0)).toBe("other");
  });
  it("Android e computador seguem cada um o seu", () => {
    expect(detectPlatform(ANDROID, 5)).toBe("android");
    expect(detectPlatform(WINDOWS, 0)).toBe("other");
  });
});
