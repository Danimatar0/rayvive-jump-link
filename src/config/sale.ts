/**
 * Black November sale window.
 *
 * The end time carries an explicit +02:00 offset (Beirut in November) so the
 * sale ends at the same moment for every visitor, whatever their timezone.
 * After SALE_END the banner and the bundles section hide themselves.
 * Prices are NOT date-driven: they live in products.json and apps-script/Code.gs.
 */
export const SALE_END = new Date("2026-11-30T23:59:59+02:00");

/** Product ids featured in the Black November bundles section, in display order. */
export const SALE_BUNDLE_IDS = ["combo-package", "speed-duo", "beaded-duo"] as const;

export function isSaleActive(now: Date = new Date()): boolean {
  return now.getTime() <= SALE_END.getTime();
}
