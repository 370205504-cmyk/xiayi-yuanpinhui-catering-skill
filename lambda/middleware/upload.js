const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/upload.log' })]
});

const uploadDir = path.join(__dirname, '../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const subDir = path.extname(file.originalname) === '.pdf' ? 'docs' : 'images';
    const dir = path.join(uploadDir, subDir);
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocs = ['application/pdf'];
  const allowedAll = [...allowedImages, ...allowedDocs];

  if (allowedAll.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadImage = upload.single('image');

const handleUpload = (req, res, next) => {
  uploadImage(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: '文件大小不能超过5MB' });
        }
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    if (req.file) {
      req.filePath = `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`;
      logger.info(`文件上传成功: ${req.filePath}`);
    }
    next();
  });
};

const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    await fs.unlink(fullPath);
    logger.info(`文件删除成功: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`文件删除失败: ${filePath}`, error);
    return false;
  }
};

module.exports = { handleUpload, deleteFile };
