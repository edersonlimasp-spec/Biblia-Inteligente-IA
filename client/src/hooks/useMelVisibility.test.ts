import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { MEL_VISIBILITY_KEY, setMelVisibility, useMelVisibility } from "./useMelVisibility";

let root: Root | undefined;
let host: HTMLDivElement | undefined;

function mount() {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  let value: ReturnType<typeof useMelVisibility>;
  function Probe() {
    value = useMelVisibility();
    return createElement("span", null, String(value.isMelVisible));
  }
  act(() => root?.render(createElement(Probe)));
  return () => value!;
}

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  host?.remove();
  host = undefined;
  localStorage.removeItem(MEL_VISIBILITY_KEY);
  setMelVisibility(true);
});

describe("useMelVisibility", () => {
  it("defaults on, persists a local toggle, and updates same-tab subscribers", () => {
    const result = mount();
    expect(result().isMelVisible).toBe(true);
    act(() => result().setMelVisible(false));
    expect(result().isMelVisible).toBe(false);
    expect(localStorage.getItem(MEL_VISIBILITY_KEY)).toBe("false");
    act(() => setMelVisibility(true));
    expect(result().isMelVisible).toBe(true);
  });

  it("honors cross-tab storage events", () => {
    const result = mount();
    act(() => {
      localStorage.setItem(MEL_VISIBILITY_KEY, "false");
      window.dispatchEvent(new StorageEvent("storage", { key: MEL_VISIBILITY_KEY, newValue: "false" }));
    });
    expect(result().isMelVisible).toBe(false);
  });
});