import dotenv from 'dotenv'
// 加载环境变量
dotenv.config()
const env = dotenv.config().parsed // 环境参数

// 从环境变量中导入机器人的名称
const botName = env.BOT_NAME

// 从环境变量中导入需要自动回复的消息前缀，默认配空串或不配置则等于无前缀
const autoReplyPrefix = env.AUTO_REPLY_PREFIX ? env.AUTO_REPLY_PREFIX : ''

// 从环境变量中导入联系人白名单
const aliasWhiteList = env.ALIAS_WHITELIST ? env.ALIAS_WHITELIST.split(',') : []

// 从环境变量中导入群聊白名单
const roomWhiteList = env.ROOM_WHITELIST ? env.ROOM_WHITELIST.split(',') : []

import { getServe } from './serve.js'

// 导入本地服务
const dishesController = await import('../dishes/controller.js').then((m) => m.default)
const faqService = await import('../faq/service.js').then((m) => m.default)
const storeService = await import('../store/service.js').then((m) => m.default)

/**
 * 尝试使用本地服务处理消息
 * @param content 消息内容
 * @returns {string|null} 返回处理结果或null（表示需要AI处理）
 */
async function tryLocalService(content) {
  const text = content.toLowerCase().trim()

  // 1. 尝试菜品服务
  const dishesResult = dishesController.handleMessage(text)
  if (dishesResult && dishesResult.reply) {
    return dishesResult.reply
  }

  // 2. 尝试FAQ服务
  const faqResult = faqService.answer(text)
  if (faqResult && faqResult.reply && faqResult.type !== 'transfer_human') {
    return faqResult.reply
  }

  // 3. 尝试店铺信息服务（直接匹配关键词）
  if (text.includes('营业时间') || text.includes('几点开门') || text.includes('几点营业')) {
    const hours = storeService.getBusinessHours()
    return `${hours.store_name}的营业时间是：${hours.business_hours}，欢迎光临！`
  }
  if (text.includes('wifi') || text.includes('无线网') || text.includes('密码')) {
    const wifi = storeService.getWifiInfo()
    return `WiFi账号：${wifi.wifi_name}，密码：${wifi.wifi_password}~`
  }
  if (text.includes('停车') || text.includes('停车场')) {
    const parking = storeService.getParkingInfo()
    return parking.parking_info
  }
  if (text.includes('地址') || text.includes('在哪') || text.includes('位置')) {
    const contact = storeService.getContactInfo()
    return `我们位于${contact.address}，联系电话：${contact.phone}~`
  }

  // 无法处理，返回null让AI处理
  return null
}

/**
 * 默认消息发送
 * @param msg
 * @param bot
 * @param ServiceType 服务类型 'GPT' | 'Kimi'
 * @returns {Promise<void>}
 */
export async function defaultMessage(msg, bot, ServiceType = 'GPT') {
  const getReply = getServe(ServiceType)
  const contact = msg.talker() // 发消息人
  const receiver = msg.to() // 消息接收人
  const content = msg.text() // 消息内容
  const room = msg.room() // 是否是群消息
  const roomName = (await room?.topic()) || null // 群名称
  const alias = (await contact.alias()) || (await contact.name()) // 发消息人昵称
  const remarkName = await contact.alias() // 备注名称
  const name = await contact.name() // 微信名称
  const isText = msg.type() === bot.Message.Type.Text // 消息类型是否为文本
  const isRoom = roomWhiteList.includes(roomName) && content.includes(`${botName}`) // 是否在群聊白名单内并且艾特了机器人
  const isAlias = aliasWhiteList.includes(remarkName) || aliasWhiteList.includes(name) // 发消息的人是否在联系人白名单内
  const isBotSelf = botName === `@${remarkName}` || botName === `@${name}` // 是否是机器人自己
  const isBotSelfDebug = content.trimStart().startsWith('你是谁') // 是否是机器人自己的调试消息
  // TODO 你们可以根据自己的需求修改这里的逻辑
  if ((isBotSelf && !isBotSelfDebug) || !isText) return // 如果是机器人自己发送的消息或者消息类型不是文本则不处理
  try {
    // 区分群聊和私聊
    // 群聊消息去掉艾特主体后，匹配自动回复前缀
    if (isRoom && room && content.replace(`${botName}`, '').trimStart().startsWith(`${autoReplyPrefix}`)) {
      const question = (await msg.mentionText()) || content.replace(`${botName}`, '').replace(`${autoReplyPrefix}`, '') // 去掉艾特的消息主体
      console.log('🌸🌸🌸 / question: ', question)

      // 先尝试本地服务
      const localReply = await tryLocalService(question)
      if (localReply) {
        console.log('🌿 使用本地服务回复')
        await room.say(localReply)
        return
      }

      const response = await getReply(question)
      await room.say(response)
    }
    // 私人聊天，白名单内的直接发送
    // 私人聊天直接匹配自动回复前缀
    if (isAlias && !room && content.trimStart().startsWith(`${autoReplyPrefix}`)) {
      const question = content.replace(`${autoReplyPrefix}`, '')
      console.log('🌸🌸🌸 / content: ', question)

      // 先尝试本地服务
      const localReply = await tryLocalService(question)
      if (localReply) {
        console.log('🌿 使用本地服务回复')
        await contact.say(localReply)
        return
      }

      const response = await getReply(question)
      await contact.say(response)
    }
  } catch (e) {
    console.error(e)
  }
}

/**
 * 分片消息发送
 * @param message
 * @param bot
 * @returns {Promise<void>}
 */
export async function shardingMessage(message, bot) {
  const talker = message.talker()
  const isText = message.type() === bot.Message.Type.Text // 消息类型是否为文本
  if (talker.self() || message.type() > 10 || (talker.name() === '微信团队' && isText)) {
    return
  }
  const text = message.text()
  const room = message.room()
  if (!room) {
    console.log(`Chat GPT Enabled User: ${talker.name()}`)
    const response = await getChatGPTReply(text)
    await trySay(talker, response)
    return
  }
  let realText = splitMessage(text)
  // 如果是群聊但不是指定艾特人那么就不进行发送消息
  if (text.indexOf(`${botName}`) === -1) {
    return
  }
  realText = text.replace(`${botName}`, '')
  const topic = await room.topic()
  const response = await getChatGPTReply(realText)
  const result = `${realText}\n ---------------- \n ${response}`
  await trySay(room, result)
}

// 分片长度
const SINGLE_MESSAGE_MAX_SIZE = 500

/**
 * 发送
 * @param talker 发送哪个  room为群聊类 text为单人
 * @param msg
 * @returns {Promise<void>}
 */
async function trySay(talker, msg) {
  const messages = []
  let message = msg
  while (message.length > SINGLE_MESSAGE_MAX_SIZE) {
    messages.push(message.slice(0, SINGLE_MESSAGE_MAX_SIZE))
    message = message.slice(SINGLE_MESSAGE_MAX_SIZE)
  }
  messages.push(message)
  for (const msg of messages) {
    await talker.say(msg)
  }
}

/**
 * 分组消息
 * @param text
 * @returns {Promise<*>}
 */
async function splitMessage(text) {
  let realText = text
  const item = text.split('- - - - - - - - - - - - - - -')
  if (item.length > 1) {
    realText = item[item.length - 1]
  }
  return realText
}
