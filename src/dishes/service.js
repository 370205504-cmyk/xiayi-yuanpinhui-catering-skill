const dishesData = require('./data')

class DishesService {
  constructor() {
    this.dishes = dishesData
    this.categories = [...new Set(dishesData.map((d) => d.category))]
  }

  getAllDishes() {
    return this.dishes
  }

  getMenu({ category, page = 1, limit = 10 } = {}) {
    let filtered = this.dishes
    if (category) {
      filtered = filtered.filter((d) => d.category === category)
    }
    const start = (page - 1) * limit
    const end = start + limit
    return {
      dishes: filtered.slice(start, end),
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
      categories: this.categories,
    }
  }

  getCategories() {
    return this.categories
  }

  getDishById(id) {
    return this.dishes.find((d) => d.id == id) || null
  }

  searchDishes(keyword) {
    const kw = keyword.toLowerCase()
    return this.dishes.filter(
      (d) => d.name.toLowerCase().includes(kw) || d.category.toLowerCase().includes(kw) || d.description.toLowerCase().includes(kw),
    )
  }

  recommendDishes({ taste, budget, count = 3 } = {}) {
    let filtered = [...this.dishes]
    if (taste) {
      const tasteMap = {
        辣: ['辣', '麻辣', '香辣', '红油'],
        清淡: ['清淡', '清蒸', '白灼', '清蒸'],
        甜: ['甜', '糖醋', '蜜汁', '拔丝'],
        鲜: ['鲜', '清蒸', '白灼'],
        香: ['香', '煎', '炸', '烤'],
      }
      const keywords = tasteMap[taste] || []
      filtered = filtered.filter((d) => {
        const text = `${d.name} ${d.description}`.toLowerCase()
        return keywords.some((k) => text.includes(k))
      })
    }
    if (budget) {
      switch (budget) {
        case 'low':
          filtered = filtered.filter((d) => d.price < 30)
          break
        case 'medium':
          filtered = filtered.filter((d) => d.price >= 30 && d.price <= 60)
          break
        case 'high':
          filtered = filtered.filter((d) => d.price > 60)
          break
      }
    }
    const sorted = [
      ...filtered.filter((d) => d.isSignature),
      ...filtered.filter((d) => d.isRecommend && !d.isSignature),
      ...filtered.filter((d) => !d.isSignature && !d.isRecommend),
    ].slice(0, count)
    return sorted
  }

  getSignatureDishes() {
    return this.dishes.filter((d) => d.isSignature)
  }

  formatMenuForMessage() {
    let msg = '🍽️ 我们的菜单：\n\n'
    this.categories.forEach((cat) => {
      msg += `【${cat}】\n`
      this.dishes
        .filter((d) => d.category === cat)
        .forEach((d) => {
          msg += `${d.image} ${d.name} - ¥${d.price}\n`
        })
      msg += '\n'
    })
    return msg
  }

  formatDishDetail(dish) {
    return (
      `${dish.image} ${dish.name}\n` +
      `💰 价格：¥${dish.price}\n` +
      `🌶️ 口味：${dish.spicy}\n` +
      `📝 描述：${dish.description}\n` +
      `${dish.isSignature ? '⭐ 招牌菜' : ''}${dish.isRecommend ? ' 🔥 推荐' : ''}`
    )
  }
}

module.exports = new DishesService()
