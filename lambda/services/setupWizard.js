/**
 * 配置向导服务 v5.0.0
 * 引导商家完成收银对接、二维码生成、打印机配置
 */

const path = require('path');
const fs = require('fs');

class SetupWizardService {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'config', 'setup.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (e) {
      console.error('加载配置失败:', e);
    }
    return {
      setupComplete: false,
      currentStep: 1,
      cashierSystem: null,
      printerConfig: null,
      qrCodes: [],
      storeInfo: {
        name: '',
        address: '',
        phone: ''
      }
    };
  }

  saveConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (e) {
      console.error('保存配置失败:', e);
      return false;
    }
  }

  // 步骤1: 检测本地收银系统
  async step1Detect() {
    const detected = {
      systems: [],
      databases: [],
      printers: []
    };

    // 模拟检测收银系统
    const cashierSystems = ['meituan', 'yinbao', 'hualala', 'sixun', 'kemai'];
    for (const sys of cashierSystems) {
      if (this.simulateCheck(sys)) {
        detected.systems.push({
          id: sys,
          name: this.getCashierName(sys),
          detected: true
        });
      }
    }

    // 模拟检测数据库
    detected.databases = [
      { type: 'mysql', port: 3306, available: true },
      { type: 'mysql', port: 13306, available: true }
    ];

    // 模拟检测打印机
    detected.printers = [
      { name: '80mm热敏打印机', type: 'escpos', available: true },
      { name: '58mm小票打印机', type: 'escpos', available: true }
    ];

    return { success: true, detected };
  }

  simulateCheck(sysId) {
    return Math.random() > 0.5; // 随机模拟检测到
  }

  getCashierName(id) {
    const names = {
      meituan: '美团收银',
      yinbao: '银豹',
      hualala: '哗啦啦',
      sixun: '思迅',
      kemai: '科脉'
    };
    return names[id] || id;
  }

  // 步骤2: 配置收银系统
  async step2ConfigureCashier(cashierConfig) {
    this.config.cashierSystem = {
      type: cashierConfig.type,
      mode: 'read', // 默认只读模式
      connection: cashierConfig.connection,
      configuredAt: new Date().toISOString()
    };
    this.config.currentStep = 2;
    this.saveConfig();

    return { success: true };
  }

  // 步骤3: 生成二维码
  async step3GenerateQRCode(qrConfig) {
    const qrCodes = [];

    // 生成通用店铺码
    qrCodes.push({
      id: 'store',
      type: 'store',
      name: '店铺码',
      url: `https://order.yushan.ai/store/${qrConfig.storeId}`,
      generatedAt: new Date().toISOString()
    });

    // 生成桌码
    const tableCount = qrConfig.tableCount || 10;
    for (let i = 1; i <= tableCount; i++) {
      qrCodes.push({
        id: `table_${i}`,
        type: 'table',
        tableNumber: i,
        name: `桌码 ${i}号`,
        url: `https://order.yushan.ai/table/${qrConfig.storeId}/${i}`,
        generatedAt: new Date().toISOString()
      });
    }

    this.config.qrCodes = qrCodes;
    this.config.storeInfo = qrConfig;
    this.config.currentStep = 3;
    this.saveConfig();

    return { success: true, qrCodes };
  }

  // 步骤4: 配置打印机
  async step4ConfigurePrinter(printerConfig) {
    this.config.printerConfig = {
      ...printerConfig,
      configuredAt: new Date().toISOString()
    };
    this.config.currentStep = 4;
    this.saveConfig();

    return { success: true };
  }

  // 步骤5: 完成配置
  async step5Finish() {
    this.config.setupComplete = true;
    this.config.currentStep = 5;
    this.config.completedAt = new Date().toISOString();
    this.saveConfig();

    return { success: true };
  }

  // 获取当前配置进度
  getProgress() {
    return {
      setupComplete: this.config.setupComplete,
      currentStep: this.config.currentStep,
      config: this.config
    };
  }

  // 重置配置
  reset() {
    this.config = {
      setupComplete: false,
      currentStep: 1,
      cashierSystem: null,
      printerConfig: null,
      qrCodes: [],
      storeInfo: {
        name: '',
        address: '',
        phone: ''
      }
    };
    this.saveConfig();
    return { success: true };
  }
}

module.exports = SetupWizardService;
