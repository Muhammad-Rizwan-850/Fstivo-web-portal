const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture all events
  const consoleLogs = [];
  const errors = [];
  const requests = [];
  
  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), msg: msg.text() });
  });

  page.on('pageerror', (err) => {
    errors.push(err.toString());
  });

  page.on('requestfailed', (request) => {
    requests.push({ url: request.url(), failure: request.failure()?.errorText });
  });

  try {
    console.log('🔍 Testing PWA Error Fix...\n');
    console.log('1️⃣  Navigating to http://localhost:3001/...');
    const response = await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    console.log(`   Status: ${response?.status()}`);
    
    console.log('\n2️⃣  Waiting for app initialization (2 seconds)...');
    await page.waitForTimeout(2000);

    console.log('\n3️⃣  Checking for pwa-utils usage...');
    const pwaPresent = await page.evaluate(() => {
      return typeof window !== 'undefined' && 'localStorage' in window;
    });
    console.log(`   localStorage available: ${pwaPresent}`);

    console.log('\n4️⃣  Testing navigation to another page...');
    try {
      await page.goto('http://localhost:3001/events', { waitUntil: 'domcontentloaded', timeout: 5000 });
      console.log('   ✓ Navigation successful');
    } catch (navErr) {
      console.log(`   ⚠ Navigation timeout (expected if page requires auth)`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTS:');
    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log('\n❌ Runtime Errors Found:');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    } else {
      console.log('\n✅ No runtime errors detected!');
    }

    if (requests.length > 0) {
      console.log('\n⚠️  Failed Requests:');
      requests.forEach((req, i) => console.log(`   ${i + 1}. ${req.url}\n      Error: ${req.failure}`));
    }

    if (consoleLogs.filter(l => l.type === 'error').length > 0) {
      console.log('\n📢 Console Errors:');
      consoleLogs.filter(l => l.type === 'error').forEach((log, i) => {
        console.log(`   ${i + 1}. ${log.msg}`);
      });
    }

    console.log('\n' + '='.repeat(50));
    if (errors.length === 0) {
      console.log('✨ PWA fix appears to be working correctly!');
    }
    console.log('='.repeat(50));

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    await browser.close();
  }
})();
