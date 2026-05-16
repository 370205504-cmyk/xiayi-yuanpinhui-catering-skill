const playwright = require('/root/.nvm/versions/node/v24.15.0/lib/node_modules/playwright');

(async () => {
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: '/opt/google/chrome/chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    await page.goto('http://localhost:3000/admin.html', { timeout: 30000, waitUntil: 'load' });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log('✅ 页面标题:', title);
    console.log('✅ 页面URL:', page.url());
    
    await page.screenshot({ path: '/workspace/live-preview-01.png', fullPage: false });
    console.log('✅ 截图1已保存');
    
    await page.evaluate(() => {
      document.getElementById('tab-settings').style.display = 'block';
      document.getElementById('tab-settings').classList.add('active');
    });
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/workspace/live-preview-02.png', fullPage: true });
    console.log('✅ 截图2已保存');
    
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await browser.close();
  }
})();