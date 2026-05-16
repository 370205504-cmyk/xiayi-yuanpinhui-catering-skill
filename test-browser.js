const playwright = require('/root/.nvm/versions/node/v24.15.0/lib/node_modules/playwright');

(async () => {
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/admin.html', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log('✅ 页面打开成功！');
    console.log('标题:', title);
    
    await page.screenshot({ path: '/workspace/admin-page-screenshot.png', fullPage: false });
    console.log('截图已保存到: /workspace/admin-page-screenshot.png');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
})();
