/**
 * Pure ad-block detection for unit testing.
 *
 * The browser script in `AdBlockGuard.astro` mirrors this logic inline so it
 * can run without a bundled module. Keep the two in sync.
 */

export interface AdBlockBait {
  readonly offsetHeight: number;
  readonly offsetParent: Element | null;
}

export function isAdBlockActive(bait: AdBlockBait, adsbygoogle: unknown): boolean {
  if (bait.offsetHeight === 0 || bait.offsetParent === null) return true;
  if (typeof adsbygoogle === 'undefined') return true;
  return false;
}
