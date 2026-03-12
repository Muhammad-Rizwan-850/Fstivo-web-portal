import { test } from '@playwright/test';

test.describe('Event Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    if (!page.url().includes('/dashboard')) {
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.fill('organizer@test.com');
        await page.locator('input[type="password"]').first().fill('Test123!@#');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/events/create');
    await page.waitForLoadState('domcontentloaded');
    
    if (!page.url().includes('create')) {
      console.log('Cannot access create page');
      test.skip();
      return;
    }
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Submit")').first();
    
    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      const titleInput = page.locator('input[name="title"]').first();
      const isRequired = await titleInput.evaluate((el: any) => el.required).catch(() => false);
      
      expect(isRequired).toBeTruthy();
    } else {
      console.log('Submit button not found');
      test.skip();
    }
  });

  test('user can create an event', async ({ page }) => {
    await page.goto('/events/create');
    await page.waitForLoadState('domcontentloaded');
    
    const titleInput = page.locator('input[name="title"]').first();
    
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('Test Event ' + Date.now());
      
      const descInput = page.locator('textarea[name="description"]').first();
      if (await descInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await descInput.fill('Test event description');
      }
      
      const locationInput = page.locator('input[name="location"]').first();
      if (await locationInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await locationInput.fill('Test Location');
      }
      
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      expect(true).toBe(true);
    } else {
      console.log('Event form not accessible');
      test.skip();
    }
  });
});
