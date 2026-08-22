/**
 * Shopping Cart
 *
 * Persists to localStorage so a refresh (or a return from a Meta ad) keeps the
 * basket. Deliberately stores ONLY product id, variant and quantity — never
 * prices or names. Everything else is rehydrated from the catalog on read, so a
 * price change takes effect immediately and a tampered localStorage entry
 * cannot alter what an order costs.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildLineId,
  describeVariant,
  getProduct,
  isPurchasable,
  maxQuantityFor,
  type CatalogProduct,
  type VariantSelection,
} from "@/lib/catalog";
import { MAX_ITEMS_PER_ORDER } from "@/config/commerce";
import { calculateTotals, lineTotal, type OrderTotals } from "@/lib/shipping";
import type { ShippingZoneId } from "@/config/commerce";

const STORAGE_KEY = "rayvive_cart_v1";

/** What we persist: the minimum needed to rebuild a line. */
interface StoredCartItem {
  lineId: string;
  productId: string;
  variant: VariantSelection;
  quantity: number;
}

/** A cart line joined with live catalog data, ready to render. */
export interface CartLine extends StoredCartItem {
  product: CatalogProduct;
  variantLabel: string;
  unitPrice: number;
  total: number;
  maxQuantity: number;
}

/**
 * Outcome of an add-to-cart attempt.
 *
 * A flat shape rather than a discriminated union because this project compiles
 * with `strict: false`, where narrowing on a boolean literal discriminant does
 * not work. Callers check `ok` and read `reason` when it is false.
 */
export interface AddItemResult {
  ok: boolean;
  /** Why the add was refused. Only set when ok is false. */
  reason?: string;
  /** Identifier of the affected cart line. Only set when ok is true. */
  lineId?: string;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  isEmpty: boolean;
  totals: OrderTotals;
  addItem: (
    product: CatalogProduct,
    variant?: VariantSelection,
    quantity?: number
  ) => AddItemResult;
  removeLine: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  incrementLine: (lineId: string) => void;
  decrementLine: (lineId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadStored(): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry): StoredCartItem[] => {
      const item = entry as Partial<StoredCartItem>;
      if (typeof item?.productId !== "string") return [];
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) return [];
      const variant = (item.variant ?? {}) as VariantSelection;
      return [
        {
          productId: item.productId,
          variant,
          quantity,
          lineId: item.lineId ?? buildLineId(item.productId, variant),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredCartItem[]>(loadStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage full or blocked — the in-memory cart still works this session.
    }
  }, [stored]);

  /**
   * Joins stored entries with the catalog. Products that no longer exist or
   * have gone out of stock silently drop out rather than breaking the page.
   */
  const lines = useMemo<CartLine[]>(() => {
    return stored.flatMap((item): CartLine[] => {
      const product = getProduct(item.productId);
      if (!product || !isPurchasable(product)) return [];

      const maxQuantity = maxQuantityFor(product);
      const quantity = Math.min(item.quantity, maxQuantity);
      if (quantity < 1) return [];

      return [
        {
          ...item,
          quantity,
          product,
          variantLabel: describeVariant(product, item.variant),
          unitPrice: product.price,
          total: lineTotal({ unitPrice: product.price, quantity }),
          maxQuantity,
        },
      ];
    });
  }, [stored]);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  );

  // Shipping needs a delivery zone, which only checkout knows. Cart-level totals
  // therefore show subtotal with shipping omitted; checkout recomputes with the zone.
  const totals = useMemo(() => calculateTotals(lines, null), [lines]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (product, variant = {}, quantity = 1) => {
      if (!isPurchasable(product)) {
        return { ok: false, reason: `${product.name} is currently unavailable.` };
      }

      const lineId = buildLineId(product.id, variant);
      const max = maxQuantityFor(product);
      let result: AddItemResult = { ok: true, lineId };

      setStored((prev) => {
        const existing = prev.find((item) => item.lineId === lineId);
        const distinctLines = existing ? prev.length : prev.length + 1;

        if (distinctLines > MAX_ITEMS_PER_ORDER) {
          result = {
            ok: false,
            reason: `A single order can contain at most ${MAX_ITEMS_PER_ORDER} different items.`,
          };
          return prev;
        }

        if (existing) {
          const next = Math.min(existing.quantity + quantity, max);
          if (next === existing.quantity) {
            result = {
              ok: false,
              reason: `You can order at most ${max} of ${product.name}.`,
            };
            return prev;
          }
          return prev.map((item) =>
            item.lineId === lineId ? { ...item, quantity: next } : item
          );
        }

        return [
          ...prev,
          {
            lineId,
            productId: product.id,
            variant,
            quantity: Math.min(quantity, max),
          },
        ];
      });

      return result;
    },
    []
  );

  const removeLine = useCallback((lineId: string) => {
    setStored((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setStored((prev) =>
      prev.flatMap((item) => {
        if (item.lineId !== lineId) return [item];
        if (quantity < 1) return [];

        const product = getProduct(item.productId);
        const max = product ? maxQuantityFor(product) : 1;
        return [{ ...item, quantity: Math.min(quantity, max) }];
      })
    );
  }, []);

  /**
   * Steps a line's quantity by delta.
   *
   * Works off the functional updater rather than the rendered `lines`, so two
   * clicks landing in the same React batch both apply. Reading the current
   * quantity from a render closure would make the second click a no-op.
   */
  const adjustQuantity = useCallback((lineId: string, delta: number) => {
    setStored((prev) =>
      prev.flatMap((item) => {
        if (item.lineId !== lineId) return [item];

        const next = item.quantity + delta;
        if (next < 1) return [];

        const product = getProduct(item.productId);
        const max = product ? maxQuantityFor(product) : 1;
        return [{ ...item, quantity: Math.min(next, max) }];
      })
    );
  }, []);

  const incrementLine = useCallback(
    (lineId: string) => adjustQuantity(lineId, 1),
    [adjustQuantity]
  );

  const decrementLine = useCallback(
    (lineId: string) => adjustQuantity(lineId, -1),
    [adjustQuantity]
  );

  const clearCart = useCallback(() => setStored([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount,
      isEmpty: lines.length === 0,
      totals,
      addItem,
      removeLine,
      setQuantity,
      incrementLine,
      decrementLine,
      clearCart,
    }),
    [
      lines,
      itemCount,
      totals,
      addItem,
      removeLine,
      setQuantity,
      incrementLine,
      decrementLine,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}

/** Totals including shipping for a known delivery zone. Used by checkout. */
export function useCartTotalsForZone(
  lines: CartLine[],
  zone: ShippingZoneId | null
): OrderTotals {
  return useMemo(() => calculateTotals(lines, zone), [lines, zone]);
}
