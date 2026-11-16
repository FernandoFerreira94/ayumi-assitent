import { describe, expect, it } from "vitest";
import { APP_ID, appleAppSiteAssociation, assetLinks } from "@/features/native/well-known";

const FP = Array.from({ length: 32 }, () => "AB").join(":");

describe("assetlinks.json (Android)", () => {
  it("sem impressão válida devolve lista vazia", () => {
    expect(assetLinks(undefined)).toEqual([]);
    expect(assetLinks("lixo, 12:34")).toEqual([]);
  });
  it("aceita várias impressões e normaliza maiúsculas", () => {
    const [entry] = assetLinks(` ${FP.toLowerCase()} , ${FP}`);
    expect(entry.target.package_name).toBe(APP_ID);
    expect(entry.target.sha256_cert_fingerprints).toEqual([FP, FP]);
  });
});

describe("apple-app-site-association (iPhone)", () => {
  it("sem Team ID não publica nada", () => {
    expect(appleAppSiteAssociation(undefined)).toBeNull();
    expect(appleAppSiteAssociation("curto")).toBeNull();
  });
  it("liga o app e deixa a API de fora", () => {
    const aasa = appleAppSiteAssociation("abcde12345")!;
    expect(aasa.applinks.details[0].appIDs).toEqual([`ABCDE12345.${APP_ID}`]);
    expect(aasa.applinks.details[0].components[0]).toEqual({ "/": "/api/*", exclude: true });
    expect(aasa.webcredentials.apps).toEqual([`ABCDE12345.${APP_ID}`]);
  });
});
