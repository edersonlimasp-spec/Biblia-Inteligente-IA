import type { MouseEvent } from "react";

export const STORE_LINKS = {
  ios: "https://apps.apple.com/br/app/b%C3%ADblia-inteligente-ia/id6766988872",
  android: "https://play.google.com/store/apps/details?id=app.replit.bibliainteligente.twa",
} as const;

export const DOWNLOAD_CONVERSION = "AW-18403408626/WBMDCOLc24EdEPL1tsdE";
const ATTRIBUTION_KEY = "bi:marketing-attribution";

type GoogleTag = (command: string, event: string, options: Record<string, unknown>) => void;

export function detectDownloadDevice(
  userAgent = navigator.userAgent,
  maxTouchPoints = navigator.maxTouchPoints,
): "ios" | "android" | "desktop" {
  if (/iphone|ipad|ipod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return "ios";
  return /android/i.test(userAgent) ? "android" : "desktop";
}

function attributionParams(search: string): URLSearchParams {
  const result = new URLSearchParams();
  new URLSearchParams(search).forEach((value, key) => {
    if (/^(gclid|gbraid|wbraid|dclid|utm_[a-z0-9_]+)$/i.test(key)) {
      result.set(key, value);
    }
  });
  return result;
}

function rememberedAttribution(): URLSearchParams {
  let result = new URLSearchParams();
  try {
    result = attributionParams(sessionStorage.getItem(ATTRIBUTION_KEY) || "");
  } catch {
    // Navigation and tracking must continue when storage is unavailable.
  }
  attributionParams(window.location.search).forEach((value, key) => result.set(key, value));
  return result;
}

/** Only same-origin links inherit campaign parameters; never store auth parameters. */
export function withAttribution(href: string): string {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return href;
  rememberedAttribution().forEach((value, key) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  });
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Keep attribution in the URL after full-page and SPA internal navigation. */
export function preserveMarketingAttribution(): void {
  const params = rememberedAttribution();
  try {
    if (params.size) sessionStorage.setItem(ATTRIBUTION_KEY, params.toString());
  } catch {
    // A blocked storage API must not affect the app.
  }
  const next = withAttribution(window.location.href);
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) window.history.replaceState(window.history.state, "", next);
}

/**
 * Public store buttons open a new tab: enqueue before the browser follows the
 * anchor while keeping the original page alive to send the event. A regular
 * same-tab anchor also works with callback + an independent 800 ms fallback.
 */
export function trackStoreDownload(event: MouseEvent<HTMLAnchorElement>): void {
  const link = event.currentTarget;
  if (!Object.values(STORE_LINKS).includes(link.href as typeof STORE_LINKS.ios)) return;
  const gtag = (window as Window & { gtag?: GoogleTag }).gtag;
  if (typeof gtag !== "function") return;
  const options: Record<string, unknown> = {
    send_to: DOWNLOAD_CONVERSION,
    value: 1.0,
    currency: "BRL",
  };
  const opensAnotherTab = link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0;
  if (opensAnotherTab) {
    try { gtag("event", "conversion", options); } catch { /* Keep the link usable. */ }
    return;
  }
  event.preventDefault();
  let navigated = false;
  const follow = () => {
    if (navigated) return;
    navigated = true;
    window.location.assign(link.href);
  };
  const timer = window.setTimeout(follow, 800);
  options.event_callback = () => { window.clearTimeout(timer); follow(); };
  options.event_timeout = 800;
  try { gtag("event", "conversion", options); } catch { window.clearTimeout(timer); follow(); }
}