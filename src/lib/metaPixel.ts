/**
 * Meta Pixel Event Helper
 * The base pixel (init + PageView) is loaded from index.html.
 * These helpers fire the conversion events Ads Manager optimizes against.
 */

interface PixelOptions {
  /** Deduplication key. Meta drops a repeat event carrying an eventID it has seen. */
  eventID?: string;
}

declare global {
  interface Window {
    fbq?: (
      command: string,
      event: PixelEvent,
      params?: PixelEventParams,
      options?: PixelOptions
    ) => void;
  }
}

/**
 * Standard Meta events used on this site:
 * - ViewContent: visitor opens a product page — builds retargeting audiences
 * - AddToCart: item successfully added to the cart
 * - InitiateCheckout: visitor reaches the checkout page with a non-empty cart
 * - Purchase: order confirmed by the server — the event campaigns optimize for
 * - Contact: visitor opens WhatsApp with a question
 * - Lead: visitor opens WhatsApp with order intent
 *
 * PageView is deliberately absent: the base pixel covers the first load, and
 * fbevents auto-fires PageView on History API changes, so React Router
 * navigations are already tracked. Firing it here double-counted them.
 */
type PixelEvent =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Contact"
  | "Lead";

/** Per-item breakdown Meta expects on cart and purchase events. */
export interface PixelContent {
  id: string;
  quantity: number;
  item_price: number;
}

interface PixelEventParams {
  content_name?: string;
  content_ids?: string[];
  content_type?: "product";
  contents?: PixelContent[];
  num_items?: number;
  value?: number;
  currency?: string;
  order_id?: string;
}

/**
 * Fires a Meta Pixel event. No-ops when the pixel is blocked or not yet loaded,
 * so tracking can never break a purchase or a WhatsApp handoff.
 */
export function trackPixelEvent(
  event: PixelEvent,
  params?: PixelEventParams,
  options?: PixelOptions
): void {
  try {
    window.fbq?.("track", event, params, options);
  } catch (error) {
    console.error("Failed to track Meta Pixel event:", error);
  }
}

/**
 * Converts a display price like "$16.99" into 16.99 for the event value.
 * @returns The numeric price, or undefined if it can't be parsed
 */
export function parsePrice(price: string): number | undefined {
  const value = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

const PURCHASE_LOG_KEY = "rayvive_purchase_events_v1";

function readFiredOrders(): string[] {
  try {
    const raw = localStorage.getItem(PURCHASE_LOG_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Whether a Purchase event has already been sent for this order in this browser. */
export function hasPurchaseFired(orderId: string): boolean {
  return readFiredOrders().includes(orderId);
}

/**
 * Fires Purchase exactly once per order id.
 *
 * The order id doubles as the Meta eventID, so even if the same order somehow
 * reaches the pixel from two devices, Meta deduplicates it server-side. The
 * localStorage log stops the common case: the customer refreshing /order-success.
 *
 * @returns true if the event was sent, false if it was suppressed as a duplicate
 */
export function trackPurchaseOnce(
  orderId: string,
  params: PixelEventParams
): boolean {
  if (!orderId || hasPurchaseFired(orderId)) return false;

  // Record before firing: a storage write that throws must not cause a
  // re-fire loop, and a double-invocation in React StrictMode must no-op.
  try {
    const fired = readFiredOrders();
    fired.push(orderId);
    // Keep the log small; 50 orders is far more than one browser will place.
    localStorage.setItem(PURCHASE_LOG_KEY, JSON.stringify(fired.slice(-50)));
  } catch {
    // Storage unavailable — still fire, relying on the eventID for dedup.
  }

  trackPixelEvent("Purchase", { ...params, order_id: orderId }, { eventID: orderId });
  return true;
}
