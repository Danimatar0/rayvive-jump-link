/**
 * Commerce Configuration
 *
 * Single source of truth for currency, shipping zones and payment methods.
 *
 * IMPORTANT: the shipping fees and product prices here are for DISPLAY ONLY.
 * The authoritative total is recalculated by the Apps Script order endpoint
 * (apps-script/Code.gs) before the order is written to Google Sheets. If you
 * change a fee here, change the matching value in Code.gs too.
 */

export const STORE = {
  name: "Rayvive",
  currency: "USD",
  currencySymbol: "$",
  country: "Lebanon",
  countryCode: "LB",
} as const;

/** Delivery zones. Fee is per order, not per item. */
export type ShippingZoneId = "beirut" | "outside-beirut";

export interface ShippingZone {
  id: ShippingZoneId;
  label: string;
  fee: number;
}

export const SHIPPING_ZONES: readonly ShippingZone[] = [
  { id: "beirut", label: "Beirut", fee: 4 },
  { id: "outside-beirut", label: "Outside Beirut", fee: 5 },
] as const;

/**
 * Order subtotal above which shipping is free.
 * null = no free-shipping offer (do not advertise one that doesn't exist).
 */
export const FREE_SHIPPING_THRESHOLD: number | null = null;

/**
 * Cities offered at checkout, each mapped to the zone that sets its fee.
 * Governorate-level so the Beirut / outside-Beirut split is unambiguous.
 */
export interface DeliveryCity {
  id: string;
  name: string;
  zone: ShippingZoneId;
}

export const DELIVERY_CITIES: readonly DeliveryCity[] = [
  { id: "beirut", name: "Beirut", zone: "beirut" },
  { id: "mount-lebanon", name: "Mount Lebanon", zone: "outside-beirut" },
  { id: "north-lebanon", name: "North Lebanon", zone: "outside-beirut" },
  { id: "akkar", name: "Akkar", zone: "outside-beirut" },
  { id: "bekaa", name: "Bekaa", zone: "outside-beirut" },
  { id: "baalbek-hermel", name: "Baalbek-Hermel", zone: "outside-beirut" },
  { id: "south-lebanon", name: "South Lebanon", zone: "outside-beirut" },
  { id: "nabatieh", name: "Nabatieh", zone: "outside-beirut" },
] as const;

export function getCity(cityId: string): DeliveryCity | undefined {
  return DELIVERY_CITIES.find((c) => c.id === cityId);
}

/** Payment methods the business actually accepts. */
export interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  /** Value written to the Payment Status column when the order is created. */
  initialPaymentStatus: "COD" | "Pending" | "Paid";
  enabled: boolean;
}

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay the courier in cash when your order arrives.",
    initialPaymentStatus: "COD",
    enabled: true,
  },
] as const;

export const ENABLED_PAYMENT_METHODS = PAYMENT_METHODS.filter((m) => m.enabled);

/** Guard rails on quantities so a typo can't create a 9999-unit order. */
export const MAX_QUANTITY_PER_LINE = 10;
export const MAX_ITEMS_PER_ORDER = 20;

/** Rounds to 2 decimals, avoiding float drift like 20.999999999999996. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Formats a number as a price string, e.g. 16.99 -> "$16.99". */
export function formatMoney(value: number): string {
  return `${STORE.currencySymbol}${round2(value).toFixed(2)}`;
}
