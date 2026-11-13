import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WIDE_QUERY, useIsWide } from "@/lib/use-media";

function fakeMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return matches;
    },
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  const spy = vi.fn((q: string) => {
    expect(q).toBe(WIDE_QUERY);
    return mql;
  });
  vi.stubGlobal("matchMedia", spy);
  return {
    set(v: boolean) {
      matches = v;
      listeners.forEach((l) => l());
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("useIsWide", () => {
  it("segue a largura da tela e reage ao girar o aparelho", () => {
    const mm = fakeMatchMedia(false);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(false);
    act(() => mm.set(true));
    expect(result.current).toBe(true);
  });
});
