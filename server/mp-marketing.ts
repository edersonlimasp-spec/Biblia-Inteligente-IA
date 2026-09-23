export const MP_PLAN_CONFIG: Record<string, { title: string; price: number; days: number | null }> = {
  gold: { title: "Bíblia Inteligente - Plano Gold", price: 9.90, days: 30 },
  gold_anual: { title: "Bíblia Inteligente - Plano Gold Anual", price: 79.90, days: 365 },
  premium: { title: "Bíblia Inteligente - Plano Premium", price: 19.90, days: 30 },
  premium_anual: { title: "Bíblia Inteligente - Plano Premium Anual", price: 129.90, days: 365 },
  vitalicio: { title: "Bíblia Inteligente - Strong Vitalício", price: 49.90, days: null },
  strong_lifetime: { title: "Bíblia Inteligente - Strong Vitalício", price: 49.90, days: null },
};

export const PUBLIC_MP_PLANS = [
  { id: "gold", name: "Gold mensal", price: MP_PLAN_CONFIG.gold.price, period: "monthly" as const },
  { id: "gold_anual", name: "Gold anual", price: MP_PLAN_CONFIG.gold_anual.price, period: "yearly" as const },
  { id: "premium", name: "Premium mensal", price: MP_PLAN_CONFIG.premium.price, period: "monthly" as const },
  { id: "premium_anual", name: "Premium anual", price: MP_PLAN_CONFIG.premium_anual.price, period: "yearly" as const },
  { id: "strong_lifetime", name: "Strong vitalício", price: MP_PLAN_CONFIG.strong_lifetime.price, period: "lifetime" as const },
];

const ATTRIBUTION_PARAM = /^(gclid|gbraid|wbraid|dclid|utm_[a-z0-9_]+)$/i;
const MAX_ATTRIBUTION_VALUE_LENGTH = 500;

export function extractAttributionParams(urlOrQuery: string | undefined): URLSearchParams {
  const result = new URLSearchParams();
  if (!urlOrQuery) return result;

  try {
    const params = urlOrQuery.startsWith("?")
      ? new URLSearchParams(urlOrQuery)
      : new URL(urlOrQuery).searchParams;

    params.forEach((value, key) => {
      if (
        ATTRIBUTION_PARAM.test(key) &&
        value.length > 0 &&
        value.length <= MAX_ATTRIBUTION_VALUE_LENGTH
      ) {
        result.set(key, value);
      }
    });
  } catch {
    // Attribution is optional and must never affect checkout or payment return.
  }

  return result;
}

export function appendAttribution(url: string, attribution: URLSearchParams): string {
  const target = new URL(url);
  attribution.forEach((value, key) => target.searchParams.set(key, value));
  return target.toString();
}

type FetchLike = (input: string, init?: RequestInit) => Promise<{
  ok: boolean;
  json(): Promise<unknown>;
}>;

export type VerifiedMpConversion = {
  paymentId: string;
  value: number;
};

export async function verifyMercadoPagoConversion(
  requestedPaymentId: string,
  accessToken: string,
  fetchImpl: FetchLike = fetch,
): Promise<VerifiedMpConversion | null> {
  if (!/^\d{1,30}$/.test(requestedPaymentId) || !accessToken) return null;

  try {
    const response = await fetchImpl(
      `https://api.mercadopago.com/v1/payments/${requestedPaymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(2_500),
      },
    );
    if (!response.ok) return null;

    const payment = await response.json() as Record<string, any>;
    if (
      String(payment.id) !== requestedPaymentId ||
      payment.status !== "approved" ||
      payment.currency_id !== "BRL"
    ) {
      return null;
    }

    const value = Number(payment.transaction_amount);
    if (!Number.isFinite(value) || value <= 0) return null;

    let reference: Record<string, unknown>;
    try {
      reference = JSON.parse(String(payment.external_reference || ""));
    } catch {
      return null;
    }

    const plan = reference.plan;
    const userId = reference.userId;
    if (
      typeof plan !== "string" ||
      !Object.hasOwn(MP_PLAN_CONFIG, plan) ||
      typeof userId !== "string" ||
      userId.length === 0
    ) {
      return null;
    }

    // Checkout writes the same ownership binding in both fields. If MP returns
    // metadata, reject inconsistencies rather than trusting the return query.
    const metadata = payment.metadata;
    if (metadata && typeof metadata === "object") {
      const metadataUserId = metadata.userId ?? metadata.user_id;
      const metadataPlan = metadata.plan ?? metadata.planType;
      if (
        (metadataUserId != null && String(metadataUserId) !== userId) ||
        (metadataPlan != null && String(metadataPlan) !== plan)
      ) {
        return null;
      }
    }

    return {
      paymentId: requestedPaymentId,
      value: Math.round(value * 100) / 100,
    };
  } catch {
    return null;
  }
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function safeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildApprovedConversionHtml(
  conversion: VerifiedMpConversion,
  redirectUrl: string,
): string {
  const transactionId = safeJson(conversion.paymentId);
  const value = safeJson(conversion.value);
  const destination = safeJson(redirectUrl);
  const destinationAttribute = safeHtmlAttribute(redirectUrl);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Pagamento aprovado</title>
  <noscript><meta http-equiv="refresh" content="0;url=${destinationAttribute}"></noscript>
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18403408626"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-18403408626');
  </script>
</head>
<body style="margin:0;background:#0B2135;color:#FAFCFD;font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center">
  <main>
    <h1 style="font-size:1.4rem">Pagamento aprovado</h1>
    <p>Finalizando sua assinatura…</p>
    <p><a href="${destinationAttribute}" style="color:#FAFCFD">Continuar para o aplicativo</a></p>
  </main>
  <script>
    (function () {
      var transactionId = ${transactionId};
      var destination = ${destination};
      var storageKey = 'google_ads_purchase_' + transactionId;
      var cookieKey = 'ga_purchase_' + transactionId;
      var alreadySent = false;
      try { alreadySent = document.cookie.split('; ').indexOf(cookieKey + '=1') !== -1; } catch (_) {}
      try { alreadySent = alreadySent || localStorage.getItem(storageKey) === '1'; } catch (_) {}
      if (alreadySent) { window.location.replace(destination); return; }

      try { localStorage.setItem(storageKey, '1'); } catch (_) {}
      try { document.cookie = cookieKey + '=1; Max-Age=31536000; Path=/; SameSite=Lax; Secure'; } catch (_) {}

      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        window.location.replace(destination);
      }
      setTimeout(finish, 800);
      try {
        gtag('event', 'conversion', {
          'send_to': 'AW-18403408626/B50JCN_c24EdEPL1tsdE',
          'value': ${value},
          'currency': 'BRL',
          'transaction_id': transactionId,
          'event_callback': finish
        });
      } catch (_) { finish(); }
    })();
  </script>
</body>
</html>`;
}