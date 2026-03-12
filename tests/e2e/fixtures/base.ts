import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { EventPage } from '../pages/event.page';

type TestFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  eventPage: EventPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  eventPage: async ({ page }, use) => {
    const eventPage = new EventPage(page);
    await use(eventPage);
  },
});

export { expect };
