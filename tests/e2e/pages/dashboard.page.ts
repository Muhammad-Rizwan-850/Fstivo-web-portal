import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly createEventButton: Locator;
  readonly eventsTab: Locator;
  readonly myEventsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createEventButton = page.locator('button:has-text("Create Event"), a:has-text("Create Event")');
    this.eventsTab = page.locator('[role="tab"]:has-text("Events")');
    this.myEventsLink = page.locator('a[href*="my-events"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async createNewEvent() {
    await this.createEventButton.click();
    await this.page.waitForURL('**/events/create', { timeout: 5000 });
  }

  async goToMyEvents() {
    await this.myEventsLink.click();
    await this.page.waitForLoadState('networkidle');
  }
}
