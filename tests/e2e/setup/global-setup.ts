import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🚀 Running global setup...');

  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    const response = await page.goto(baseURL, { timeout: 10000 });
    
    if (response && response.ok()) {
      console.log('✅ Application is running');
    } else {
      console.log('⚠️  Application may not be running correctly');
    }
  } catch (error) {
    console.log('❌ Cannot connect to application');
    console.log('   Make sure the app is running: npm run dev');
  }

  await browser.close();
  console.log('✅ Global setup complete\n');
}

export default globalSetup;
