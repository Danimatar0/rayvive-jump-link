/**
 * Product Catalog
 *
 * Typed accessor over src/data/products.json. Everything that needs product
 * data — cart, checkout, pixel events, structured data — reads it through here
 * so there is one definition of what a product is.
 *
 * Prices in products.json are display strings ("$16.99"); this module exposes
 * the parsed numeric price for arithmetic. The browser price is never
 * authoritative — Apps Script recalculates the order total server-side.
 */
import productsData from "@/data/products.json";
import { resolveProductImage } from "@/lib/productImages";
import { MAX_QUANTITY_PER_LINE } from "@/config/commerce";

export interface VariantOption {
  id: string;
  label: string;
  swatchClass?: string;
}

export interface VariantGroup {
  /** Key used in a VariantSelection, e.g. "speed". */
  id: string;
  label: string;
  options: VariantOption[];
}

/** A chosen variant, e.g. { speed: "nova-white", beaded: "vesper" }. */
export type VariantSelection = Record<string, string>;

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  /** Canonical site path for this product. */
  url: string;
  price: number;
  originalPrice?: number;
  currency: string;
  /** Display string straight from products.json, e.g. "$16.99". */
  priceLabel: string;
  description: string;
  features: string[];
  highlights: string[];
  emoji: string;
  listImage?: string;
  images: string[];
  categories: string[];
  popular: boolean;
  /** True when the product cannot currently be bought. */
  soldOut: boolean;
  /** Units in stock; null means untracked / unlimited. */
  stock: number | null;
  variantGroups: VariantGroup[];
}

interface RawProduct {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  listImage?: string;
  detailsImage?: string;
  detailsImages?: string[];
  features?: string[];
  highlights?: string[];
  description?: string;
  popular?: boolean;
  soldOut?: boolean;
  stock?: number | null;
  categories?: string[];
  comboOptions?: Record<string, VariantOption[]>;
}

const RAW = productsData as unknown as Record<string, RawProduct>;

/** Human labels for the variant groups declared in products.json. */
const VARIANT_GROUP_LABELS: Record<string, string> = {
  speed: "Speed Rope Color",
  beaded: "Beaded Rope Color",
};

/** Turns a display price like "$16.99" into 16.99. Returns 0 if unparseable. */
export function parsePriceString(price: string | undefined): number {
  if (!price) return 0;
  const value = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function toCatalogProduct(raw: RawProduct): CatalogProduct {
  const images = (raw.detailsImages ?? [raw.detailsImage])
    .filter((f): f is string => Boolean(f))
    .map((f) => resolveProductImage(f))
    .filter((url): url is string => Boolean(url));

  const variantGroups: VariantGroup[] = Object.entries(raw.comboOptions ?? {}).map(
    ([groupId, options]) => ({
      id: groupId,
      label: VARIANT_GROUP_LABELS[groupId] ?? groupId,
      options,
    })
  );

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.id,
    url: `/product/${raw.id}`,
    price: parsePriceString(raw.price),
    originalPrice: raw.originalPrice ? parsePriceString(raw.originalPrice) : undefined,
    currency: "USD",
    priceLabel: raw.price,
    description: raw.description ?? "",
    features: raw.features ?? [],
    highlights: raw.highlights ?? [],
    emoji: raw.image,
    listImage: resolveProductImage(raw.listImage),
    images,
    categories: raw.categories ?? [],
    popular: Boolean(raw.popular),
    soldOut: Boolean(raw.soldOut),
    stock: raw.stock ?? null,
    variantGroups,
  };
}

let cache: CatalogProduct[] | null = null;

export function getAllProducts(): CatalogProduct[] {
  if (!cache) cache = Object.values(RAW).map(toCatalogProduct);
  return cache;
}

export function getProduct(id: string | undefined): CatalogProduct | undefined {
  if (!id) return undefined;
  return getAllProducts().find((p) => p.id === id);
}

/** Whether the product can be added to the cart at all. */
export function isPurchasable(product: CatalogProduct): boolean {
  if (product.soldOut) return false;
  if (product.stock !== null && product.stock <= 0) return false;
  return true;
}

/** Largest quantity that may be ordered for one line. */
export function maxQuantityFor(product: CatalogProduct): number {
  if (product.stock === null) return MAX_QUANTITY_PER_LINE;
  return Math.max(0, Math.min(MAX_QUANTITY_PER_LINE, product.stock));
}

/** True when every variant group has a selection. */
export function isVariantSelectionComplete(
  product: CatalogProduct,
  selection: VariantSelection
): boolean {
  return product.variantGroups.every((group) => {
    const chosen = selection[group.id];
    return Boolean(chosen) && group.options.some((o) => o.id === chosen);
  });
}

/**
 * Human-readable variant, e.g. "Nova White + Vesper".
 * Empty string for products without variants.
 */
export function describeVariant(
  product: CatalogProduct,
  selection: VariantSelection
): string {
  return product.variantGroups
    .map((group) => group.options.find((o) => o.id === selection[group.id])?.label)
    .filter(Boolean)
    .join(" + ");
}

/**
 * Stable identity for a cart line. Two entries of the same product with
 * different variants are separate lines; the same variant merges.
 */
export function buildLineId(productId: string, selection: VariantSelection): string {
  const parts = Object.keys(selection)
    .sort()
    .map((key) => `${key}:${selection[key]}`)
    .join("|");
  return parts ? `${productId}::${parts}` : productId;
}
