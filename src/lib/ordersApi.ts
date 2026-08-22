/**
 * Orders API client
 *
 * Talks to the Google Apps Script Web App defined by VITE_ORDERS_API_URL
 * (see apps-script/Code.gs and docs/ORDERS_SETUP.md).
 *
 * Why Content-Type is text/plain: Apps Script cannot respond to a CORS
 * preflight OPTIONS request. text/plain is a CORS-safelisted content type, so
 * the browser skips the preflight entirely and we can still read the JSON
 * response — which `mode: 'no-cors'` would make impossible. The body is JSON
 * regardless; Apps Script reads it from e.postData.contents.
 */
import type { VariantSelection } from "@/lib/catalog";

const API_URL = import.meta.env.VITE_ORDERS_API_URL as string | undefined;
const REQUEST_TIMEOUT_MS = 30_000;

export interface OrderItem {
  productId: string;
  name: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  orderId: string;
  orderDate: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  customer: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
  };
  shipping: {
    country: string;
    city: string;
    area: string;
    address: string;
    building: string;
    notes: string;
  };
  items?: OrderItem[];
  itemsSummary?: string;
  itemCount?: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPage?: string;
  referrer?: string;
  createdAt?: string;
}

/** Error carrying the machine-readable code the Apps Script returned. */
export class OrdersApiError extends Error {
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "OrdersApiError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function isOrdersApiConfigured(): boolean {
  return Boolean(API_URL);
}

interface ApiEnvelope {
  ok: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  [key: string]: unknown;
}

async function post<T extends ApiEnvelope>(body: Record<string, unknown>): Promise<T> {
  if (!API_URL) {
    throw new OrdersApiError(
      "NOT_CONFIGURED",
      "Online ordering is not configured yet. Please contact us on WhatsApp to place your order."
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      // Safelisted content type — see the note at the top of this file.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (error) {
    // Network failure, DNS, offline, or the 30s timeout elapsed.
    const aborted = error instanceof DOMException && error.name === "AbortError";
    throw new OrdersApiError(
      aborted ? "TIMEOUT" : "NETWORK_ERROR",
      aborted
        ? "The request took too long. Please check your connection and try again."
        : "We couldn't reach our server. Please check your connection and try again."
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new OrdersApiError(
      "HTTP_" + response.status,
      "Our server returned an unexpected response. Please try again."
    );
  }

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch {
    throw new OrdersApiError(
      "BAD_RESPONSE",
      "Our server returned an unreadable response. Please try again."
    );
  }

  if (!data.ok) {
    throw new OrdersApiError(
      data.error ?? "UNKNOWN_ERROR",
      data.message ?? "Something went wrong. Please try again.",
      data.fieldErrors
    );
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                    */
/* -------------------------------------------------------------------------- */

export interface SubmitOrderInput {
  /** Stable per checkout attempt — makes a retry or double-click idempotent. */
  clientRequestId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shipping: {
    city: string;
    area: string;
    address: string;
    building?: string;
    notes?: string;
  };
  paymentMethod: string;
  items: Array<{
    productId: string;
    variant: VariantSelection;
    quantity: number;
    /** Sent for cross-checking only; the server always uses its own price. */
    unitPrice: number;
  }>;
  attribution: Record<string, string>;
}

export interface SubmitOrderResult {
  order: Order;
  /** True when the server recognised this as a repeat of an existing order. */
  duplicate: boolean;
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  const data = await post<ApiEnvelope & { order: Order; duplicate?: boolean }>({
    action: "createOrder",
    ...input,
  });

  return { order: data.order, duplicate: Boolean(data.duplicate) };
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

export async function adminLogin(password: string): Promise<{ token: string; expiresIn: number }> {
  const data = await post<ApiEnvelope & { token: string; expiresIn: number }>({
    action: "login",
    password,
  });
  return { token: data.token, expiresIn: data.expiresIn };
}

export async function listOrders(token: string): Promise<{
  orders: Order[];
  statuses: string[];
  paymentStatuses: string[];
}> {
  const data = await post<
    ApiEnvelope & { orders: Order[]; statuses: string[]; paymentStatuses: string[] }
  >({ action: "listOrders", token });

  return {
    orders: data.orders,
    statuses: data.statuses,
    paymentStatuses: data.paymentStatuses,
  };
}

export async function getOrder(token: string, orderId: string): Promise<Order> {
  const data = await post<ApiEnvelope & { order: Order }>({
    action: "getOrder",
    token,
    orderId,
  });
  return data.order;
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  changes: { orderStatus?: string; paymentStatus?: string }
): Promise<void> {
  await post({ action: "updateOrderStatus", token, orderId, ...changes });
}

/** RFC4122-ish id used for checkout idempotency. */
export function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
