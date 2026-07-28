import { describe, expect, it } from 'vitest';

import { SITE_HOST, SITE_URL } from './site';

describe('site identity', () => {
  it('uses typing.abjr.dev as the canonical origin', () => {
    expect(SITE_URL).toBe('https://typing.abjr.dev');
    expect(SITE_HOST).toBe('typing.abjr.dev');
    expect(SITE_URL).not.toMatch(/typings/);
  });
});
