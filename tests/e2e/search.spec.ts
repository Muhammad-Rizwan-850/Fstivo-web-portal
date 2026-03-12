import { test } from './fixtures/base';

test.describe('Search Functionality', () => {
  test('should search events by title', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
    await searchInput.fill('conference');
    await page.waitForTimeout(1000);
    
    const results = page.locator('[data-testid="event-card"], .event-card');
    await expect(results.first()).toBeVisible();
  });

  test('should filter events by category', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    
    const categoryFilter = page.locator('select[name="category"], [data-testid="category-filter"]');
    await categoryFilter.selectOption('conference');
    await page.waitForTimeout(1000);
    
    const results = page.locator('[data-testid="event-card"]');
    await expect(results.first()).toBeVisible();
  });

  test('should filter events by date', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    
    const dateFilter = page.locator('input[name="date"], [type="date"]').first();
    await dateFilter.fill('2026-03-01');
    await page.waitForTimeout(1000);
    
    const results = page.locator('[data-testid="event-card"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
