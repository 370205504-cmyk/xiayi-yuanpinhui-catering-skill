const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFile(type = 'info') {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${today}.log`);
  }

  formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    return JSON.stringify(logEntry);
  }

  writeLog(file, content) {
    fs.appendFileSync(file, `${content }\\n`);
  }

  info(message, data = {}) {
    const log = this.formatLog('INFO', message, data);
    console.log(`[INFO] ${message}`, data);
    this.writeLog(this.getLogFile('info'), log);
  }

  error(message, data = {}) {
    const log = this.formatLog('ERROR', message, data);
    console.error(`[ERROR] ${message}`, data);
    this.writeLog(this.getLogFile('error'), log);
  }

  warn(message, data = {}) {
    const log = this.formatLog('WARN', message, data);
    console.warn(`[WARN] ${message}`, data);
    this.writeLog(this.getLogFile('warn'), log);
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV !== 'production') {
      const log = this.formatLog('DEBUG', message, data);
      console.debug(`[DEBUG] ${message}`, data);
      this.writeLog(this.getLogFile('debug'), log);
    }
  }

  logOrder(orderId, action, data = {}) {
    const log = this.formatLog('ORDER', action, { orderId, ...data });
    console.log(`[ORDER:${orderId}] ${action}`, data);
    this.writeLog(this.getLogFile('orders'), log);
  }

  logOperation(userId, action, data = {}) {
    const log = this.formatLog('OPERATION', action, { userId, ...data });
    console.log(`[OPERATION:${userId}] ${action}`, data);
    this.writeLog(this.getLogFile('operations'), log);
  }
}

module.exports = new Logger();
