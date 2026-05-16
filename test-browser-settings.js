const playwright = require('/root/.nvm/versions/node/v24.15.0/lib/node_modules/playwright');

(async () => {
  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 3000 } });
  
  try {
    await page.goto('http://localhost:3000/admin.html', { timeout: 30000, waitUntil: 'load' });
    
    console.log('✅ 页面完全加载！');
    
    await page.waitForTimeout(3000);
    
    console.log('✅ 等待3秒确保JavaScript执行');
    
    await page.evaluate(() => {
      const tab = document.getElementById('tab-settings');
      if (tab) {
        tab.style.display = 'block';
        tab.classList.add('active');
        console.log('已切换到系统设置tab');
      } else {
        console.log('未找到tab-settings元素');
      }
    });
    await page.waitForTimeout(2000);
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: '/workspace/admin-settings-final.png', fullPage: true });
    console.log('完整页面截图已保存: /workspace/admin-settings-final.png');
    
    const hasLLMSettings = await page.evaluate(() => {
      return document.body.innerText.includes('AI智能助手设置');
    });
    console.log('页面包含AI智能助手设置:', hasLLMSettings);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await browser.close();
  }
})();
