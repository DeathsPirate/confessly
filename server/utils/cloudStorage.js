const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `confession-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Function to get full URL for an image
function getImageUrl(filename, req) {
  if (!filename) return null;
  
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host || 'localhost:5000';
  const baseUrl = `${protocol}://${host}`;
  
  return `${baseUrl}/uploads/${filename}`;
}

// Function to delete an image file
function deleteImage(filename) {
  if (!filename) return Promise.resolve();
  
  const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
  const filePath = path.join(uploadPath, filename);
  
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  upload,
  getImageUrl,
  deleteImage
}; 