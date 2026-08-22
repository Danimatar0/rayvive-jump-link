/**
 * Per-page SEO for a single-page app.
 *
 * index.html carries the site-wide title, description and Open Graph tags.
 * These helpers layer per-product values on top at runtime and restore nothing
 * on unmount — each product page sets its own, and non-product routes fall back
 * to the static markup on a full page load.
 */

const CANONICAL_ID = "canonical-link";
const JSONLD_ID = "product-jsonld";

const SITE_ORIGIN = "https://www.rayvive.fit";

function upsertMeta(selector: string, create: () => HTMLElement): HTMLElement {
  const existing = document.head.querySelector<HTMLElement>(selector);
  if (existing) return existing;

  const element = create();
  document.head.appendChild(element);
  return element;
}

/** Points search engines at the clean product URL, without query parameters. */
export function setCanonical(path: string): void {
  const link = upsertMeta(`link#${CANONICAL_ID}`, () => {
    const el = document.createElement("link");
    el.id = CANONICAL_ID;
    el.rel = "canonical";
    return el;
  }) as HTMLLinkElement;

  link.href = `${SITE_ORIGIN}${path}`;
}

export function setDocumentTitle(title: string): void {
  document.title = title;
}

export function setMetaDescription(description: string): void {
  const meta = upsertMeta('meta[name="description"]', () => {
    const el = document.createElement("meta");
    el.setAttribute("name", "description");
    return el;
  });

  meta.setAttribute("content", description);
}

export interface ProductStructuredData {
  id: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  currency: string;
  inStock: boolean;
  path: string;
}

/**
 * Emits schema.org Product JSON-LD so Google can show price and availability
 * in search results. Replaces any block from a previously viewed product.
 */
export function setProductStructuredData(product: ProductStructuredData): void {
  const script = upsertMeta(`script#${JSONLD_ID}`, () => {
    const el = document.createElement("script");
    el.id = JSONLD_ID;
    el.setAttribute("type", "application/ld+json");
    return el;
  });

  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    productID: product.id,
    sku: product.id,
    name: product.name,
    description: product.description,
    image: product.image ? `${SITE_ORIGIN}${product.image}` : undefined,
    brand: { "@type": "Brand", name: "Rayvive" },
    offers: {
      "@type": "Offer",
      url: `${SITE_ORIGIN}${product.path}`,
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Rayvive" },
    },
  });
}

/** Removes the product JSON-LD when leaving a product page. */
export function clearProductStructuredData(): void {
  document.head.querySelector(`script#${JSONLD_ID}`)?.remove();
}

/** Strips HTML tags from the product description for use in a meta tag. */
export function toPlainText(html: string, maxLength = 155): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}
