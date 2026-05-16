const playwright = require('/root/.nvm/versions/node/v24.15.0/lib/node_modules/playwright');

(async () => {
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    await page.goto('http://localhost:3000/admin.html', { timeout: 30000, waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/workspace/show-01.png', fullPage: false });
    console.log('✅ 截图1: 管理后台首页');
    
    await page.goto('http://localhost:3000/llm-config.html', { timeout: 30000, waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/workspace/show-02.png', fullPage: true });
    console.log('✅ 截图2: LLM配置页面');
    
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    await browser.close();
  }
})();