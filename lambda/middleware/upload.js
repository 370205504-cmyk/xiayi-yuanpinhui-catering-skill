const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const subDir = path.extname(file.originalname).toLowerCase() === '.pdf' ? 'documents' : 'images';
    const targetDir = path.join(uploadDir, subDir);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  const validImageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (validImageExts.includes(ext) || validMimeTypes.includes(mimeType)) {
    return cb(null, true);
  }

  if (ext === '.pdf' && mimeType === 'application/pdf') {
    return cb(null, true);
  }

  logger.warn('File upload rejected:', { 
    originalname: file.originalname, 
    mimetype: mimeType,
    ext 
  });
  
  cb(new Error('仅允许上传图片文件(JPG, PNG, GIF, WEBP)或PDF文件'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
});

const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '')
    .substring(0, 255);
};

const validateFilePath = (filePath) => {
  const normalized = path.normalize(filePath);
  const uploadsDir = path.join(__dirname, '../uploads');
  const normalizedUploads = path.normalize(uploadsDir);
  
  return normalized.startsWith(normalizedUploads);
};

const cleanupOldFiles = async (directory, maxAgeInDays = 7) => {
  try {
    const files = fs.readdirSync(directory);
    const now = Date.now();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up old file: ${filePath}`);
      }
    }
  } catch (error) {
    logger.error('Failed to cleanup old files:', error);
  }
};

module.exports = {
  upload,
  sanitizeFilename,
  validateFilePath,
  cleanupOldFiles,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE
};
