const express = require('express');
const router = express.Router();
const multer = require('multer');
const {authenticateToken} = require('../auth/authMiddleware');
const uploadController = require('../controllers/uploadController');

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 1. Temporary Uploads (For Portfolios & Profiles)
router.post('/upload/temp', authenticateToken, upload.single('file'), uploadController.uploadTempImage);

// 2. Direct Uploads (For Chatroom Attachments)
router.post('/upload/direct', authenticateToken, upload.single('file'), uploadController.uploadDirectFile);

// 3. Deletions
router.delete('/delete', authenticateToken, uploadController.deleteFile);

module.exports = router;