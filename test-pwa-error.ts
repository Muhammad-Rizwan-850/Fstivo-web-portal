import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console messages
  const consoleLogs: { type: string; msg: string }[] = [];
  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), msg: msg.text() });
  });

  // Capture page errors
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    errors.push(err.toString());
  });

  try {
    console.log('Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    console.log('Page loaded successfully');

    // Wait a bit for any deferred errors
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('\n❌ Page Errors Found:');
      errors.forEach((err) => console.log(`  - ${err}`));
    }

    if (consoleLogs.length > 0) {
      console.log('\n📋 Console Output:');
      consoleLogs.forEach(({ type, msg }) => {
        console.log(`  [${type.toUpperCase()}] ${msg}`);
      });
    }

    if (errors.length === 0 && consoleLogs.length === 0) {
      console.log('\n✅ No errors detected!');
    }
  } catch (err) {
    console.error('Navigation failed:', err);
  } finally {
    await browser.close();
  }
})();
