import { Page, Locator } from '@playwright/test';

export async function waitForAny(locators: Locator[], timeout = 5000): Promise<Locator | null> {
  const promises = locators.map(async (locator) => {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return locator;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.find(r => r !== null) || null;
}

export async function safeClick(locator: Locator, options?: { timeout?: number }) {
  try {
    await locator.click({ timeout: options?.timeout || 5000 });
    return true;
  } catch (error) {
    console.log('Click failed:', error);
    return false;
  }
}

export async function safeFill(locator: Locator, text: string, options?: { timeout?: number }) {
  try {
    await locator.fill(text, { timeout: options?.timeout || 5000 });
    return true;
  } catch (error) {
    console.log('Fill failed:', error);
    return false;
  }
}

export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}
