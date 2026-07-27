/**
 * Real code snippets, with real structure.
 *
 * This is the deliberate point of difference. The leading platforms either strip
 * code to a bag of isolated keywords — Monkeytype's `code_python.json` contains
 * `"__init__"`, `"append"`, `"class"` with no entry containing a space, newline
 * or tab — or auto-skip the whitespace entirely, which users have complained
 * breaks the muscle memory they came to train.
 *
 * Neither trains what actually slows a developer down: the symbol reaches, the
 * paired delimiters, and the constant switching between the alphabetic centre of
 * the keyboard and its punctuation edges, inside code that has shape.
 *
 * Snippets are chosen for symbol density rather than elegance. Each is short
 * enough to finish in a sitting and self-contained enough to read.
 */

export type SnippetLanguage = 'javascript' | 'python' | 'sql' | 'html' | 'css';

export interface CodeSnippet {
  readonly id: string;
  readonly language: SnippetLanguage;
  /** Spaces per indent level. Drives the auto-indent step. */
  readonly indentWidth: number;
  /** Raw lines, leading whitespace preserved exactly as typed. */
  readonly lines: readonly string[];
}

export const CODE_SNIPPETS: readonly CodeSnippet[] = [
  {
    id: 'js-debounce',
    language: 'javascript',
    indentWidth: 2,
    lines: [
      'function debounce(fn, delay = 300) {',
      '  let timer = null;',
      '  return (...args) => {',
      '    clearTimeout(timer);',
      '    timer = setTimeout(() => fn(...args), delay);',
      '  };',
      '}',
    ],
  },
  {
    id: 'js-fetch',
    language: 'javascript',
    indentWidth: 2,
    lines: [
      'async function loadUser(id) {',
      '  const res = await fetch(`/api/users/${id}`);',
      '  if (!res.ok) {',
      '    throw new Error(`Failed: ${res.status}`);',
      '  }',
      '  const { name, email } = await res.json();',
      '  return { name, email };',
      '}',
    ],
  },
  {
    id: 'js-reduce',
    language: 'javascript',
    indentWidth: 2,
    lines: [
      'const totals = orders.reduce((acc, order) => {',
      '  const key = order.customerId;',
      '  acc[key] = (acc[key] ?? 0) + order.amount;',
      '  return acc;',
      '}, {});',
    ],
  },
  {
    id: 'py-dataclass',
    language: 'python',
    indentWidth: 4,
    lines: [
      'class Account:',
      '    def __init__(self, owner, balance=0):',
      '        self.owner = owner',
      '        self.balance = balance',
      '',
      '    def withdraw(self, amount):',
      '        if amount > self.balance:',
      '            raise ValueError("insufficient funds")',
      '        self.balance -= amount',
      '        return self.balance',
    ],
  },
  {
    id: 'py-comprehension',
    language: 'python',
    indentWidth: 4,
    lines: [
      'def summarise(records):',
      '    active = [r for r in records if r["status"] == "active"]',
      '    by_name = {r["name"]: r["score"] for r in active}',
      '    top = sorted(by_name.items(), key=lambda kv: -kv[1])',
      '    return f"{len(active)} active, top={top[:3]}"',
    ],
  },
  {
    id: 'sql-report',
    language: 'sql',
    indentWidth: 2,
    lines: [
      'SELECT c.name, COUNT(o.id) AS orders, SUM(o.total) AS revenue',
      'FROM customers c',
      '  INNER JOIN orders o ON o.customer_id = c.id',
      'WHERE o.created_at >= NOW() - INTERVAL 30 DAY',
      'GROUP BY c.id, c.name',
      'HAVING COUNT(o.id) > 3',
      'ORDER BY revenue DESC',
      'LIMIT 20;',
    ],
  },
  {
    id: 'html-card',
    language: 'html',
    indentWidth: 2,
    lines: [
      '<article class="card">',
      '  <h2 class="card__title">Typing Studio</h2>',
      '  <p class="card__body">Practice that measures everything.</p>',
      '  <a href="/typing-test/" aria-label="Start test">',
      '    Start',
      '  </a>',
      '</article>',
    ],
  },
  {
    id: 'css-layout',
    language: 'css',
    indentWidth: 2,
    lines: [
      '.grid {',
      '  display: grid;',
      '  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));',
      '  gap: clamp(1rem, 2vw, 2rem);',
      '}',
      '',
      '.grid > .card:hover {',
      '  transform: translateY(-2px);',
      '}',
    ],
  },
];

const BY_LANGUAGE = new Map<SnippetLanguage, CodeSnippet[]>();
for (const snippet of CODE_SNIPPETS) {
  const list = BY_LANGUAGE.get(snippet.language) ?? [];
  list.push(snippet);
  BY_LANGUAGE.set(snippet.language, list);
}

export function getSnippetsFor(language: SnippetLanguage): readonly CodeSnippet[] {
  return BY_LANGUAGE.get(language) ?? [];
}

/**
 * Picks a snippet deterministically from a seed.
 *
 * Seeded rather than random so the daily challenge and any shared result
 * reproduce the same prompt, matching how the word generator already works.
 */
export function pickSnippet(
  language: SnippetLanguage,
  seed: number,
): CodeSnippet | undefined {
  const pool = getSnippetsFor(language);
  if (pool.length === 0) return undefined;
  return pool[Math.abs(seed) % pool.length];
}

/** Leading whitespace of a line, which the engine auto-inserts. */
export function leadingWhitespace(line: string): string {
  return /^[ \t]*/.exec(line)?.[0] ?? '';
}
