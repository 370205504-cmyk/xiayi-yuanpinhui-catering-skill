import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

class StoreService {
  constructor() {
    this.storeData = this.loadStoreData()
  }

  loadStoreData() {
    const dataPath = path.join(__dirname, 'data.json')
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    }
    return this.getDefaultStoreData()
  }

  getDefaultStoreData() {
    return {
      id: 1,
      name: '雨姗AI收银助手',
      name_en: 'Yushan AI Cashier',
      address: '河南省商丘市县中心商业街88号',
      phone: '0370-1234567',
      business_hours: '10:00 - 22:00',
      business_hours_detail: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '22:00' },
        saturday: { open: '10:00', close: '22:00' },
        sunday: { open: '10:00', close: '22:00' },
      },
      has_wifi: true,
      wifi_name: 'Yushan-Free',
      wifi_password: '88888888',
      has_parking: true,
      parking_info: '地下B1层，消费满100元免2小时',
      can_deliver: true,
      can_reserve: true,
      has_self_order: true,
      features: ['WiFi', '停车', '外卖', '预订', '自助点餐'],
      lat: 34.4474,
      lng: 115.6578,
      description: '智能AI收银系统，提供便捷点餐体验',
      status: 'active',
    }
  }

  saveStoreData() {
    const dataPath = path.join(__dirname, 'data.json')
    fs.writeFileSync(dataPath, JSON.stringify(this.storeData, null, 2))
  }

  getStoreInfo() {
    return { success: true, store: this.storeData }
  }

  getBusinessHours() {
    return {
      success: true,
      business_hours: this.storeData.business_hours,
      business_hours_detail: this.storeData.business_hours_detail,
      store_name: this.storeData.name,
    }
  }

  getWifiInfo() {
    return {
      success: true,
      has_wifi: this.storeData.has_wifi,
      wifi_name: this.storeData.wifi_name,
      wifi_password: this.storeData.wifi_password,
      store_name: this.storeData.name,
    }
  }

  getParkingInfo() {
    return {
      success: true,
      has_parking: this.storeData.has_parking,
      parking_info: this.storeData.parking_info,
      store_name: this.storeData.name,
    }
  }

  getContactInfo() {
    return {
      success: true,
      address: this.storeData.address,
      phone: this.storeData.phone,
      store_name: this.storeData.name,
      location: { lat: this.storeData.lat, lng: this.storeData.lng },
    }
  }

  getStoreServices() {
    return {
      success: true,
      services: {
        wifi: this.storeData.has_wifi,
        parking: this.storeData.has_parking,
        delivery: this.storeData.can_deliver,
        reservation: this.storeData.can_reserve,
        self_order: this.storeData.has_self_order,
      },
      store_name: this.storeData.name,
      features: this.storeData.features,
    }
  }

  updateStoreInfo(data) {
    const allowedFields = ['name', 'address', 'phone', 'description', 'business_hours']
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        this.storeData[field] = data[field]
      }
    }
    this.saveStoreData()
    return { success: true, message: '店铺信息更新成功' }
  }

  updateWifiInfo(data) {
    if (data.wifi_name !== undefined) this.storeData.wifi_name = data.wifi_name
    if (data.wifi_password !== undefined) this.storeData.wifi_password = data.wifi_password
    if (data.has_wifi !== undefined) this.storeData.has_wifi = data.has_wifi
    this.saveStoreData()
    return { success: true, message: 'WiFi信息更新成功' }
  }

  updateBusinessHours(data) {
    if (data.business_hours !== undefined) this.storeData.business_hours = data.business_hours
    if (data.business_hours_detail !== undefined) this.storeData.business_hours_detail = data.business_hours_detail
    this.saveStoreData()
    return { success: true, message: '营业时间更新成功' }
  }

  getStatusSummary() {
    return {
      success: true,
      store_name: this.storeData.name,
      status: this.storeData.status,
      business_hours: this.storeData.business_hours,
      phone: this.storeData.phone,
      features: this.storeData.features,
    }
  }
}

export default new StoreService()
