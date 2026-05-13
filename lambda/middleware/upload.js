const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const UPLOAD_DIR = path.join(__dirname, '../uploads');

const sanitizeFilename = (filename) => {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.substring(0, 100);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fs = require('fs');
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const randomString = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.jpg';
    const baseName = sanitizeFilename(path.basename(file.originalname, ext));
    const filename = `${Date.now()}_${randomString}_${baseName}${safeExt}`;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      const safeFilename = `${Date.now()}_${randomString}.jpg`;
      cb(null, safeFilename);
    } else {
      cb(null, filename);
    }
  }
});

const fileFilter = function (req, file, cb) {
  const mimeType = file.mimetype.toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return cb(new Error('只允许上传图片文件'));
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('不支持的文件格式'));
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
});

const validateUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({ success: false, message: '请选择要上传的文件' });
  }
  next();
};

const handleUpload = (req, res, next) => {
  // 可选上传：即使没有文件也继续
  const uploadSingle = upload.single('image');
  
  uploadSingle(req, res, (err) => {
    if (err) {
      // 如果不是文件错误，继续
      if (!err.message?.includes('只允许上传') && !err.message?.includes('不支持的')) {
        return next(err);
      }
    }
    // 处理文件路径
    if (req.file) {
      req.filePath = `/uploads/${req.file.filename}`;
    }
    next();
  });
};

const uploadSingle = (fieldName) => [
  upload.single(fieldName),
  validateUpload
];

const uploadMultiple = (fieldName, count = 5) => [
  upload.array(fieldName, count),
  validateUpload
];

const uploadFields = (fields) => [
  upload.fields(fields),
  validateUpload
];

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  validateUpload,
  handleUpload,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE
};
