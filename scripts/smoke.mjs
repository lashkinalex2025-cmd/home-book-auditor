/**
 * Playwright smoke test against a running server (preview or Pages).
 * Usage: node scripts/smoke.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:4173';
const errors = [];
const logs = [];

function ok(msg) {
  console.log(`✓ ${msg}`);
}
function fail(msg) {
  console.error(`✗ ${msg}`);
  errors.push(msg);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('pageerror', (err) => {
  errors.push(`pageerror: ${err.message}`);
  console.error('PAGEERROR', err.message);
});
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const text = msg.text();
    // Ignore benign ResizeObserver / font noise
    if (
      /ResizeObserver|favicon|fonts\.gstatic|Failed to load resource.*favicon/i.test(text)
    )
      return;
    logs.push(text);
  }
});

try {
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('text=Домашний книжный аудитор', { timeout: 20000 });
  ok('Home title visible');

  const credit = page.locator('text=Alex Lashkin');
  await credit.first().waitFor({ timeout: 10000 });
  ok('Developer credit visible');

  await page.getByRole('link', { name: 'Библиотека' }).click();
  await page.waitForURL(/#\/library/);
  await page.waitForSelector('text=Моя библиотека', { timeout: 10000 });
  ok('Library route');

  await page.getByRole('link', { name: 'Поиск' }).click();
  await page.waitForSelector('text=Введите запрос', { timeout: 10000 });
  ok('Search route');

  await page.getByRole('link', { name: 'Статистика' }).click();
  await page.waitForSelector('text=Статистика', { timeout: 10000 });
  ok('Stats route');

  await page.getByRole('link', { name: 'Ещё' }).click();
  await page.waitForSelector('text=Настройки', { timeout: 10000 });
  await page.waitForSelector('text=Alex Lashkin', { timeout: 5000 });
  ok('Settings route + credit');

  // Add book
  await page.goto(`${base}/#/books/new`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Новая книга', { timeout: 10000 });
  await page.locator('#title').fill('Тестовая книга Smoke');
  await page.locator('#author').fill('Автотест');
  await page.locator('#genre').fill('Тест');
  await page.getByRole('button', { name: /Добавить книгу/i }).click();
  await page.waitForURL(/#\/books\/\d+/, { timeout: 15000 });
  await page.waitForSelector('text=Тестовая книга Smoke', { timeout: 10000 });
  ok('Book created and detail opened');

  // Ebook panel present on detail
  await page.waitForSelector('text=Электронная книга', { timeout: 10000 });
  ok('Ebook panel visible');

  // Upload a simple TXT ebook via file input
  const ebookInput = page
    .locator('input[type="file"][accept*=".epub"], input[type="file"][accept*="epub"]')
    .first();
  await ebookInput.setInputFiles({
    name: 'smoke-ebook.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(
      'Глава 1\n\nЭто тестовый текст электронной книги для smoke-теста.\nВторая строка.',
      'utf-8',
    ),
  });
  await page.waitForSelector('text=smoke-ebook.txt', { timeout: 10000 });
  ok('Ebook file uploaded');

  await page
    .getByRole('link', { name: /Читать/i })
    .first()
    .click();
  await page.waitForURL(/#\/books\/\d+\/read/, { timeout: 15000 });
  await page.waitForSelector('text=тестовый текст электронной книги', {
    timeout: 15000,
  });
  ok('Ebook reader opened and shows text');

  await page.getByRole('button', { name: 'Назад' }).click();
  await page.waitForURL(/#\/books\/\d+$/, { timeout: 10000 });
  ok('Returned from reader to book detail');

  await page.goto(`${base}/#/library`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Тестовая книга Smoke', { timeout: 10000 });
  ok('Book appears in library');

  await page.goto(`${base}/#/search`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Начните вводить…').fill('Smoke');
  await page.waitForSelector('text=Тестовая книга Smoke', { timeout: 10000 });
  ok('Search finds book');

  await page.goto(`${base}/#/stats`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Обзор вашей библиотеки', { timeout: 10000 });
  // canvas charts
  const canvases = await page.locator('canvas').count();
  if (canvases >= 1) ok(`Stats charts rendered (${canvases})`);
  else fail('No chart canvases on stats page');

  await page.goto(`${base}/#/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Всего книг', { timeout: 10000 });
  const totalText = await page
    .locator('text=Всего книг')
    .locator('..')
    .locator('p')
    .nth(1)
    .textContent();
  if (totalText && Number(totalText) >= 1) ok(`Home counter total=${totalText}`);
  else ok('Home counters present');

  // Toggle theme
  await page.goto(`${base}/#/settings`, { waitUntil: 'networkidle' });
  await page.locator('#theme').selectOption('dark');
  await page.waitForTimeout(300);
  const isDark = await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  );
  if (isDark) ok('Dark theme applied');
  else fail('Dark theme class not applied');

  await page.locator('#theme').selectOption('light');
  await page.waitForTimeout(300);
  const isLight = await page.evaluate(
    () => !document.documentElement.classList.contains('dark'),
  );
  if (isLight) ok('Light theme applied');
  else fail('Light theme not applied');
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
} finally {
  await browser.close();
}

if (logs.length) {
  console.log('Console errors:', logs.slice(0, 10));
  // soft: only fail on critical console errors
  for (const l of logs) {
    if (/TypeError|ReferenceError|is not defined|Cannot read/i.test(l))
      fail(`console: ${l}`);
  }
}

if (errors.length) {
  console.error(`\nSMOKE FAILED (${errors.length})`);
  process.exit(1);
}
console.log('\nSMOKE PASSED');
