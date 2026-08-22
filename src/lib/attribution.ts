/**
 * Campaign Attribution
 *
 * Captures UTM parameters and the Meta click id (fbclid) the first time a
 * visitor lands, then keeps them until an order is placed so Google Sheets can
 * show which ad produced which sale.
 *
 * First-touch wins: if someone arrives from an ad, browses, leaves and comes
 * back directly, the order is still credited to the ad. A later visit carrying
 * *new* UTM parameters does overwrite, because that is a new campaign click.
 */

const STORAGE_KEY = "rayvive_attribution_v1";

export interface Attribution {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid: string;
  /** Full URL of the first page the visitor landed on. */
  landingPage: string;
  referrer: string;
  capturedAt: string;
}

const EMPTY: Attribution = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  fbclid: "",
  landingPage: "",
  referrer: "",
  capturedAt: "",
};

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    return null;
  }
}

function write(attribution: Attribution): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Private browsing or a full quota — attribution is best-effort, never fatal.
  }
}

/**
 * Reads campaign parameters from the current URL and stores them if this is a
 * fresh campaign click or the first visit. Safe to call on every navigation.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const incoming = {
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    utmContent: params.get("utm_content") ?? "",
    utmTerm: params.get("utm_term") ?? "",
    fbclid: params.get("fbclid") ?? "",
  };

  const hasCampaignParams = Object.values(incoming).some(Boolean);
  const existing = readStored();

  // Already recorded and this navigation carries nothing new — keep first touch.
  if (existing && !hasCampaignParams) return;

  write({
    ...incoming,
    landingPage: existing && !hasCampaignParams
      ? existing.landingPage
      : window.location.href,
    referrer: existing && !hasCampaignParams
      ? existing.referrer
      : document.referrer || "",
    capturedAt: new Date().toISOString(),
  });
}

/** Current attribution, or blanks when nothing was ever captured. */
export function getAttribution(): Attribution {
  return readStored() ?? { ...EMPTY, landingPage: typeof window !== "undefined" ? window.location.href : "" };
}

/**
 * Reads the Meta browser id cookie (_fbp) that fbevents.js sets.
 * Sent with the order so a future Conversions API integration can match it.
 */
export function getFbp(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

/** Human label for where the order came from, used in the Source column. */
export function describeSource(attribution: Attribution): string {
  if (attribution.utmSource) {
    return attribution.utmMedium
      ? `${attribution.utmSource} / ${attribution.utmMedium}`
      : attribution.utmSource;
  }
  if (attribution.fbclid) return "facebook / paid";
  if (attribution.referrer) {
    try {
      return `referral / ${new URL(attribution.referrer).hostname}`;
    } catch {
      return "referral";
    }
  }
  return "direct";
}
