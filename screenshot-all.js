const playwright = require('/root/.nvm/versions/node/v24.15.0/lib/node_modules/playwright');

(async () => {
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    // 1. 打开管理后台首页
    await page.goto('http://localhost:3000/admin.html', { timeout: 30000, waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/workspace/screenshot-01-homepage.png', fullPage: false });
    console.log('✅ 截图1: 管理后台首页');
    
    // 2. 点击系统设置tab
    await page.evaluate(() => {
      const tab = document.getElementById('tab-settings');
      if (tab) {
        tab.style.display = 'block';
        tab.classList.add('active');
      }
    });
    await page.waitForTimeout(1000);
    
    // 3. 滚动到底部看AI智能助手设置
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/workspace/screenshot-02-settings-llm.png', fullPage: true });
    console.log('✅ 截图2: 系统设置 - AI智能助手');
    
    // 4. 打开LLM配置独立页面
    await page.goto('http://localhost:3000/llm-config.html', { timeout: 30000, waitUntil: 'load' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/workspace/screenshot-03-llm-config.png', fullPage: true });
    console.log('✅ 截图3: LLM配置独立页面');
    
    console.log('\n🎉 所有截图完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
})();