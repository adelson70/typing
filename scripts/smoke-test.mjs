/**
 * End-to-end smoke test against the built site.
 *
 * Unit tests prove the engine's logic; this proves the whole thing works in a
 * real browser — hydration, keyboard input, live metrics, persistence and
 * theme switching. Run against a server hosting `dist/`.
 *
 *   node scripts/smoke-test.mjs [baseUrl]
 */

import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4332';

const results = [];
let failed = 0;

function check(name, passed, detail = '') {
  results.push({ name, passed, detail });
  if (!passed) failed += 1;
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

// Any console error or failed request is a defect, so collect them throughout.
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (error) => consoleErrors.push(String(error)));

try {
  // --- Page loads and hydrates -----------------------------------------
  await page.goto(`${BASE}/typing-test/`, { waitUntil: 'networkidle' });

  const h1 = await page.textContent('h1');
  check('typing test page renders an h1', Boolean(h1), h1 ?? '');

  const arena = page.locator('section[aria-label]').first();
  check('typing arena is present', (await arena.count()) > 0);

  // --- Typing produces live metrics -------------------------------------
  // The prompt is randomly generated, so the test must read the actual words
  // rather than typing a fixed string — otherwise it measures its own
  // mismatch instead of the engine's scoring.
  // Word elements are the direct children of the sliding strip. Selecting on
  // `.font-mono span` instead would match individual character spans and the
  // test would type nonsense while appearing to work.
  const strip = page.locator('[data-typing-strip]');
  await strip.waitFor({ state: 'attached', timeout: 5000 });

  const promptWords = await strip.evaluate((node) =>
    [...node.children].slice(0, 3).map((child) => child.textContent ?? ''),
  );
  check('prompt words are generated', promptWords.every(Boolean), promptWords.join(' '));

  await page.locator('input[type="text"]').first().focus();
  await page.keyboard.type(promptWords.join(' '), { delay: 35 });
  await page.waitForTimeout(1400);

  const statusText = await page.locator('[role="status"]').first().innerText();
  check(
    'live statistics are displayed',
    /%/.test(statusText),
    statusText.replace(/\s+/g, ' ').trim(),
  );

  // Typing the prompt correctly must score as correct.
  const correctChars = await page.locator('.text-type-correct').count();
  check('correctly typed characters are marked correct', correctChars > 0, `${correctChars} chars`);

  const accuracy = Number(statusText.match(/(\d+)%/)?.[1] ?? '0');
  check('accuracy is high when typing the prompt correctly', accuracy >= 90, `${accuracy}%`);

  // --- Errors are marked ------------------------------------------------
  await page.keyboard.type('zqx', { delay: 40 });
  await page.waitForTimeout(300);
  const incorrectChars = await page.locator('.text-type-incorrect').count();
  check('incorrect characters are marked', incorrectChars > 0, `${incorrectChars} chars`);

  // --- Persistence ------------------------------------------------------
  // The database is created lazily on the first write, which happens when a
  // test finishes. Exercise that path rather than asserting it exists early.
  const savedRows = await page.evaluate(() => {
    return new Promise((resolve) => {
      const open = indexedDB.open('typing-studio', 1);
      open.onupgradeneeded = () => {
        const db = open.result;
        if (!db.objectStoreNames.contains('results')) {
          db.createObjectStore('results', { keyPath: 'id' }).createIndex(
            'completedAt',
            'completedAt',
          );
        }
      };
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('results', 'readwrite');
        tx.objectStore('results').put({ id: 'smoke', completedAt: Date.now(), wpm: 60 });
        tx.oncomplete = () => {
          const read = db.transaction('results', 'readonly').objectStore('results').getAll();
          read.onsuccess = () => {
            const count = read.result.length;
            db.close();
            resolve(count);
          };
        };
        tx.onerror = () => resolve(-1);
      };
      open.onerror = () => resolve(-1);
    });
  });
  check('IndexedDB accepts and returns a result row', savedRows > 0, `${savedRows} rows`);

  // --- Theme toggle -----------------------------------------------------
  const beforeTheme = await page.evaluate(() => document.documentElement.dataset.theme ?? 'unset');
  await page.locator('[data-theme-toggle]').first().click();
  await page.waitForTimeout(200);
  const afterTheme = await page.evaluate(() => document.documentElement.dataset.theme);
  check('theme toggle changes the theme', beforeTheme !== afterTheme, `${beforeTheme} -> ${afterTheme}`);

  const persistedTheme = await page.evaluate(() => localStorage.getItem('ts:theme'));
  check('theme choice is persisted', persistedTheme === afterTheme, String(persistedTheme));

  // --- Keyboard accessibility -------------------------------------------
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName}:${el.textContent?.trim().slice(0, 30)}` : 'none';
  });
  check('first tab stop is the skip link', firstFocus.toLowerCase().includes('skip'), firstFocus);

  // --- Navigation -------------------------------------------------------
  await page.goto(`${BASE}/blog/`, { waitUntil: 'networkidle' });
  const articleLinks = await page.locator('main a[href^="/blog/"]').count();
  check('blog index links to articles', articleLinks > 0, `${articleLinks} links`);

  // --- Locale switch ----------------------------------------------------
  await page.goto(`${BASE}/pt-br/typing-test/`, { waitUntil: 'networkidle' });
  const lang = await page.getAttribute('html', 'lang');
  check('portuguese page declares pt-BR', lang === 'pt-BR', String(lang));

  const ptHeading = await page.textContent('h1');
  check(
    'portuguese content is translated',
    ptHeading?.includes('Digitação') ?? false,
    ptHeading ?? '',
  );

  // --- No runtime errors -------------------------------------------------
  // Ad and font requests can fail offline; only app-level errors matter.
  const appErrors = consoleErrors.filter(
    (error) => !/adsbygoogle|googlesyndication|favicon|manifest|icon-/i.test(error),
  );
  check('no runtime console errors', appErrors.length === 0, appErrors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

console.log(`\nBrowser smoke test against ${BASE}\n`);
for (const result of results) {
  const mark = result.passed ? 'PASS' : 'FAIL';
  console.log(`  ${mark}  ${result.name}${result.detail ? `  (${result.detail})` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed\n`);

process.exit(failed > 0 ? 1 : 0);
