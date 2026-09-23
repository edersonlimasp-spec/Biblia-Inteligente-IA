import { describe, expect, it, vi } from "vitest";
import vm from "node:vm";
import {
  MP_PLAN_CONFIG,
  PUBLIC_MP_PLANS,
  appendAttribution,
  buildApprovedConversionHtml,
  extractAttributionParams,
  verifyMercadoPagoConversion,
} from "./mp-marketing";

const approvedPayment = {
  id: 123456789,
  status: "approved",
  currency_id: "BRL",
  transaction_amount: 79.9,
  external_reference: JSON.stringify({
    userId: "user-42",
    plan: "gold_anual",
    days: 365,
  }),
  metadata: {
    user_id: "user-42",
    plan: "gold_anual",
  },
};

function mpFetch(payment: unknown, ok = true) {
  return vi.fn(async () => ({
    ok,
    json: async () => payment,
  }));
}

describe("Mercado Pago Ads conversion verification", () => {
  it("uses the authenticated provider receipt amount and payment ID", async () => {
    const fetcher = mpFetch(approvedPayment);
    const result = await verifyMercadoPagoConversion("123456789", "token", fetcher);

    expect(result).toEqual({ paymentId: "123456789", value: 79.9 });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.mercadopago.com/v1/payments/123456789",
      {
        headers: { Authorization: "Bearer token" },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it.each(["pending", "in_process", "rejected", "cancelled"])(
    "does not verify a %s payment",
    async (status) => {
      const result = await verifyMercadoPagoConversion(
        "123456789",
        "token",
        mpFetch({ ...approvedPayment, status }),
      );
      expect(result).toBeNull();
    },
  );

  it("rejects forged query IDs before calling Mercado Pago", async () => {
    const fetcher = mpFetch(approvedPayment);
    await expect(
      verifyMercadoPagoConversion("123<script>", "token", fetcher),
    ).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects a receipt whose returned ID differs from the requested ID", async () => {
    const result = await verifyMercadoPagoConversion(
      "987654321",
      "token",
      mpFetch(approvedPayment),
    );
    expect(result).toBeNull();
  });

  it("requires BRL, a positive real amount, and checkout ownership binding", async () => {
    const cases = [
      { ...approvedPayment, currency_id: "USD" },
      { ...approvedPayment, transaction_amount: 0 },
      { ...approvedPayment, transaction_amount: "not-a-number" },
      { ...approvedPayment, external_reference: "forged" },
      {
        ...approvedPayment,
        metadata: { user_id: "another-user", plan: "gold_anual" },
      },
      {
        ...approvedPayment,
        external_reference: JSON.stringify({ userId: "user-42", plan: "fake" }),
      },
    ];

    for (const payment of cases) {
      await expect(
        verifyMercadoPagoConversion("123456789", "token", mpFetch(payment)),
      ).resolves.toBeNull();
    }
  });
});

describe("approved conversion interstitial", () => {
  it("sends the exact Ads conversion with dedup and an 800ms fallback", () => {
    const html = buildApprovedConversionHtml(
      { paymentId: "123456789", value: 79.9 },
      "https://bibliainteligente.replit.app/pagamento/sucesso?payment_id=123456789",
    );

    expect(html.match(/gtag\('config', 'AW-18403408626'\)/g)).toHaveLength(1);
    expect(html).toContain("AW-18403408626/B50JCN_c24EdEPL1tsdE");
    expect(html).toContain("'value': 79.9");
    expect(html).toContain("'transaction_id': transactionId");
    expect(html).toContain("localStorage.getItem(storageKey)");
    expect(html).toContain("document.cookie");
    expect(html).toContain("setTimeout(finish, 800)");
    expect(html).toContain("'event_callback': finish");
    expect(html).toContain('<noscript><meta http-equiv="refresh"');
    expect(html).toContain("Continuar para o aplicativo");
  });

  it("escapes redirect markup and never creates a user-controlled redirect script", () => {
    const html = buildApprovedConversionHtml(
      { paymentId: "123", value: 9.9 },
      `https://bibliainteligente.replit.app/path?<script>alert(1)</script>`,
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("\\u003cscript>");
    expect(html).toContain("&lt;script&gt;");
  });

  function executeConversionScript(options: {
    stored?: boolean;
    blockedStorage?: boolean;
  } = {}) {
    const html = buildApprovedConversionHtml(
      { paymentId: "123456789", value: 79.9 },
      "https://bibliainteligente.replit.app/pagamento/sucesso",
    );
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
    const script = scripts.at(-1)?.[1];
    if (!script) throw new Error("conversion script not found");

    const events: unknown[][] = [];
    const redirects: string[] = [];
    const timers: Array<{ callback: () => void; delay: number }> = [];
    const values = new Map<string, string>();
    if (options.stored) values.set("google_ads_purchase_123456789", "1");

    const localStorage = {
      getItem(key: string) {
        if (options.blockedStorage) throw new Error("blocked");
        return values.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        if (options.blockedStorage) throw new Error("blocked");
        values.set(key, value);
      },
    };
    const document = options.blockedStorage
      ? Object.defineProperty({}, "cookie", {
          get() { throw new Error("blocked"); },
          set() { throw new Error("blocked"); },
        })
      : { cookie: "" };
    const window = {
      location: { replace: (url: string) => redirects.push(url) },
    };

    vm.runInNewContext(script, {
      document,
      localStorage,
      window,
      setTimeout: (callback: () => void, delay: number) => {
        timers.push({ callback, delay });
        return 1;
      },
      gtag: (...args: unknown[]) => events.push(args),
    });

    return { events, redirects, timers, values };
  }

  it("executes once, passes the callback, and uses the 800ms safety timer", () => {
    const execution = executeConversionScript();
    expect(execution.events).toHaveLength(1);
    expect(execution.events[0]?.slice(0, 2)).toEqual(["event", "conversion"]);
    expect(execution.timers).toHaveLength(1);
    expect(execution.timers[0]?.delay).toBe(800);
    expect(execution.values.get("google_ads_purchase_123456789")).toBe("1");

    const payload = execution.events[0]?.[2] as { event_callback: () => void };
    payload.event_callback();
    expect(execution.redirects).toEqual([
      "https://bibliainteligente.replit.app/pagamento/sucesso",
    ]);
    execution.timers[0]?.callback();
    expect(execution.redirects).toHaveLength(1);
  });

  it("does not resend a persisted transaction", () => {
    const execution = executeConversionScript({ stored: true });
    expect(execution.events).toHaveLength(0);
    expect(execution.redirects).toHaveLength(1);
  });

  it("still measures and redirects when cookie and storage access are blocked", () => {
    const execution = executeConversionScript({ blockedStorage: true });
    expect(execution.events).toHaveLength(1);
    expect(execution.timers[0]?.delay).toBe(800);
    execution.timers[0]?.callback();
    expect(execution.redirects).toHaveLength(1);
  });
});

describe("attribution and public plan catalog", () => {
  it("preserves only gclid and UTM parameters on fixed safe URLs", () => {
    const attribution = extractAttributionParams(
      "https://example.test/oferta?gclid=abc%20123&gbraid=gb&wbraid=wb&dclid=dc&utm_source=google&utm_campaign=ads&next=https://evil.test",
    );
    const target = new URL(appendAttribution(
      "https://bibliainteligente.replit.app/mp/return?status=success",
      attribution,
    ));

    expect(target.origin).toBe("https://bibliainteligente.replit.app");
    expect(target.searchParams.get("gclid")).toBe("abc 123");
    expect(target.searchParams.get("gbraid")).toBe("gb");
    expect(target.searchParams.get("wbraid")).toBe("wb");
    expect(target.searchParams.get("dclid")).toBe("dc");
    expect(target.searchParams.get("utm_source")).toBe("google");
    expect(target.searchParams.get("utm_campaign")).toBe("ads");
    expect(target.searchParams.has("next")).toBe(false);
  });

  it("returns the five public plans in order from the checkout price source", () => {
    expect(PUBLIC_MP_PLANS).toEqual([
      { id: "gold", name: "Gold mensal", price: MP_PLAN_CONFIG.gold.price, period: "monthly" },
      { id: "gold_anual", name: "Gold anual", price: MP_PLAN_CONFIG.gold_anual.price, period: "yearly" },
      { id: "premium", name: "Premium mensal", price: MP_PLAN_CONFIG.premium.price, period: "monthly" },
      { id: "premium_anual", name: "Premium anual", price: MP_PLAN_CONFIG.premium_anual.price, period: "yearly" },
      { id: "strong_lifetime", name: "Strong vitalício", price: MP_PLAN_CONFIG.strong_lifetime.price, period: "lifetime" },
    ]);
  });
});