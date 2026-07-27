import { describe, expect, it } from 'vitest';

import { resolveTarget, type TargetCandidate } from './targeting';

function candidate(overrides: Partial<TargetCandidate> = {}): TargetCandidate {
  return { id: 'a', word: 'apple', y: 0.5, x: 0.5, typed: '', ...overrides };
}

describe('resolveTarget', () => {
  it('locks onto the lowest word whose first character was typed', () => {
    // The most urgent threat is the one nearest the floor, so typing its first
    // letter must claim it rather than a safer word higher up.
    const high = candidate({ id: 'high', word: 'apple', y: 0.2 });
    const low = candidate({ id: 'low', word: 'anchor', y: 0.8 });

    expect(resolveTarget([high, low], null, 'a')).toEqual({
      targetId: 'low',
      accepted: true,
    });
  });

  it('keeps the lock while a word is being typed, even as a lower word appears', () => {
    const locked = candidate({ id: 'locked', word: 'apple', y: 0.3, typed: 'ap' });
    const lower = candidate({ id: 'lower', word: 'pear', y: 0.9 });

    expect(resolveTarget([locked, lower], 'locked', 'p')).toEqual({
      targetId: 'locked',
      accepted: true,
    });
  });

  it('refuses to retarget on a mistyped character, so progress never teleports', () => {
    // 'p' would match the other word's first letter. Re-acquiring here would
    // move the player's half-typed progress to a different word, which reads as
    // the game cheating rather than as their mistake.
    const locked = candidate({ id: 'locked', word: 'apple', typed: 'a' });
    const other = candidate({ id: 'other', word: 'pear', y: 0.9 });

    expect(resolveTarget([locked, other], 'locked', 'z')).toEqual({
      targetId: 'locked',
      accepted: false,
    });
  });

  it('breaks a tie between equally low words by horizontal position', () => {
    const right = candidate({ id: 'right', word: 'apple', y: 0.5, x: 0.9 });
    const left = candidate({ id: 'left', word: 'anchor', y: 0.5, x: 0.1 });

    expect(resolveTarget([right, left], null, 'a').targetId).toBe('left');
  });

  it('breaks a fully symmetric tie by id, so resolution is deterministic', () => {
    const b = candidate({ id: 'b', word: 'apple', y: 0.5, x: 0.5 });
    const a = candidate({ id: 'a', word: 'anchor', y: 0.5, x: 0.5 });

    expect(resolveTarget([b, a], null, 'a').targetId).toBe('a');
  });

  it('treats a keystroke matching no candidate as an error rather than ignoring it', () => {
    const only = candidate({ word: 'apple' });

    expect(resolveTarget([only], null, 'z')).toEqual({ targetId: null, accepted: false });
  });

  it('releases the lock when the targeted word is no longer on screen', () => {
    // The word hit the floor and was removed; the next keystroke must be free
    // to acquire rather than judged against a word that no longer exists.
    const remaining = candidate({ id: 'remaining', word: 'pear' });

    expect(resolveTarget([remaining], 'gone', 'p')).toEqual({
      targetId: 'remaining',
      accepted: true,
    });
  });

  it('ignores case for language wordlists', () => {
    const only = candidate({ word: 'Apple' });

    expect(resolveTarget([only], null, 'a', false).accepted).toBe(true);
  });

  it('respects case for code wordlists, where capitals are the point', () => {
    const only = candidate({ word: 'Apple' });

    expect(resolveTarget([only], null, 'a', true).accepted).toBe(false);
    expect(resolveTarget([only], null, 'A', true).accepted).toBe(true);
  });

  it('returns no target when nothing is on screen', () => {
    expect(resolveTarget([], null, 'a')).toEqual({ targetId: null, accepted: false });
  });
});
