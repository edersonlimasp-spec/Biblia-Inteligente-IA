import { describe, expect, it } from "vitest";
import { strongAuthModalReducer } from "../strongAuthFlow";

describe("fluxo do login Strong", () => {
  it("não reabre o formulário automaticamente após login seguido de novo 401", () => {
    let isOpen = strongAuthModalReducer(false, { type: "OPEN_REQUESTED" });
    expect(isOpen).toBe(true);

    isOpen = strongAuthModalReducer(isOpen, { type: "AUTH_SUCCESS" });
    expect(isOpen).toBe(false);
  });

  it("permite abrir o login novamente após cancelamento, falha ou 401 futuro", () => {
    let isOpen = strongAuthModalReducer(true, { type: "CLOSE_REQUESTED" });
    expect(isOpen).toBe(false);

    isOpen = strongAuthModalReducer(isOpen, { type: "OPEN_REQUESTED" });
    expect(isOpen).toBe(true);

    isOpen = strongAuthModalReducer(isOpen, { type: "AUTH_SUCCESS" });
    isOpen = strongAuthModalReducer(isOpen, { type: "OPEN_REQUESTED" });
    expect(isOpen).toBe(true);
  });
});