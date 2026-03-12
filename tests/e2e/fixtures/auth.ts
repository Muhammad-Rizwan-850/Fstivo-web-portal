import { test as base } from '@playwright/test';

type TestUser = {
  email: string;
  password: string;
  role: 'attendee' | 'organizer' | 'admin';
};

export const test = base.extend<{
  authenticatedPage: any;
  organizerPage: any;
  adminPage: any;
}>({
  authenticatedPage: async ({ browser }: any, use: any) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await use(page);
    await context.close();
  },
});
