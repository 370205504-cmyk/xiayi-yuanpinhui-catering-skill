const crypto = require('crypto');

/**
 * AES-256-CBC 加密配置
 * 密钥长度必须为32字节（256位）
 */
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-encryption-key-must-be-32-bytes!', 'utf8');

if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 bytes');
}

/**
 * 通用加密函数
 * 使用AES-256-CBC算法，随机IV
 * @param {string} text - 待加密文本
 * @returns {string} 加密后的字符串（格式: ivHex:encryptedHex）
 */
function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * 通用解密函数
 * @param {string} encryptedText - 加密字符串（格式: ivHex:encryptedHex）
 * @returns {string} 解密后的原始文本
 */
function decrypt(encryptedText) {
  if (!encryptedText) return '';
  const [ivHex, encryptedHex] = encryptedText.split(':');
  if (!ivHex || !encryptedHex) return '';
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 手机号加密（专门处理用户隐私数据）
 * @param {string} phone - 明文手机号
 * @returns {string} 加密后的手机号
 */
function encryptPhone(phone) {
  return encrypt(phone);
}

/**
 * 手机号解密
 * @param {string} encryptedPhone - 加密的手机号
 * @returns {string} 明文手机号
 */
function decryptPhone(encryptedPhone) {
  return decrypt(encryptedPhone);
}

/**
 * 手机号脱敏处理（显示为 138****1234 格式）
 * @param {string} phone - 加密或明文的手机号
 * @returns {string} 脱敏后的手机号
 */
function maskPhone(phone) {
  if (!phone) return '';
  const decrypted = decryptPhone(phone);
  if (decrypted.length === 11) {
    return decrypted.substring(0, 3) + '****' + decrypted.substring(7);
  }
  return '****';
}

module.exports = {
  encrypt,
  decrypt,
  encryptPhone,
  decryptPhone,
  maskPhone
};