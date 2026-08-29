import { describe, expect, it } from "vitest";
import { findEmbeddedStrongEntry } from "./strong-embedded-fallback";

describe("findEmbeddedStrongEntry", () => {
  it("recupera G2191 do léxico embutido", () => {
    const entry = findEmbeddedStrongEntry("g2191");

    expect(entry).toMatchObject({
      strongNumber: "G2191",
      language: "greek",
      lemma: "ἔχιδνα",
      translit: "échidna",
      kjvDef: "viper",
    });
    expect(entry?.portugueseDef).toContain("víbora");
  });

  it("retorna null para número inexistente", () => {
    expect(findEmbeddedStrongEntry("G99999")).toBeNull();
  });
});