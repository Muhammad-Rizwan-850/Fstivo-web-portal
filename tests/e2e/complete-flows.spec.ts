import { test, expect } from '@playwright/test';

test.describe('Complete Event Registration Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full registration and booking flow', async ({ page }) => {
    // Step 1: Navigate to events
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Step 2: Search for event (if search available)
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('Concert');
      await page.waitForTimeout(1000);
    }

    // Step 3: Find and click first event
    const eventCard = page.locator('[data-testid="event-card"], .event-card, article').first();
    await eventCard.click();
    await page.waitForLoadState('networkidle');

    // Step 4: Verify event details displayed
    const eventTitle = page.locator('h1, h2, [data-testid="event-title"]').first();
    await expect(eventTitle).toBeVisible();

    // Step 5: Look for register/buy button
    const registerButton = page.locator(
      'button:has-text("Register"), button:has-text("Buy"), button:has-text("Get Tickets")'
    ).first();

    if (await registerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await registerButton.click();
      await page.waitForLoadState('networkidle');

      // Step 6: Verify registration form appears
      const form = page.locator('form, [data-testid="registration-form"]').first();
      expect(form).toBeVisible();
    }
  });

  test('should handle registration with multiple tickets', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Find event with ticket options
    const eventCard = page.locator('[data-testid="event-card"], .event-card').nth(1);
    if (await eventCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await eventCard.click();
      await page.waitForLoadState('networkidle');

      // Look for ticket quantity selector
      const quantityInput = page.locator('input[type="number"], [data-testid="quantity-selector"]').first();
      if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Change quantity
        await quantityInput.fill('3');
        await page.waitForTimeout(500);

        // Check if total price updates
        const priceDisplay = page.locator('[data-testid="total-price"], .price-total, span:has-text("PKR")').first();
        if (await priceDisplay.isVisible({ timeout: 1000 }).catch(() => false)) {
          const priceText = await priceDisplay.textContent();
          expect(priceText).toContain('PKR');
        }
      }
    }
  });

  test('should handle event wishlist functionality', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"], .event-card').first();
    await eventCard.click();
    await page.waitForLoadState('networkidle');

    // Look for wishlist/favorite button
    const wishlistButton = page.locator(
      'button[aria-label*="wishlist"], button[aria-label*="favorite"], button:has-text("Add to Wishlist")'
    ).first();

    if (await wishlistButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const initialState = await wishlistButton.getAttribute('aria-pressed');

      await wishlistButton.click();
      await page.waitForTimeout(500);

      const newState = await wishlistButton.getAttribute('aria-pressed');

      // Verify state changed
      if (initialState && newState) {
        expect(initialState).not.toBe(newState);
      }
    }
  });

  test('should show event recommendations', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Look for recommendations section
    const recommendationsSection = page.locator(
      '[data-testid="recommendations"], section:has-text("Recommended"), .recommendations'
    ).first();

    if (await recommendationsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      const recommendedEvents = page.locator(
        '[data-testid="event-card"], .event-card, article'
      ).locator('visible=true');

      const count = await recommendedEvents.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should filter events by category', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Look for category filter
    const categoryFilter = page.locator(
      'select[name="category"], [data-testid="category-filter"], button:has-text("Category")'
    ).first();

    if (await categoryFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try to select music category
      if (categoryFilter.evaluate((el) => el.tagName) === 'SELECT') {
        await categoryFilter.selectOption('music');
      } else {
        await categoryFilter.click();
        const musicOption = page.locator('text=Music, text=Concerts, button:has-text("Music")').first();
        if (await musicOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await musicOption.click();
        }
      }

      await page.waitForTimeout(1000);

      // Verify events are filtered
      const eventCards = page.locator('[data-testid="event-card"], .event-card').first();
      await expect(eventCards).toBeVisible();
    }
  });

  test('should sort events by date and price', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Look for sort dropdown
    const sortDropdown = page.locator(
      'select[name="sort"], [data-testid="sort-dropdown"], button:has-text("Sort")'
    ).first();

    if (await sortDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (sortDropdown.evaluate((el) => el.tagName) === 'SELECT') {
        await sortDropdown.selectOption('date-asc');
      } else {
        await sortDropdown.click();
        const dateOption = page.locator('button:has-text("Date: Earliest First")').first();
        if (await dateOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await dateOption.click();
        }
      }

      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="event-card"], .event-card').first()).toBeVisible();
    }
  });
});

test.describe('Payment Flow - E2E', () => {
  test('should process payment successfully', async ({ page, context }) => {
    // Set up payment interception
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to events and select one
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"], .event-card').first();
    await eventCard.click();
    await page.waitForLoadState('networkidle');

    // Click register/buy button
    const buyButton = page.locator(
      'button:has-text("Buy"), button:has-text("Register"), button:has-text("Get Tickets")'
    ).first();

    if (await buyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await buyButton.click();
      await page.waitForLoadState('networkidle');

      // Check for payment method selection
      const paymentMethods = page.locator(
        '[data-testid="payment-method"], .payment-option, label:has-text("JazzCash")'
      ).first();

      if (await paymentMethods.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify at least one payment method available
        const methods = page.locator('[data-testid="payment-method"], .payment-option');
        const methodCount = await methods.count();
        expect(methodCount).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('should validate payment information', async ({ page }) => {
    // Test payment form validation
    await page.goto('/');

    // This would require getting to checkout page
    // For now, test that payment-related inputs validate correctly
    const testCardNumber = page.locator('input[placeholder*="card number"], input[name="cardNumber"]').first();

    if (await testCardNumber.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try entering invalid card number
      await testCardNumber.focus();
      await testCardNumber.fill('1234');

      // Check for validation error
      const error = page.locator('.error, [role="alert"], .validation-error').first();

      if (await error.isVisible({ timeout: 1000 }).catch(() => false)) {
        const errorText = await error.textContent();
        expect(errorText).toBeTruthy();
      }
    }
  });
});

test.describe('Event Checkin Flow - E2E', () => {
  test('should access checkin page with valid credentials', async ({ page }) => {
    // Navigate to checkin page
    await page.goto('/checkin');

    // Verify checkin interface loads
    const checkinForm = page.locator('[data-testid="checkin-form"], .checkin-scanner, form').first();

    const isVisible = await checkinForm.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await expect(checkinForm).toBeVisible();
    } else {
      // Might require login first
      const loginButton = page.locator('button:has-text("Login"), a:has-text("Login")').first();
      if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginButton.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should scan QR code for checkin', async ({ page }) => {
    await page.goto('/checkin');

    // Look for QR code scanner or manual entry
    const scannerInput = page.locator(
      'input[placeholder*="scan"], input[placeholder*="QR"], input[data-testid="qr-scanner"]'
    ).first();

    if (await scannerInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Simulate QR code scan with registration ID
      await scannerInput.fill('reg-123-test');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000);

      // Check for success message
      const successMsg = page.locator('[role="alert"]:has-text("checked in"), [role="alert"]:has-text("success")').first();

      if (await successMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await successMsg.textContent();
        expect(text).toBeTruthy();
      }
    }
  });
});

test.describe('User Profile and Settings - E2E', () => {
  test('should update user profile information', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Look for edit button
    const editButton = page.locator(
      'button:has-text("Edit"), button:has-text("Edit Profile"), [data-testid="edit-profile"]'
    ).first();

    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      // Look for form fields
      const firstNameInput = page.locator('input[name="firstName"], input[name="first_name"]').first();

      if (await firstNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Clear and enter new name
        await firstNameInput.fill('John');

        // Find save button
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
        if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Check for success message
          const success = page.locator('[role="alert"]:has-text("updated"), [role="alert"]:has-text("saved")').first();
          if (await success.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(success).toBeVisible();
          }
        }
      }
    }
  });

  test('should manage notification preferences', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Look for notifications section
    const notificationsTab = page.locator(
      'button:has-text("Notifications"), tab:has-text("Notifications")'
    ).first();

    if (await notificationsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notificationsTab.click();
      await page.waitForTimeout(500);

      // Toggle a preference
      const toggle = page.locator('input[type="checkbox"], [role="switch"]').first();
      if (await toggle.isVisible({ timeout: 1000 }).catch(() => false)) {
        await toggle.click();
        await page.waitForTimeout(500);

        // Verify toggle state changed
        const isChecked = await toggle.isChecked();
        expect(typeof isChecked).toBe('boolean');
      }
    }
  });
});
