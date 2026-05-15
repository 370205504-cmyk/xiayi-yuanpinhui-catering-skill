import dishesService from './service.js'

class DishesController {
  async handleMessage(text) {
    const lowerText = text.toLowerCase().trim()

    if (lowerText.includes('推荐') || lowerText.includes('点什么')) {
      return this.handleRecommendation(lowerText)
    }
    if (lowerText.includes('价格') || lowerText.includes('多少钱')) {
      return this.handlePriceRequest(lowerText)
    }
    if (lowerText.includes('菜单') || lowerText.includes('吃什么')) {
      return this.handleMenuRequest(lowerText)
    }
    const categories = dishesService.getCategories()
    for (const cat of categories) {
      if (lowerText.includes(cat.toLowerCase())) {
        return this.handleCategoryRequest(cat)
      }
    }
    return null
  }

  async handleCategoryRequest(category) {
    const dishes = dishesService.getMenu({ category })
    if (!dishes || dishes.dishes.length === 0) {
      return { type: 'menu', reply: `暂无${category}分类的菜品~` }
    }
    let msg = `🍽️ 【${category}】\n\n`
    dishes.dishes.forEach((d) => {
      msg += `${d.image} ${d.name} - ¥${d.price}\n`
    })
    return { type: 'menu', reply: msg }
  }

  async handleMenuRequest(text) {
    const categories = dishesService.getCategories()
    let menuMsg = '🍽️ 菜单分类：\n\n'
    categories.forEach((cat, index) => {
      menuMsg += `${index + 1}. ${cat}\n`
    })
    menuMsg += '\n请问您想查看哪个分类？或者说"推荐菜"了解我们的招牌~'
    return { type: 'menu', reply: menuMsg }
  }

  async handleRecommendation(text) {
    const taste = this.extractTaste(text)
    const budget = this.extractBudget(text)
    const recommended = dishesService.recommendDishes({ taste, budget, count: 3 })

    if (recommended.length === 0) {
      return { type: 'menu', reply: '暂无符合条件的推荐菜品，需要我展示完整菜单吗？' }
    }

    let msg = '🔥 为您推荐：\n\n'
    recommended.forEach((dish, index) => {
      msg += `${index + 1}. ${dish.image} ${dish.name}\n`
      msg += `   💰 ¥${dish.price}  |  🌶️ ${dish.spicy}\n`
      msg += `   📝 ${dish.description}\n\n`
    })
    msg += '需要我帮您下单吗？直接说"点+菜名"就可以~'
    return { type: 'recommend', reply: msg }
  }

  async handlePriceRequest(text) {
    const match = text.match(/(\d+)\s*到\s*(\d+)/)
    if (match) {
      const min = parseInt(match[1])
      const max = parseInt(match[2])
      const dishes = dishesService.getAllDishes().filter((d) => d.price >= min && d.price <= max)
      if (dishes.length === 0) {
        return { type: 'menu', reply: `¥${min}-${max}价位暂无菜品` }
      }
      let msg = `💰 ¥${min}-${max}价位的菜品：\n\n`
      dishes.forEach((d) => {
        msg += `${d.image} ${d.name} - ¥${d.price}\n`
      })
      return { type: 'menu', reply: msg }
    }
    return { type: 'menu', reply: '请问您想了解什么价位的菜品？可以说"30到50"这样的格式~' }
  }

  extractTaste(text) {
    if (text.includes('辣') || text.includes('麻辣')) return '辣'
    if (text.includes('清淡') || text.includes('不辣')) return '清淡'
    if (text.includes('甜') || text.includes('糖醋')) return '甜'
    if (text.includes('鲜') || text.includes('清蒸')) return '鲜'
    return null
  }

  extractBudget(text) {
    if (text.includes('便宜') || text.includes('实惠') || text.includes('便宜点')) return 'low'
    if (text.includes('贵') || text.includes('高档') || text.includes('贵一点')) return 'high'
    return null
  }

  getDishDetail(id) {
    const dish = dishesService.getDishById(id)
    if (!dish) return null
    return { type: 'dish_detail', reply: dishesService.formatDishDetail(dish) }
  }
}

export default new DishesController()
