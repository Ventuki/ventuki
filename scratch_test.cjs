const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER_ERROR: ${msg.text()}`);
      console.log(`Location:`, msg.location());
    }
  });

  page.on('pageerror', exception => {
    console.log(`UNCAUGHT_EXCEPTION: ${exception}`);
  });

  try {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('Page loaded successfully.');
    await page.waitForTimeout(2000);
  } catch (error) {
    console.log(`GOTO_ERROR: ${error}`);
  }

  await browser.close();
})();
