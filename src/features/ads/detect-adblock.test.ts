import { describe, expect, it } from 'vitest';

import { isAdBlockActive } from './detect-adblock';

const visibleBait = { offsetHeight: 1, offsetParent: {} as Element };
const hiddenBait = { offsetHeight: 0, offsetParent: {} as Element };
const removedBait = { offsetHeight: 1, offsetParent: null };

describe('isAdBlockActive', () => {
  it('returns false when bait is visible and adsbygoogle exists', () => {
    expect(isAdBlockActive(visibleBait, [])).toBe(false);
  });

  it('returns true when bait has zero height', () => {
    expect(isAdBlockActive(hiddenBait, [])).toBe(true);
  });

  it('returns true when bait has no offset parent', () => {
    expect(isAdBlockActive(removedBait, [])).toBe(true);
  });

  it('returns true when adsbygoogle is undefined', () => {
    expect(isAdBlockActive(visibleBait, undefined)).toBe(true);
  });
});
