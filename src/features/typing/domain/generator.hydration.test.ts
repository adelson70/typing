import { describe, expect, it } from 'vitest';

import { generateWords } from './generator';

/**
 * Regression tests for the SSR hydration mismatch (React #418).
 *
 * `generateWords` without a seed derives one from `Date.now()`. On a
 * prerendered page the server produces one word list and the client produces a
 * different one milliseconds later, so React discards the server HTML and warns.
 *
 * The fix is that the *component* must not generate words during render — it
 * generates them after mount. These tests pin the generator behaviour that
 * makes the distinction meaningful.
 */

describe('generator determinism (hydration safety)', () => {
  it('produces identical output for the same seed', () => {
    // A seeded call is hydration-safe: server and client agree.
    const server = generateWords({ sourceId: 'english-200', count: 30, seed: 12345 });
    const client = generateWords({ sourceId: 'english-200', count: 30, seed: 12345 });

    expect(client).toEqual(server);
  });

  it('produces different output across unseeded calls', () => {
    // This is the property that makes unseeded generation unsafe to run during
    // SSR *and* during the first client render — the two will not match.
    const first = generateWords({ sourceId: 'english-200', count: 30 });
    const second = generateWords({ sourceId: 'english-200', count: 30 });

    expect(second).not.toEqual(first);
  });
});
