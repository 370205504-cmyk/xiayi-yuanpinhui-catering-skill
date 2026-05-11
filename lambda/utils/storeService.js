const config = require('../config.json');

class StoreService {
  constructor(stores) {
    this.restaurantName = config.restaurant?.name || '夏邑缘品荟创味菜';
    this.restaurantPhone = config.restaurant?.phone || '0370-628-8888';
    this.restaurantAddress = config.restaurant?.address || '夏邑县孔祖大道南段';
    this.stores = stores || [];
    
    if (this.stores.length === 0 && config.stores) {
      this.stores = config.stores.map((store, index) => ({
        id: store.id || `store_${String(index + 1).padStart(3, '0')}`,
        name: store.name || `门店${index + 1}`,
        address: store.address || this.restaurantAddress,
        phone: store.phone || this.restaurantPhone,
        businessHours: store.hours || store.businessHours || '10:00-22:00',
        district: store.district || '夏邑县',
        features: store.features || ['WiFi', '打印机'],
        canDeliver: store.canDeliver !== false,
        canReserve: store.canReserve !== false,
        location: store.location || { lat: 34.2313, lng: 116.1327 }
      }));
    }
  }

  /**
   * 获取所有门店
   * @returns {Array} 门店列表
   */
  getAllStores() {
    return this.stores;
  }

  /**
   * 根据区域获取门店
   * @param {string} district - 区域名称
   * @returns {Array} 匹配的门店列表
   */
  getStoresByDistrict(district) {
    return this.stores.filter(store => 
      store.district.toLowerCase().includes(district.toLowerCase())
    );
  }

  /**
   * 获取支持外卖的门店
   * @returns {Array} 支持外卖的门店列表
   */
  getDeliveryStores() {
    return this.stores.filter(store => store.canDeliver);
  }

  /**
   * 获取支持预约的门店
   * @returns {Array} 支持预约的门店列表
   */
  getReservableStores() {
    return this.stores.filter(store => store.canReserve);
  }

  /**
   * 根据ID获取门店
   * @param {string} storeId - 门店ID
   * @returns {Object|null} 门店对象
   */
  getStoreById(storeId) {
    return this.stores.find(store => store.id === storeId) || null;
  }

  /**
   * 根据名称获取门店
   * @param {string} name - 门店名称
   * @returns {Object|null} 门店对象
   */
  getStoreByName(name) {
    return this.stores.find(store => 
      store.name.toLowerCase().includes(name.toLowerCase())
    ) || null;
  }

  /**
   * 获取最近的门店
   * @param {Object} userLocation - 用户位置 {lat, lng}
   * @returns {Object|null} 最近的门店
   */
  getNearestStore(userLocation = null) {
    if (!userLocation) {
      return this.stores.find(store => store.id === 'store_001') || this.stores[0];
    }

    const storesWithDistance = this.stores.map(store => {
      const distance = this.calculateDistance(
        userLocation.lat, userLocation.lng,
        store.location.lat, store.location.lng
      );
      return { ...store, distance };
    });

    storesWithDistance.sort((a, b) => a.distance - b.distance);
    return storesWithDistance[0] || null;
  }

  /**
   * 计算两点之间的距离（简化版）
   * @param {number} lat1 - 纬度1
   * @param {number} lng1 - 经度1
   * @param {number} lat2 - 纬度2
   * @param {number} lng2 - 经度2
   * @returns {number} 距离（公里）
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 角度转弧度
   * @param {number} deg - 角度
   * @returns {number} 弧度
   */
  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * 获取门店详情
   * @param {string} storeId - 门店ID
   * @returns {string} 门店详情描述
   */
  getStoreDetails(storeId) {
    const store = this.getStoreById(storeId);
    if (!store) return '未找到该门店';

    return `
      ${store.name}
      地址：${store.address}
      电话：${store.phone}
      营业时间：${store.businessHours}
      特色：${store.features.join('、')}
      ${store.canDeliver ? '✅ 支持外卖' : '❌ 暂不支持外卖'}
      ${store.canReserve ? '✅ 支持预约' : '❌ 暂不支持预约'}
    `;
  }

  /**
   * 检查门店是否在营业
   * @param {string} storeId - 门店ID
   * @returns {Object} 营业状态
   */
  checkBusinessStatus(storeId) {
    const store = this.getStoreById(storeId);
    if (!store) {
      return { isOpen: false, message: '未找到该门店' };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = store.businessHours.split('-')[0].split(':').map(Number);
    const [endHour, endMin] = store.businessHours.split('-')[1].split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    const isOpen = currentTime >= startTime && currentTime <= endTime;

    return {
      isOpen,
      storeName: store.name,
      message: isOpen 
        ? `${store.name}正在营业中`
        : `${store.name}已打烊，营业时间为 ${store.businessHours}`
    };
  }

  /**
   * 获取餐厅信息
   * @returns {Object} 餐厅基础信息
   */
  getRestaurantInfo() {
    return {
      name: this.restaurantName,
      phone: this.restaurantPhone,
      address: this.restaurantAddress
    };
  }
}

module.exports = StoreService;
