import { test } from './fixtures/base';

test.describe('User Profile', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAsAttendee();
  });

  test('should display user profile', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toContain(/profile|account/i);
  });

  test('should update profile information', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');
    
    const nameInput = page.locator('input[name="name"], input[name="full_name"]');
    await nameInput.fill('Updated Test User');
    
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
    await saveButton.click();
    await expect(page.locator('text=/saved|updated|success/i')).toBeVisible();
  });
});
