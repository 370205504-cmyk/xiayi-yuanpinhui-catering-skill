class FAQService {
  constructor() {
    this.knowledgeBase = this.buildKnowledgeBase()
    this.keywordIndex = this.buildKeywordIndex()
  }

  buildKnowledgeBase() {
    return {
      basic_info: {
        store_name: '雨姗AI收银助手',
        address: '河南省商丘市县中心商业街88号',
        phone: '0370-1234567',
        hours: '10:00 - 22:00',
        wifi: { name: 'Yushan-Free', password: '88888888' },
      },
      business_hours: {
        patterns: [
          {
            q: ['几点开门', '几点营业', '营业时间', '什么时候开门', '几点关店', '营业到几点', '什么时候关门'],
            a: '我们的营业时间是每天 10:00 - 22:00，欢迎光临！',
            tags: ['营业时间'],
          },
          {
            q: ['中午休息吗', '午休时间', '中午能吃吗', '中午营业吗'],
            a: '我们中午不休息，全天营业！10点到22点随时欢迎~',
            tags: ['营业时间', '午休'],
          },
          { q: ['节假日营业吗', '过年营业', '节日开门吗', '周末营业吗'], a: '节假日正常营业！欢迎节日来聚餐~', tags: ['营业时间', '节假日'] },
        ],
      },
      dish_inquiry: {
        patterns: [
          {
            q: ['招牌菜', '特色菜', '最好吃的', '推荐菜', '必点'],
            a: '我们的招牌菜有：宫保鸡丁、鱼香肉丝、麻婆豆腐、糖醋里脊，都是点击率超高的经典菜品！',
            tags: ['招牌', '推荐'],
          },
          {
            q: ['辣不辣', '有多辣', '辣度', '能不能做不辣', '不要辣', '少辣一点'],
            a: '我们的菜品可以根据您的口味调整辣度，可以做不辣、微辣、中辣、特辣，点餐时告诉我您的辣度要求即可~',
            tags: ['辣度', '口味'],
          },
          {
            q: ['有什么菜', '菜单', '都有什么', '菜品列表', '看看菜单'],
            a: '我们有川菜、鲁菜、粤菜、东北菜、京菜等各类特色菜品~需要我给您详细介绍吗？',
            tags: ['菜单', '菜品'],
          },
          { q: ['有没有素菜', '素食', '斋菜', '不吃肉'], a: '有的！我们有麻婆豆腐、蚝油生菜、蒜蓉西兰花、炒时蔬等素菜~', tags: ['素菜', '素食'] },
          {
            q: ['分量多大', '够不够吃', '一人份', '几个人吃', '份量'],
            a: '我们的菜品分量适中，一般够2-3人食用。如果您人少，也可以点半份~',
            tags: ['分量', '份量'],
          },
          {
            q: ['有没有套餐', '套餐推荐', '团购'],
            a: '有的！我们有2人经典套餐（68元）、3人豪华套餐（98元）、单人简餐（32元）等多种选择~',
            tags: ['套餐'],
          },
        ],
      },
      dietary_restrictions: {
        patterns: [
          { q: ['不要香菜', '不加香菜', '香菜过敏'], a: '好的，我会告诉厨房不要放香菜~还有其他忌口吗？', tags: ['忌口', '香菜'] },
          { q: ['不要葱', '不加葱', '葱花', '葱蒜'], a: '没问题，葱也不放~', tags: ['忌口', '葱'] },
          { q: ['不要蒜', '不加蒜'], a: '好的，蒜也不放~', tags: ['忌口', '蒜'] },
          { q: ['清淡一点', '少油', '少盐', '健康一点'], a: '好的，可以告诉厨房做清淡一些，少油少盐~', tags: ['口味', '清淡'] },
        ],
      },
      reservation: {
        patterns: [
          {
            q: ['预约', '订座', '订位', '预订', '包间', '包厢'],
            a: '您可以通过电话 0370-1234567 预约，也可以告诉我您想预约的时间和人数，我来帮您记录~',
            tags: ['预约', '订座'],
          },
          { q: ['几个人', '多少人', '座位', '坐哪里'], a: '请问您几位用餐？我来帮您安排合适的座位~', tags: ['人数', '座位'] },
          { q: ['有包间吗', '包厢', '包间多少钱'], a: '我们有小包间和中包间，可以容纳4-12人，需要的话提前预约哦~', tags: ['包间', '包厢'] },
        ],
      },
      delivery: {
        patterns: [
          { q: ['外卖', '送餐', '可以送吗', '能送外卖吗', '外送'], a: '我们支持美团和饿了么外卖，您也可以选择到店自提~', tags: ['外卖', '配送'] },
          {
            q: ['多久送到', '配送时间', '多长时间', '送餐时间'],
            a: '一般情况下，制作完成后30分钟左右送达，具体时间取决于距离和订单量~',
            tags: ['配送', '时间'],
          },
          { q: ['自提', '到店取', '自己拿', '自取'], a: '可以的！下单时选择到店自提，制作完成后我们会通知您来取~', tags: ['自提'] },
        ],
      },
      payment: {
        patterns: [
          { q: ['怎么付款', '支付方式', '能用什么付', '付款方式'], a: '我们支持微信支付、支付宝、现金、会员卡余额等多种支付方式~', tags: ['支付'] },
          { q: ['能开发票吗', '发票', '开票', '电子发票'], a: '可以开发票！付款后告诉我您的发票抬头和税号，我来帮您处理~', tags: ['发票'] },
          {
            q: ['能打折吗', '优惠', '便宜点', '折扣', '活动'],
            a: '我们有会员折扣、满减活动、套餐优惠等多种优惠，点餐时我帮您推荐最优惠的方式~',
            tags: ['优惠', '折扣'],
          },
        ],
      },
      membership: {
        patterns: [
          {
            q: ['会员', '会员卡', '积分', '会员权益'],
            a: '成为我们的会员可以享受积分返利、会员折扣、生日优惠等多重权益！请问您是我们的会员吗？',
            tags: ['会员'],
          },
          {
            q: ['怎么成为会员', '注册会员', '加入会员', '办卡'],
            a: '您可以直接付款时告诉我手机号，我帮您注册成为会员，首次注册送100积分~',
            tags: ['会员', '注册'],
          },
          { q: ['积分怎么用', '积分兑换', '积分抵扣'], a: '100积分可以抵扣1元现金，消费1元累积1积分，会员日消费双倍积分~', tags: ['积分'] },
          { q: ['余额查询', '卡里还有多少钱', '查余额'], a: '请问您的会员手机号是多少？我帮您查询余额~', tags: ['会员', '余额'] },
        ],
      },
      parking: {
        patterns: [
          { q: ['停车', '停车场', '停车位', '免费停车'], a: '我们地下有停车场，B1层有专属车位。消费满100元可免2小时停车费~', tags: ['停车'] },
          {
            q: ['地铁', '公交', '怎么去', '地址在哪', '位置'],
            a: '我们位于中心商业街88号，您可以乘坐1路/3路/5路公交车到商业街站下车，步行5分钟即可到达~',
            tags: ['交通', '地址'],
          },
          { q: ['收费吗', '停车费', '多少钱一小时'], a: '停车每小时3元，消费满100元可免2小时停车费~', tags: ['停车', '费用'] },
        ],
      },
      facilities: {
        patterns: [
          { q: ['WiFi', '无线网', 'wifi密码', '上网', '连网'], a: 'WiFi账号：Yushan-Free，密码：88888888~', tags: ['WiFi'] },
          { q: ['有厕所吗', '洗手间', '卫生间', '洗手'], a: '有的，门店右手边有洗手间，请自由使用~', tags: ['设施'] },
          { q: ['有空调吗', '热', '冷', '温度'], a: '店内全年空调开放，温度舒适~', tags: ['设施'] },
          { q: ['有宝宝椅吗', '儿童', '小孩', '婴儿'], a: '有的！我们有儿童座椅，带宝宝来也很方便~', tags: ['设施', '儿童'] },
        ],
      },
      takeaway: {
        patterns: [
          { q: ['打包', '外带', '带走', '打包盒'], a: '可以打包！打包盒每个1元，我会帮您打包好~', tags: ['打包'] },
          { q: ['能打包吗', '可以带走吗', '打包带走'], a: '当然可以！所有菜品都可以打包，打包盒需额外收取1元~', tags: ['打包'] },
        ],
      },
      queue: {
        patterns: [
          { q: ['排队', '等位', '有人吗', '还要等多久', '等号'], a: '好的，我来帮您取号！请问您几位？目前等位大约需要10-15分钟~', tags: ['排队'] },
          { q: ['等多久', '还要等多久', '排到了吗'], a: '根据目前情况，预计还需要等待10分钟左右。我会提前通知您~', tags: ['排队'] },
        ],
      },
      feedback: {
        patterns: [
          {
            q: ['投诉', '意见', '反馈', '建议', '不好'],
            a: '非常抱歉给您带来不好的体验！请您告诉我具体情况，我会及时反馈给店长处理~',
            tags: ['投诉'],
          },
          {
            q: ['菜不好吃', '不好吃', '退款', '重做'],
            a: '非常抱歉！请问是哪道菜有问题？我会第一时间反馈给厨房改进。如果确实有问题，我们可以为您重新制作或处理~',
            tags: ['投诉', '质量问题'],
          },
          { q: ['上菜慢', '等太久了', '怎么还没上'], a: '抱歉让您久等！我去催一下厨房尽快出菜~', tags: ['投诉', '上菜慢'] },
          { q: ['表扬', '夸一下', '写好评', '好吃'], a: '谢谢您的认可！您的支持是我们最大的动力~', tags: ['表扬'] },
        ],
      },
      others: {
        patterns: [
          { q: ['谢谢', '感谢', '不客气'], a: '不客气！很高兴为您服务~还有什么需要帮忙的吗？', tags: ['礼貌'] },
          { q: ['你好', '在吗', '有人吗', '哈喽'], a: '您好！我在~请问有什么可以帮您的？', tags: ['问候'] },
          { q: ['算了', '不要了', '先不点了', '取消'], a: '好的，没关系！请问还有其他需要帮忙的吗？', tags: ['取消'] },
          {
            q: ['你是谁', '机器人', 'AI', '什么东西'],
            a: '我是雨姗AI收银助手，是您的智能点餐小助手~可以帮您点餐、推荐菜品、解答问题哦！',
            tags: ['AI'],
          },
          { q: ['转人工', '人工客服', '真人', '找真人'], a: '好的，正在为您转接人工客服，请稍候...', tags: ['转人工'] },
        ],
      },
    }
  }

  buildKeywordIndex() {
    const index = new Map()
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if (data.patterns) {
        for (const pattern of data.patterns) {
          for (const keyword of pattern.q) {
            if (!index.has(keyword)) index.set(keyword, [])
            index.get(keyword).push({ answer: pattern.a, tags: pattern.tags, category })
          }
        }
      }
    }
    return index
  }

  findAnswer(message) {
    const msg = message.toLowerCase().trim()
    for (const [keyword, results] of this.keywordIndex.entries()) {
      if (msg.includes(keyword)) {
        return { answer: results[0].answer, confidence: 0.95, category: results[0].category, tags: results[0].tags }
      }
    }
    let bestMatch = null,
      bestScore = 0
    const words = msg.split(/[\s,，.。!！?？]+/).filter((w) => w.length > 1)
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if (data.patterns) {
        for (const pattern of data.patterns) {
          for (const q of pattern.q) {
            const qWords = q.split(/[\s,，.。!！?？]+/).filter((w) => w.length > 1)
            let score = 0
            for (const word of words) {
              if (q.includes(word) || qWords.some((qw) => qw.includes(word))) score++
            }
            if (score > bestScore && score > 0) {
              bestScore = score
              bestMatch = { answer: pattern.a, confidence: score / Math.max(words.length, qWords.length), category, tags: pattern.tags }
            }
          }
        }
      }
    }
    if (bestMatch) return bestMatch
    return { answer: null, confidence: 0, category: 'unknown', needHuman: true }
  }

  answer(message) {
    const result = this.findAnswer(message)
    if (result.needHuman || result.confidence < 0.3) {
      return { type: 'transfer_human', reply: '抱歉，这个问题我不太确定，让我帮您转接人工客服~', suggestion: '建议转人工处理' }
    }
    return { type: 'faq', reply: result.answer, confidence: result.confidence, category: result.category, tags: result.tags }
  }
}

module.exports = new FAQService()
