import { test, expect } from '@playwright/test';

// Button / interactive element audit
// - Visits the app root
// - Collects interactive elements (button, [role=button], anchors)
// - Attempts to click or validate each element safely
// - Records console errors, page errors, and failed requests

test.setTimeout(120000);

test('button and interactive elements audit', async ({ page, browserName }) => {
  const base = 'http://localhost:3000';
  const issues: string[] = [];
  const requestsFailed: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('requestfailed', (request) => {
    requestsFailed.push(`${request.method()} ${request.url()} -> ${request.failure()?.errorText || 'failed'}`);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(String(err));
  });

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Tag interactive elements with stable attributes so we can re-query safely
  const elements = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('button, [role="button"], a[href], [data-testid], input[type="button"], input[type="submit"]'));
    return list.map((el, i) => {
      (el as HTMLElement).setAttribute('data-playwright-audit-index', String(i));
      return {
        index: i,
        tag: el.tagName.toLowerCase(),
        text: ((el as HTMLElement).innerText || el.getAttribute('aria-label') || '').trim().slice(0, 80),
        selector: `[data-playwright-audit-index="${i}"]`,
        href: (el as HTMLAnchorElement).href || null,
        visible: (el as HTMLElement).offsetParent !== null,
        disabled: ((el as HTMLButtonElement).disabled === true) || false,
      };
    });
  });

  const summary: Array<{ index: number; tag: string; text: string; selector: string; href?: string | null; disabled?: boolean; visible: boolean; actionResult?: string }> = [];

  for (let i = 0; i < elements.length; i++) {
    const info = elements[i];
    const selector = info.selector;
    const locator = page.locator(selector);
    const item = { index: info.index, tag: info.tag, text: info.text, selector, href: info.href, disabled: info.disabled, visible: info.visible } as any;

    if (!info.visible) {
      item.actionResult = 'skipped (not visible)';
      summary.push(item);
      continue;
    }
    if (info.disabled) {
      item.actionResult = 'skipped (disabled)';
      summary.push(item);
      continue;
    }

    try {
      const beforeUrl = page.url();
      if (info.href) {
        const href = info.href;
        const isInternal = href.startsWith('/') || href.startsWith(base) || href.startsWith('http://localhost');
        if (isInternal) {
          await page.goto(href, { waitUntil: 'networkidle', timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(300);
          if (page.url() !== beforeUrl) {
            item.actionResult = `navigated to ${page.url()}`;
            await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
            await page.waitForTimeout(200);
          } else {
            // attempt click as fallback
            await locator.click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(300);
            item.actionResult = `clicked (no navigation)`;
            if (page.url() !== beforeUrl) {
              item.actionResult = `clicked and navigated to ${page.url()}`;
              await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
              await page.waitForTimeout(200);
            }
          }
        } else {
          item.actionResult = `external link ${href}`;
        }
      } else {
        await locator.scrollIntoViewIfNeeded().catch(() => {});
        await locator.click({ timeout: 3000 }).catch((e) => { item.actionResult = `click failed: ${String(e).slice(0,200)}`; });
        await page.waitForTimeout(400);
        if (!item.actionResult) {
          if (page.url() !== beforeUrl) {
            item.actionResult = `clicked and navigated to ${page.url()}`;
            await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
            await page.waitForTimeout(200);
          } else {
            item.actionResult = 'clicked (no navigation)';
          }
        }
      }
    } catch (err) {
      item.actionResult = `error during action: ${String(err).slice(0,200)}`;
    }

    summary.push(item);
  }

  // After interactions, collect errors
  if (consoleErrors.length) issues.push(`console errors:\n${consoleErrors.join('\n')}`);
  if (pageErrors.length) issues.push(`page errors:\n${pageErrors.join('\n')}`);
  if (requestsFailed.length) issues.push(`failed requests:\n${requestsFailed.join('\n')}`);

  // Output a simple report to test logs (Playwright will capture)
  console.log('--- BUTTON AUDIT SUMMARY ---');
  console.table(summary.map(s => ({ index: s.index, tag: s.tag, selector: s.selector, text: s.text, href: s.href || '', visible: s.visible, disabled: s.disabled, result: s.actionResult })));

  if (issues.length) {
    console.log('--- ISSUES FOUND ---');
    issues.forEach((it) => console.log(it));
  } else {
    console.log('No console/page/request errors detected during audit.');
  }

  // Assert no severe issues (so test fails if there are console errors or failed requests)
  expect(issues.length).toBe(0);
});
