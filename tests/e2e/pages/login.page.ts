import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.passwordInput = page.locator('input[name="password"], input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"], .error-message');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAsOrganizer() {
    await this.goto();
    await this.login('organizer@test.com', 'Test123!@#');
    await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
  }

  async loginAsAttendee() {
    await this.goto();
    await this.login('attendee@test.com', 'Test123!@#');
    await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
  }
}
