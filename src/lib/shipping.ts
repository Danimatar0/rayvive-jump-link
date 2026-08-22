/**
 * Order Totals
 *
 * The ONE place the browser computes subtotal / shipping / total. No component
 * may do its own price maths — import from here instead.
 *
 * This mirrors calculateTotals() in apps-script/Code.gs. The Apps Script copy is
 * authoritative: whatever the browser shows, the order is written to Sheets using
 * the server's numbers.
 */
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_ZONES,
  getCity,
  round2,
  type ShippingZoneId,
} from "@/config/commerce";

export interface PricedLine {
  unitPrice: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  total: number;
  /** True when shipping was waived by the free-shipping threshold. */
  freeShippingApplied: boolean;
}

/** Line total for a single cart row. */
export function lineTotal(line: PricedLine): number {
  return round2(line.unitPrice * line.quantity);
}

/** Sum of all line totals, before shipping. */
export function calculateSubtotal(lines: PricedLine[]): number {
  return round2(lines.reduce((sum, line) => sum + lineTotal(line), 0));
}

/**
 * Shipping fee for a zone.
 * @param zoneId - delivery zone, or null when the customer hasn't chosen a city yet
 * @param subtotal - used only for the free-shipping threshold
 * @returns the fee, or null when the zone is not yet known
 */
export function calculateShipping(
  zoneId: ShippingZoneId | null,
  subtotal: number
): number | null {
  if (!zoneId) return null;

  const zone = SHIPPING_ZONES.find((z) => z.id === zoneId);
  if (!zone) return null;

  if (FREE_SHIPPING_THRESHOLD !== null && subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return zone.fee;
}

/**
 * Full totals for an order.
 * When the zone is unknown, shipping is treated as 0 for display and the caller
 * shows "calculated at checkout" instead of a figure.
 */
export function calculateTotals(
  lines: PricedLine[],
  zoneId: ShippingZoneId | null
): OrderTotals {
  const subtotal = calculateSubtotal(lines);
  const shipping = calculateShipping(zoneId, subtotal) ?? 0;
  const freeShippingApplied =
    FREE_SHIPPING_THRESHOLD !== null && subtotal >= FREE_SHIPPING_THRESHOLD;

  return {
    subtotal,
    shipping,
    total: round2(subtotal + shipping),
    freeShippingApplied,
  };
}

/** Resolves a checkout city id to its shipping zone. */
export function zoneForCity(cityId: string | undefined): ShippingZoneId | null {
  return cityId ? getCity(cityId)?.zone ?? null : null;
}

/** Short description of shipping cost for display, e.g. "Beirut $4 · elsewhere $5". */
export function shippingSummaryLabel(): string {
  return SHIPPING_ZONES.map((z) => `${z.label} $${z.fee}`).join(" · ");
}
