const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const fileController = require('../controllers/fileController');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE)
  }
});

// Protected routes
router.post('/upload', auth, upload.single('file'), fileController.uploadFile);
router.get('/', auth, fileController.getFiles);
router.put('/:id/tags', auth, fileController.updateTags);
router.put('/:id/reorder', auth, fileController.reorderFile);
router.delete('/:id', auth, fileController.deleteFile);
router.get('/:id/stats', auth, fileController.getFileStats);

// Public routes
router.get('/shared/:id', fileController.getSharedFile);
router.post('/:id/view', fileController.recordView);
router.get('/:id/download', fileController.downloadFile);

module.exports = router; 