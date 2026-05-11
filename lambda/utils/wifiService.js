class WifiService {
  constructor() {
    this.wifiNetworks = new Map();
    this.initializeWifiData();
  }

  initializeWifiData() {
    const wifiConfigs = [
      {
        storeId: 'store_001',
        ssid: 'XYYP_001_Guest',
        password: '88888888',
        securityType: 'WPA2',
        location: '县城中心店',
        floor: '1-3楼全覆盖'
      },
      {
        storeId: 'store_002',
        ssid: 'XYYP_002_WiFi',
        password: '66666666',
        securityType: 'WPA2',
        location: '城东店',
        floor: '全店覆盖'
      },
      {
        storeId: 'store_003',
        ssid: 'XYYP_003_Free',
        password: '55555555',
        securityType: 'WPA2',
        location: '城西店',
        floor: '1-2楼覆盖'
      },
      {
        storeId: 'store_004',
        ssid: 'XYYP_004',
        password: '44444444',
        securityType: 'WPA2',
        location: '城郊店',
        floor: '大厅覆盖'
      },
      {
        storeId: 'store_005',
        ssid: 'XYYP_005_VIP',
        password: '99999999',
        securityType: 'WPA2',
        location: '旗舰店',
        floor: '全店覆盖'
      }
    ];

    wifiConfigs.forEach(config => {
      this.wifiNetworks.set(config.storeId, config);
    });
  }

  getStoreWifi(storeId) {
    return this.wifiNetworks.get(storeId) || {
      ssid: '未知',
      password: '请咨询店员',
      securityType: '未知'
    };
  }

  getWifiByLocation(location) {
    const results = [];
    this.wifiNetworks.forEach(wifi => {
      if (wifi.location.includes(location)) {
        results.push(wifi);
      }
    });
    return results;
  }

  validateWifiPassword(storeId, password) {
    const wifi = this.wifiNetworks.get(storeId);
    if (!wifi) return { valid: false, message: '未找到该门店的WiFi信息' };
    
    return {
      valid: wifi.password === password,
      message: wifi.password === password ? '密码正确' : '密码错误'
    };
  }

  getConnectionGuide(storeId) {
    const wifi = this.wifiNetworks.get(storeId);
    if (!wifi) return '请咨询店员获取WiFi信息';

    return `
      WiFi连接步骤：
      1. 打开手机设置
      2. 找到WiFi设置
      3. 选择网络：${wifi.ssid}
      4. 输入密码：${wifi.password}
      5. 点击连接
    `;
  }

  getAllWifiInfo() {
    const allInfo = [];
    this.wifiNetworks.forEach(wifi => {
      allInfo.push(wifi);
    });
    return allInfo;
  }

  formatWifiInfo(wifi, includeLocation = true) {
    let info = '';
    info += `网络名称：${wifi.ssid}\n`;
    info += `连接密码：${wifi.password}\n`;
    info += `安全类型：${wifi.securityType}\n`;
    if (includeLocation && wifi.location) {
      info += `位置：${wifi.location}\n`;
    }
    if (wifi.floor) {
      info += `覆盖范围：${wifi.floor}\n`;
    }
    return info;
  }
}

module.exports = WifiService;
