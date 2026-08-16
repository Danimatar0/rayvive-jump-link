/**
 * Meta Pixel Event Helper
 * The base pixel (init + PageView) is loaded from index.html.
 * These helpers fire the conversion events Ads Manager optimizes against.
 */

declare global {
  interface Window {
    fbq?: (command: string, event: PixelEvent, params?: PixelEventParams) => void;
  }
}

/**
 * Standard Meta events used on this site:
 * - Contact: visitor opens WhatsApp with a question
 * - Lead: visitor opens WhatsApp with order intent
 */
type PixelEvent = 'Contact' | 'Lead';

interface PixelEventParams {
  content_name?: string;
  value?: number;
  currency?: string;
}

/**
 * Fires a Meta Pixel event. No-ops when the pixel is blocked or not yet loaded,
 * so tracking can never break a WhatsApp handoff.
 */
export function trackPixelEvent(event: PixelEvent, params?: PixelEventParams): void {
  try {
    window.fbq?.('track', event, params);
  } catch (error) {
    console.error('Failed to track Meta Pixel event:', error);
  }
}

/**
 * Converts a display price like "$16.99" into 16.99 for the event value.
 * @returns The numeric price, or undefined if it can't be parsed
 */
export function parsePrice(price: string): number | undefined {
  const value = Number(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}
