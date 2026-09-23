import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MouseEvent } from "react";
import { detectDownloadDevice, DOWNLOAD_CONVERSION, preserveMarketingAttribution, STORE_LINKS, trackStoreDownload, withAttribution } from "./google-ads";

describe("public Google Ads marketing helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
    history.replaceState({}, "", "/oferta");
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("detects iPhone, iPad desktop UA, Android and desktop", () => {
    expect(detectDownloadDevice("iPhone", 1)).toBe("ios");
    expect(detectDownloadDevice("iPad", 1)).toBe("ios");
    expect(detectDownloadDevice("Macintosh", 5)).toBe("ios");
    expect(detectDownloadDevice("Android", 1)).toBe("android");
    expect(detectDownloadDevice("Macintosh", 0)).toBe("desktop");
  });

  it("preserves attribution across internal navigation without persisting auth fields", () => {
    history.replaceState({}, "", "/oferta?gclid=click-123&utm_source=google&utm_campaign=biblia&token=private");
    preserveMarketingAttribution();
    expect(withAttribution("/?screen=subscriptions")).toBe("/?screen=subscriptions&gclid=click-123&utm_source=google&utm_campaign=biblia");
    history.replaceState({}, "", "/sign-in?redirect=%2F");
    preserveMarketingAttribution();
    expect(location.search).toContain("gclid=click-123");
    expect(location.search).toContain("redirect=%2F");
    expect(sessionStorage.getItem("bi:marketing-attribution")).not.toContain("token");
    expect(withAttribution(STORE_LINKS.android)).toBe(STORE_LINKS.android);
  });

  it("keeps explicit target campaign and hash and does not throw without storage", () => {
    history.replaceState({}, "", "/oferta?gclid=123&utm_source=google");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw Error("blocked"); });
    expect(() => preserveMarketingAttribution()).not.toThrow();
    expect(withAttribution("/baixar?utm_source=custom#lojas")).toBe("/baixar?utm_source=custom&gclid=123#lojas");
  });

  function click(href = STORE_LINKS.ios) {
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    return {
      currentTarget: link, button: 0, ctrlKey: false, metaKey: false,
      shiftKey: false, preventDefault: vi.fn(),
    } as unknown as MouseEvent<HTMLAnchorElement>;
  }

  it("enqueues the exact download conversion and keeps new-tab link navigation", () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    const event = click();
    trackStoreDownload(event);
    expect(gtag).toHaveBeenCalledExactlyOnceWith("event", "conversion", {
      send_to: DOWNLOAD_CONVERSION, value: 1, currency: "BRL",
    });
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("never breaks store links when Ads is blocked or throws", () => {
    for (const gtag of [undefined, () => { throw Error("blocked"); }]) {
      vi.stubGlobal("gtag", gtag);
      const event = click();
      expect(() => trackStoreDownload(event)).not.toThrow();
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
  });

  it("does not count internal links as downloads", () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);
    const event = click();
    event.currentTarget.href = "/baixar";
    trackStoreDownload(event);
    expect(gtag).not.toHaveBeenCalled();
  });
});