const Alexa = require('ask-sdk-core');
const i18n = require('i18n-next');

// ============================================================
// 菜品数据库 - Dish Database
// ============================================================
const dishDatabase = {
  // 川菜 Sichuan
  '宫保鸡丁': {
    name: '宫保鸡丁',
    cuisine: '川菜',
    taste: '香辣',
    ingredients: ['鸡肉', '花生', '干辣椒', '黄瓜'],
    difficulty: '中等',
    cookTime: '25分钟',
    calories: 320,
    description: '经典川菜，鸡丁滑嫩，花生酥脆，麻辣鲜香。',
    steps: [
      '鸡肉切丁，加料酒、盐、淀粉腌制15分钟',
      '调制酱汁：酱油、醋、糖、淀粉水混合',
      '热锅凉油，爆香干辣椒和花椒',
      '放入鸡丁翻炒至变色',
      '加入葱段、黄瓜丁翻炒',
      '倒入酱汁翻炒均匀，最后加入花生米'
    ]
  },
  '麻婆豆腐': {
    name: '麻婆豆腐',
    cuisine: '川菜',
    taste: '麻辣',
    ingredients: ['豆腐', '猪肉末', '豆瓣酱', '花椒'],
    difficulty: '简单',
    cookTime: '20分钟',
    calories: 250,
    description: '麻辣鲜香，豆腐嫩滑，下饭神器。',
    steps: [
      '豆腐切成小块，焯水备用',
      '热锅下油，炒香肉末',
      '加入豆瓣酱炒出红油',
      '加入适量水烧开，放入豆腐',
      '小火炖煮5分钟入味',
      '水淀粉勾芡，撒上花椒粉和葱花'
    ]
  },
  '水煮鱼': {
    name: '水煮鱼',
    cuisine: '川菜',
    taste: '麻辣',
    ingredients: ['鱼肉', '豆芽', '干辣椒', '花椒'],
    difficulty: '较难',
    cookTime: '40分钟',
    calories: 380,
    description: '鱼片鲜嫩，麻辣过瘾，川菜经典代表。',
    steps: [
      '鱼片加蛋清、盐、料酒腌制',
      '豆芽焯水铺在碗底',
      '锅中热油，炒香豆瓣酱和姜蒜',
      '加水烧开后放入鱼片滑熟',
      '将鱼片和汤倒入碗中',
      '另起锅烧热油，撒上干辣椒和花椒浇在鱼上'
    ]
  },
  // 粤菜 Cantonese
  '清蒸鲈鱼': {
    name: '清蒸鲈鱼',
    cuisine: '粤菜',
    taste: '清淡',
    ingredients: ['鲈鱼', '葱', '姜', '蒸鱼豉油'],
    difficulty: '中等',
    cookTime: '20分钟',
    calories: 200,
    description: '鱼肉鲜嫩，原汁原味，粤菜经典。',
    steps: [
      '鲈鱼处理干净，两面划刀',
      '鱼身抹少许盐和料酒，放上姜片',
      '水烧开后放入鱼蒸8到10分钟',
      '倒掉蒸出的汤汁，铺上葱丝',
      '淋上蒸鱼豉油',
      '浇上热油即可'
    ]
  },
  // 湘菜 Hunan
  '小炒肉': {
    name: '小炒肉',
    cuisine: '湘菜',
    taste: '香辣',
    ingredients: ['猪肉', '青椒', '蒜', '豆豉'],
    difficulty: '简单',
    cookTime: '15分钟',
    calories: 280,
    description: '湘菜家常菜，肉香四溢，辣味十足。',
    steps: [
      '五花肉切薄片，青椒切段',
      '热锅不放油，先煸炒五花肉至出油',
      '加入蒜片和豆豉炒香',
      '放入青椒大火翻炒',
      '加酱油、盐调味',
      '翻炒均匀即可出锅'
    ]
  },
  // 家常菜 Home-style
  '番茄炒蛋': {
    name: '番茄炒蛋',
    cuisine: '家常菜',
    taste: '酸甜',
    ingredients: ['西红柿', '鸡蛋', '葱', '糖'],
    difficulty: '简单',
    cookTime: '10分钟',
    calories: 180,
    description: '国民家常菜，酸甜可口，老少皆宜。',
    steps: [
      '鸡蛋打散加少许盐搅匀',
      '番茄切块备用',
      '热锅多放些油，倒入蛋液炒散盛出',
      '锅中留底油，放入番茄翻炒出汁',
      '加入少许糖和盐调味',
      '倒回鸡蛋翻炒均匀，撒上葱花'
    ]
  },
  '红烧肉': {
    name: '红烧肉',
    cuisine: '家常菜',
    taste: '咸鲜',
    ingredients: ['猪肉', '冰糖', '酱油', '八角'],
    difficulty: '中等',
    cookTime: '90分钟',
    calories: 520,
    description: '肥而不腻，入口即化，经典硬菜。',
    steps: [
      '五花肉切成方块，冷水下锅焯水',
      '锅中放少许油，加入冰糖炒出糖色',
      '放入五花肉翻炒上色',
      '加入酱油、料酒、八角、桂皮',
      '加入热水没过肉块，大火烧开',
      '转小火炖60到80分钟，最后大火收汁'
    ]
  },
  '糖醋排骨': {
    name: '糖醋排骨',
    cuisine: '家常菜',
    taste: '酸甜',
    ingredients: ['排骨', '醋', '糖', '番茄酱'],
    difficulty: '中等',
    cookTime: '45分钟',
    calories: 450,
    description: '外酥里嫩，酸甜可口，大人小孩都爱吃。',
    steps: [
      '排骨剁小段，冷水下锅焯水去血沫',
      '锅中放油，放入排骨煎至两面金黄',
      '加入料酒、酱油翻炒',
      '加入适量水，放入冰糖和醋',
      '大火烧开后转小火炖30分钟',
      '大火收汁，汤汁浓稠即可出锅'
    ]
  },
  '鱼香肉丝': {
    name: '鱼香肉丝',
    cuisine: '川菜',
    taste: '酸甜',
    ingredients: ['猪肉', '木耳', '胡萝卜', '青椒'],
    difficulty: '中等',
    cookTime: '20分钟',
    calories: 300,
    description: '咸甜酸辣兼备，鱼香风味浓郁，下饭好菜。',
    steps: [
      '猪肉切丝，加盐、料酒、淀粉腌制',
      '木耳泡发切丝，胡萝卜和青椒切丝',
      '调鱼香汁：醋、糖、酱油、豆瓣酱、淀粉水',
      '热锅下油，滑炒肉丝盛出',
      '锅中炒香葱姜蒜和豆瓣酱',
      '放入配菜翻炒，倒入肉丝和鱼香汁翻炒均匀'
    ]
  },
  '回锅肉': {
    name: '回锅肉',
    cuisine: '川菜',
    taste: '香辣',
    ingredients: ['猪肉', '青椒', '蒜苗', '豆瓣酱'],
    difficulty: '中等',
    cookTime: '25分钟',
    calories: 420,
    description: '川菜之首，肉香浓郁，肥而不腻。',
    steps: [
      '五花肉整块冷水下锅煮至八成熟',
      '捞出放凉后切成薄片',
      '锅中不放油，放入肉片煸炒至卷曲出油',
      '加入豆瓣酱和甜面酱炒出红油',
      '放入蒜苗段和青椒翻炒',
      '加少许酱油调味，翻炒均匀出锅'
    ]
  },
  '蛋炒饭': {
    name: '蛋炒饭',
    cuisine: '家常菜',
    taste: '咸鲜',
    ingredients: ['米饭', '鸡蛋', '葱', '盐'],
    difficulty: '简单',
    cookTime: '10分钟',
    calories: 350,
    description: '简单美味的经典主食，粒粒分明。',
    steps: [
      '隔夜米饭提前打散',
      '鸡蛋打散备用',
      '热锅下油，倒入蛋液炒至半凝固',
      '立即倒入米饭大火翻炒',
      '加盐调味，炒至米饭粒粒分明',
      '撒入葱花翻炒均匀即可'
    ]
  },
  '酸辣土豆丝': {
    name: '酸辣土豆丝',
    cuisine: '家常菜',
    taste: '酸辣',
    ingredients: ['土豆', '干辣椒', '醋', '花椒'],
    difficulty: '简单',
    cookTime: '15分钟',
    calories: 150,
    description: '爽脆可口，酸辣开胃，经典家常小菜。',
    steps: [
      '土豆去皮切成细丝，泡水去淀粉',
      '干辣椒切段，花椒备用',
      '热锅下油，爆香花椒和干辣椒',
      '大火放入土豆丝翻炒',
      '加入醋和盐快速翻炒',
      '炒至土豆丝断生即可出锅'
    ]
  },
  '可乐鸡翅': {
    name: '可乐鸡翅',
    cuisine: '家常菜',
    taste: '甜',
    ingredients: ['鸡翅', '可乐', '酱油', '姜'],
    difficulty: '简单',
    cookTime: '35分钟',
    calories: 380,
    description: '甜香入味，鸡翅嫩滑，零失败美食。',
    steps: [
      '鸡翅两面划刀，冷水下锅焯水',
      '锅中少许油，放入鸡翅煎至两面金黄',
      '加入姜片翻炒',
      '倒入可乐没过鸡翅，加酱油调味',
      '大火烧开后转小火炖20分钟',
      '大火收汁至浓稠即可'
    ]
  },
  '蒜蓉西兰花': {
    name: '蒜蓉西兰花',
    cuisine: '家常菜',
    taste: '清淡',
    ingredients: ['西兰花', '蒜', '蚝油', '盐'],
    difficulty: '简单',
    cookTime: '10分钟',
    calories: 100,
    description: '营养健康，蒜香浓郁，减脂首选。',
    steps: [
      '西兰花掰成小朵，洗净',
      '烧水加少许盐和油，焯水2分钟捞出',
      '锅中放油，爆香蒜末',
      '放入西兰花翻炒',
      '加蚝油和少许盐调味',
      '翻炒均匀即可出锅'
    ]
  },
  '酸菜鱼': {
    name: '酸菜鱼',
    cuisine: '川菜',
    taste: '酸辣',
    ingredients: ['鱼肉', '酸菜', '泡椒', '花椒'],
    difficulty: '较难',
    cookTime: '35分钟',
    calories: 350,
    description: '酸辣开胃，鱼片嫩滑，让人食欲大增。',
    steps: [
      '鱼片加蛋清和淀粉腌制',
      '酸菜切段，泡椒切碎',
      '锅中放油炒香酸菜和泡椒',
      '加入鱼骨熬汤15分钟',
      '捞出鱼骨，先放酸菜铺底',
      '汤烧开下入鱼片，煮熟后撒花椒浇热油'
    ]
  },
  '干锅花菜': {
    name: '干锅花菜',
    cuisine: '家常菜',
    taste: '香辣',
    ingredients: ['花菜', '五花肉', '干辣椒', '蒜'],
    difficulty: '简单',
    cookTime: '20分钟',
    calories: 220,
    description: '花菜焦香，配以五花肉，干锅风味十足。',
    steps: [
      '花菜掰成小朵洗净',
      '五花肉切薄片',
      '锅中不放油，煸炒五花肉出油',
      '加入蒜片和干辣椒炒香',
      '放入花菜大火翻炒',
      '加酱油、盐调味，炒至花菜微焦'
    ]
  },
  '红烧茄子': {
    name: '红烧茄子',
    cuisine: '家常菜',
    taste: '咸鲜',
    ingredients: ['茄子', '蒜', '酱油', '糖'],
    difficulty: '简单',
    cookTime: '20分钟',
    calories: 230,
    description: '茄子软糯入味，酱香浓郁，非常下饭。',
    steps: [
      '茄子切成滚刀块，撒盐腌制10分钟',
      '挤去水分备用',
      '锅中多放些油，放入茄子煎至软',
      '加入蒜末炒香',
      '加酱油、糖和少许水',
      '小火炖煮5分钟，大火收汁撒葱花'
    ]
  },
  '葱油拌面': {
    name: '葱油拌面',
    cuisine: '上海菜',
    taste: '咸鲜',
    ingredients: ['面条', '葱', '酱油', '糖'],
    difficulty: '简单',
    cookTime: '15分钟',
    calories: 400,
    description: '葱香扑鼻，面条劲道，简单又满足。',
    steps: [
      '大量小葱切段',
      '锅中倒油，小火慢炸葱段至焦黄',
      '加入酱油、糖调成葱油汁',
      '面条煮熟捞出',
      '将葱油汁浇在面条上',
      '拌匀即可食用'
    ]
  },
  '皮蛋瘦肉粥': {
    name: '皮蛋瘦肉粥',
    cuisine: '粤菜',
    taste: '清淡',
    ingredients: ['大米', '皮蛋', '猪瘦肉', '葱'],
    difficulty: '简单',
    cookTime: '60分钟',
    calories: 250,
    description: '粥底绵滑，皮蛋瘦肉经典搭配，暖胃佳品。',
    steps: [
      '大米洗净加水浸泡30分钟',
      '瘦肉切丝加盐腌制，皮蛋切小块',
      '水烧开后放入大米，大火煮开转小火',
      '煮40分钟至粥底浓稠',
      '放入肉丝和皮蛋继续煮10分钟',
      '加盐调味，撒上葱花'
    ]
  },
  '三杯鸡': {
    name: '三杯鸡',
    cuisine: '台湾菜',
    taste: '咸鲜',
    ingredients: ['鸡肉', '九层塔', '蒜', '香油'],
    difficulty: '中等',
    cookTime: '30分钟',
    calories: 380,
    description: '一杯酱油、一杯麻油、一杯米酒，香气四溢。',
    steps: [
      '鸡腿切块焯水',
      '锅中倒香油，放入鸡块煎至两面金黄',
      '加入大量蒜瓣和姜片炒香',
      '倒入酱油和米酒',
      '加盖小火焖煮20分钟',
      '大火收汁，放入九层塔翻炒'
    ]
  }
};

// 菜系到菜品的映射
const cuisineDishMap = {
  '川菜': ['宫保鸡丁', '麻婆豆腐', '水煮鱼', '鱼香肉丝', '回锅肉', '酸菜鱼'],
  '粤菜': ['清蒸鲈鱼', '皮蛋瘦肉粥'],
  '湘菜': ['小炒肉'],
  '家常菜': ['番茄炒蛋', '红烧肉', '糖醋排骨', '蛋炒饭', '酸辣土豆丝', '可乐鸡翅', '蒜蓉西兰花', '干锅花菜', '红烧茄子'],
  '上海菜': ['葱油拌面'],
  '台湾菜': ['三杯鸡']
};

// 口味到菜品的映射
const tasteDishMap = {
  '麻辣': ['麻婆豆腐', '水煮鱼'],
  '香辣': ['宫保鸡丁', '小炒肉', '回锅肉', '干锅花菜'],
  '酸辣': ['酸辣土豆丝', '酸菜鱼'],
  '清淡': ['清蒸鲈鱼', '蒜蓉西兰花', '皮蛋瘦肉粥'],
  '酸甜': ['番茄炒蛋', '糖醋排骨', '鱼香肉丝'],
  '咸鲜': ['红烧肉', '蛋炒饭', '红烧茄子', '葱油拌面', '三杯鸡'],
  '甜': ['可乐鸡翅']
};

// 食材到菜品的映射
const ingredientDishMap = {
  '鸡肉': ['宫保鸡丁', '可乐鸡翅', '三杯鸡'],
  '猪肉': ['红烧肉', '小炒肉', '回锅肉', '鱼香肉丝'],
  '牛肉': [],
  '鱼肉': ['水煮鱼', '清蒸鲈鱼', '酸菜鱼'],
  '虾': [],
  '豆腐': ['麻婆豆腐'],
  '鸡蛋': ['番茄炒蛋', '蛋炒饭', '皮蛋瘦肉粥'],
  '土豆': ['酸辣土豆丝'],
  '西红柿': ['番茄炒蛋'],
  '白菜': [],
  '青椒': ['小炒肉', '鱼香肉丝', '干锅花菜'],
  '蘑菇': [],
  '米饭': ['蛋炒饭'],
  '面条': ['葱油拌面'],
  '排骨': ['糖醋排骨'],
  '茄子': ['红烧茄子']
};

// 早餐/午餐/晚餐推荐
const mealMenuMap = {
  '早餐': {
    dishes: ['皮蛋瘦肉粥', '葱油拌面', '番茄炒蛋', '蛋炒饭'],
    description: '营养丰富的早餐，开启美好的一天！'
  },
  '午餐': {
    dishes: ['宫保鸡丁', '鱼香肉丝', '小炒肉', '酸辣土豆丝', '蒜蓉西兰花'],
    description: '丰盛的午餐，补充一天的能量！'
  },
  '晚餐': {
    dishes: ['红烧肉', '清蒸鲈鱼', '糖醋排骨', '水煮鱼', '三杯鸡'],
    description: '温馨的晚餐，享受家的味道！'
  },
  '宵夜': {
    dishes: ['蛋炒饭', '葱油拌面', '酸辣土豆丝'],
    description: '轻松的宵夜，满足深夜的味蕾！'
  },
  '下午茶': {
    dishes: ['可乐鸡翅', '蒜蓉西兰花'],
    description: '精致的下午茶，享受悠闲时光！'
  }
};

// ============================================================
// 辅助函数 - Helper Functions
// ============================================================

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getAllDishNames() {
  return Object.keys(dishDatabase);
}

function recommendDish(cuisine, ingredient, taste) {
  let candidates = getAllDishNames();

  // 按菜系筛选
  if (cuisine) {
    const cuisineDishes = cuisineDishMap[cuisine] || [];
    if (cuisineDishes.length > 0) {
      const filtered = candidates.filter(d => cuisineDishes.includes(d));
      if (filtered.length > 0) candidates = filtered;
    }
  }

  // 按食材筛选
  if (ingredient) {
    const ingredientDishes = ingredientDishMap[ingredient] || [];
    if (ingredientDishes.length > 0) {
      const filtered = candidates.filter(d => ingredientDishes.includes(d));
      if (filtered.length > 0) candidates = filtered;
    }
  }

  // 按口味筛选
  if (taste) {
    const tasteDishes = tasteDishMap[taste] || [];
    if (tasteDishes.length > 0) {
      const filtered = candidates.filter(d => tasteDishes.includes(d));
      if (filtered.length > 0) candidates = filtered;
    }
  }

  return getRandomItem(candidates);
}

function generateMenu(mealType, personCount) {
  const count = personCount || 3;
  let selectedDishes = [];

  if (mealType && mealMenuMap[mealType]) {
    selectedDishes = getRandomItems(mealMenuMap[mealType].dishes, count);
  } else {
    // 生成一日三餐
    const breakfast = getRandomItems(mealMenuMap['早餐'].dishes, 2);
    const lunch = getRandomItems(mealMenuMap['午餐'].dishes, 3);
    const dinner = getRandomItems(mealMenuMap['晚餐'].dishes, 3);
    return {
      type: 'fullDay',
      breakfast,
      lunch,
      dinner,
      description: `为您安排了${personCount ? personCount + '人份的' : ''}一日三餐菜单！`
    };
  }

  return {
    type: 'single',
    mealType,
    dishes: selectedDishes,
    description: `为您推荐了${mealType}菜单，共${selectedDishes.length}道菜${personCount ? '，适合' + personCount + '人食用' : ''}！`
  };
}

function getDishDetail(dishName) {
  const dish = dishDatabase[dishName];
  if (!dish) return null;

  return {
    name: dish.name,
    description: dish.description,
    cuisine: dish.cuisine,
    taste: dish.taste,
    difficulty: dish.difficulty,
    cookTime: dish.cookTime,
    calories: dish.calories,
    ingredients: dish.ingredients.join('、'),
    steps: dish.steps
  };
}

function formatDishSpeech(dishName) {
  const dish = dishDatabase[dishName];
  if (!dish) return `抱歉，没有找到${dishName}的信息。`;

  let speech = `为您推荐：${dish.name}。`;
  speech += `${dish.description}。`;
  speech += `这道菜属于${dish.cuisine}，口味${dish.taste}，`;
  speech += `难度${dish.difficulty}，大约需要${dish.cookTime}，热量约${dish.calories}大卡。`;
  speech += `主要食材有：${dish.ingredients.join('、')}。`;
  speech += `想了解详细做法吗？只需说"告诉我${dish.name}的做法"即可。`;
  return speech;
}

function formatRecipeSpeech(dishName) {
  const dish = dishDatabase[dishName];
  if (!dish) return `抱歉，没有找到${dishName}的做法。`;

  let speech = `${dish.name}的做法如下：`;
  dish.steps.forEach((step, index) => {
    speech += ` 第${index + 1}步，${step}。`;
  });
  speech += ` 祝您烹饪愉快！`;
  return speech;
}

function formatMenuSpeech(menu) {
  let speech = '';

  if (menu.type === 'fullDay') {
    speech += menu.description + ' ';
    speech += '早餐有：' + menu.breakfast.join('、') + '。';
    speech += '午餐有：' + menu.lunch.join('、') + '。';
    speech += '晚餐有：' + menu.dinner.join('、') + '。';
  } else {
    speech += menu.description + ' ';
    speech += '推荐菜品：' + menu.dishes.join('、') + '。';
  }

  speech += ' 想了解哪道菜的做法，随时告诉我！';
  return speech;
}

// ============================================================
// 请求处理器 - Request Handlers
// ============================================================

// 启动请求处理器
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = '欢迎来到美食大厨！我可以帮您推荐菜品、生成菜单、查询菜谱。' +
      '您可以说"推荐一道菜"、"帮我生成菜单"，或者"随机推荐一道菜"。' +
      '请问有什么可以帮您的？';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('您可以说"推荐一道菜"或"帮我生成菜单"，请问需要什么帮助？')
      .withSimpleCard('美食大厨', '欢迎！我可以帮您推荐菜品和生成菜单。')
      .getResponse();
  }
};

// 菜品推荐意图处理器
const RecommendDishIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RecommendDishIntent';
  },
  handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const cuisine = slots.Cuisine && slots.Cuisine.value ? slots.Cuisine.value : null;
    const ingredient = slots.Ingredient && slots.Ingredient.value ? slots.Ingredient.value : null;
    const taste = slots.Taste && slots.Taste.value ? slots.Taste.value : null;

    const dishName = recommendDish(cuisine, ingredient, taste);
    const speechText = formatDishSpeech(dishName);

    // 将推荐的菜品保存到 session attributes
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.lastRecommendedDish = dishName;
    attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('还想了解其他菜品吗？可以说"推荐一道菜"或"随机推荐"。')
      .withSimpleCard('美食推荐 - ' + dishName, dishDatabase[dishName].description)
      .getResponse();
  }
};

// 生成菜单意图处理器
const GenerateMenuIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GenerateMenuIntent';
  },
  handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const mealType = slots.MealType && slots.MealType.value ? slots.MealType.value : null;
    const personCount = slots.PersonCount && slots.PersonCount.value ? parseInt(slots.PersonCount.value) : null;

    const menu = generateMenu(mealType, personCount);
    const speechText = formatMenuSpeech(menu);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('需要重新生成菜单，还是想了解某道菜的做法？')
      .withSimpleCard('菜单推荐', mealType ? `${mealType}菜单` : '一日三餐菜单')
      .getResponse();
  }
};

// 获取菜谱意图处理器
const GetRecipeIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetRecipeIntent';
  },
  handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    let dishName = slots.DishName && slots.DishName.value ? slots.DishName.value : null;

    // 如果用户没指定菜名，使用上次推荐的菜
    if (!dishName) {
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      dishName = sessionAttributes.lastRecommendedDish || null;
    }

    if (!dishName) {
      return handlerInput.responseBuilder
        .speak('请问您想了解哪道菜的做法？可以说"告诉我宫保鸡丁的做法"。')
        .reprompt('请告诉我您想了解哪道菜的做法？')
        .getResponse();
    }

    const speechText = formatRecipeSpeech(dishName);

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('菜谱 - ' + dishName, dishDatabase[dishName] ?
        `难度：${dishDatabase[dishName].difficulty} | 时间：${dishDatabase[dishName].cookTime}` :
        '未找到该菜品')
      .getResponse();
  }
};

// 随机推荐意图处理器
const RandomDishIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RandomDishIntent';
  },
  handle(handlerInput) {
    const allDishes = getAllDishNames();
    const dishName = getRandomItem(allDishes);
    const speechText = '为您随机推荐：' + formatDishSpeech(dishName);

    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.lastRecommendedDish = dishName;
    attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('不满意？可以再说"随机推荐一道菜"试试！')
      .withSimpleCard('随机推荐 - ' + dishName, dishDatabase[dishName].description)
      .getResponse();
  }
};

// 帮助意图处理器
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = '美食大厨可以帮您：' +
      '第一，推荐菜品。您可以说"推荐一道川菜"或"用鸡肉做什么菜"。' +
      '第二，生成菜单。您可以说"帮我安排今天的午餐菜单"。' +
      '第三，查询菜谱。您可以说"告诉我宫保鸡丁的做法"。' +
      '第四，随机推荐。您可以说"随机推荐一道菜"。' +
      '请问您需要什么帮助？';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('您可以说"推荐一道菜"或"帮我生成菜单"。')
      .getResponse();
  }
};

// 取消和停止意图处理器
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = '好的，祝您用餐愉快！再见！';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withShouldEndSession(true)
      .getResponse();
  }
};

// 返回首页意图处理器
const NavigateHomeIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NavigateHomeIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('好的，返回主页面。')
      .withShouldEndSession(true)
      .getResponse();
  }
};

// 会话结束请求处理器
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  }
};

// 意图反射处理器（用于调试）
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speechText = `您触发了意图：${intentName}`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};

// ============================================================
// 错误处理器 - Error Handler
// ============================================================
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    const speechText = '抱歉，我遇到了一些问题。请再说一次，或者可以说"帮助"查看使用说明。';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('抱歉出了点问题，请再说一次。')
      .getResponse();
  }
};

// ============================================================
// 拦截器 - Interceptors
// ============================================================

// 请求日志拦截器
const RequestLogInterceptor = {
  process(handlerInput) {
    console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`);
  }
};

// 响应日志拦截器
const ResponseLogInterceptor = {
  process(handlerInput, response) {
    console.log(`Outgoing response: ${JSON.stringify(response)}`);
  }
};

// ============================================================
// Lambda 处理器 - Lambda Handler
// ============================================================
let skill;

exports.handler = async function (event, context) {
  console.log(`REQUEST++++${JSON.stringify(event)}`);

  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        RecommendDishIntentHandler,
        GenerateMenuIntentHandler,
        GetRecipeIntentHandler,
        RandomDishIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        NavigateHomeIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
      )
      .addErrorHandlers(ErrorHandler)
      .addRequestInterceptors(RequestLogInterceptor)
      .addResponseInterceptors(ResponseLogInterceptor)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log(`RESPONSE++++${JSON.stringify(response)}`);
  return response;
};
