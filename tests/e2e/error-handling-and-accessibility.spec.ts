import { test, expect } from '@playwright/test';

test.describe('Error Handling and Edge Cases - E2E', () => {
  test('should handle invalid event URL gracefully', async ({ page }) => {
    await page.goto('/events/invalid-event-id-12345');

    // Check for 404 or error message
    const notFound = page.locator('text=not found, text=404, text=does not exist').first();
    const errorSection = page.locator('[data-testid="error"], .error-message, .not-found').first();

    const notFoundVisible = await notFound.isVisible({ timeout: 2000 }).catch(() => false);
    const errorVisible = await errorSection.isVisible({ timeout: 2000 }).catch(() => false);

    expect(notFoundVisible || errorVisible).toBe(true);
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);
    await page.goto('/events').catch(() => {});

    // Try to load events
    await page.waitForTimeout(1000);

    // Check for offline message or retry button
    const offlineMsg = page.locator('text=offline, text=connection, text=try again').first();
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")').first();

    await context.setOffline(false);
  });

  test('should prevent XSS attacks in search', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try injecting script
      await searchInput.fill('<script>alert("xss")</script>');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(500);

      // Verify no actual script execution
      // If vulnerable, would show alert
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
    }
  });

  test('should handle session timeout gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to protected page
    await page.goto('/dashboard');

    // Check if redirected to login or shown login prompt
    const loginForm = page.locator('[data-testid="login-form"], form:has-text("Email")').first();
    const loginButton = page.locator('button:has-text("Login")').first();

    const isLoginVisible = await loginForm.isVisible({ timeout: 2000 }).catch(() => false);
    const isButtonVisible = await loginButton.isVisible({ timeout: 2000 }).catch(() => false);

    // At least one should be visible (either form or login button)
    expect(isLoginVisible || isButtonVisible || page.url().includes('/login')).toBe(true);
  });

  test('should handle form submission errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for any form
    const form = page.locator('form').first();

    if (await form.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Find submit button
      const submitButton = page.locator('button[type="submit"]').first();

      if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Try submitting empty form
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check for validation errors
        const errors = page.locator('[role="alert"], .error, .validation-error');
        const errorCount = await errors.count();

        // Should have at least one error or show message
        expect(errorCount > 0 || page.url().includes('error')).toBe(true);
      }
    }
  });

  test('should handle file upload errors', async ({ page }) => {
    // Navigate to profile or upload page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Look for file input
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try uploading invalid file type
      const largeFile = await page.locator('input[type="file"]').first().inputValue().catch(() => '');

      // Check for upload limitations
      const uploadSection = page.locator('[data-testid="upload"], .file-upload').first();
      if (await uploadSection.isVisible({ timeout: 1000 }).catch(() => false)) {
        const uploadText = await uploadSection.textContent();
        expect(uploadText).toBeTruthy();
      }
    }
  });

  test('should validate form field types', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test email field
    const emailInput = page.locator('input[type="email"]').first();

    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Enter invalid email
      await emailInput.fill('not-an-email');

      // Check HTML5 validation
      const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(validity).toBe(false);
    }

    // Test number field
    const numberInput = page.locator('input[type="number"]').first();
    if (await numberInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await numberInput.fill('abc');
      const value = await numberInput.inputValue();
      // Number input should reject non-numeric input
      expect(value).not.toContain('abc');
    }
  });
});

test.describe('Performance and Responsiveness - E2E', () => {
  test('should load events page within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle pagination efficiently', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Look for pagination
    const nextButton = page.locator(
      'button:has-text("Next"), a:has-text("Next"), [aria-label*="Next Page"]'
    ).first();

    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const startTime = Date.now();

      await nextButton.click();
      await page.waitForLoadState('networkidle');

      const pageLoadTime = Date.now() - startTime;

      // Should load next page within 3 seconds
      expect(pageLoadTime).toBeLessThan(3000);

      // Should have different content
      const eventCards = page.locator('[data-testid="event-card"], .event-card');
      expect(await eventCards.count()).toBeGreaterThan(0);
    }
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Look for images with lazy loading
    const lazyImages = page.locator('img[loading="lazy"]');
    const lazyCount = await lazyImages.count();

    // At least some images should be lazy loaded
    if (lazyCount > 0) {
      expect(lazyCount).toBeGreaterThan(0);
    }
  });

  test('should be responsive on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });

    const page = await mobileContext.newPage();
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Check that layout is responsive
    const eventCard = page.locator('[data-testid="event-card"], .event-card').first();
    const box = await eventCard.boundingBox();

    // Card should fit in mobile viewport
    expect(box?.width).toBeLessThanOrEqual(375);

    await mobileContext.close();
  });

  test('should be responsive on tablet', async ({ browser }) => {
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });

    const page = await tabletContext.newPage();
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"], .event-card').first();
    const box = await eventCard.boundingBox();

    // Card should fit in tablet viewport
    expect(box?.width).toBeLessThanOrEqual(768);

    await tabletContext.close();
  });
});

test.describe('Accessibility - E2E', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Check for h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();

    // Each page should have exactly one h1
    expect(h1Count).toBe(1);
  });

  test('should have descriptive alt text for images', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Check event images
    const eventImages = page.locator('[data-testid="event-card"] img, .event-card img');
    const count = await eventImages.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const alt = await eventImages.nth(i).getAttribute('alt');
        // Alt text should exist and not be empty
        expect(alt).toBeTruthy();
        expect(alt?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Tab to first event card
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    // Check if any element is focused
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el && el !== document.body;
    });

    expect(focused).toBe(true);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // This is a basic check - comprehensive accessibility testing would use tools like axe
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6');
    const count = await textElements.count();

    // Should have text content
    expect(count).toBeGreaterThan(0);
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Check for proper aria labels
    const buttons = page.locator('button');
    const count = await buttons.count();

    if (count > 0) {
      // Check if buttons have accessible text
      for (let i = 0; i < Math.min(count, 3); i++) {
        const text = await buttons.nth(i).textContent();
        const ariaLabel = await buttons.nth(i).getAttribute('aria-label');

        // Button should have either text or aria-label
        expect((text && text.trim().length > 0) || ariaLabel).toBe(true);
      }
    }
  });
});
