import { describe, expect, it } from 'vitest';

import { judgeChar } from './judge';

describe('judgeChar', () => {
  it('accepts a character matching the prompt at that position', () => {
    expect(judgeChar('word', 0, 'w')).toBe('correct');
    expect(judgeChar('word', 3, 'd')).toBe('correct');
  });

  it('rejects a character that differs from the prompt', () => {
    expect(judgeChar('word', 0, 'x')).toBe('incorrect');
  });

  it('reports typing past the end as extra rather than incorrect', () => {
    // A different mistake from a mistyped character: accuracy weighs the two
    // separately, so collapsing them would misreport the error.
    expect(judgeChar('word', 4, 'x')).toBe('extra');
  });

  it('is case sensitive, so code prompts judge capitals correctly', () => {
    expect(judgeChar('Word', 0, 'w')).toBe('incorrect');
    expect(judgeChar('Word', 0, 'W')).toBe('correct');
  });

  it('treats an empty prompt as entirely extra', () => {
    expect(judgeChar('', 0, 'a')).toBe('extra');
  });
});
