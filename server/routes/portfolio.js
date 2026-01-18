const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const authenticateToken = require('../auth/authMiddleware');

// Configure Multer to use Memory Storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit: 10MB
});

router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Use a Promise-based upload stream for Cloudinary
    const targetFolder = req.body.folder || 'general';
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: targetFolder,
             tags: 'temp_upload',
            transformation: [{ width: 1000, crop: "limit", quality: "auto" }] 
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const result = await uploadToCloudinary();

    // Return the secure URL to the frontend
    res.status(200).json({ 
      url: result.secure_url, 
      public_id: result.public_id 
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: 'No public_id provided' });
    }

    // 1. Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      return res.status(200).json({ message: 'Image deleted from Cloudinary' });
    } else {
      return res.status(400).json({ message: 'Cloudinary deletion failed', detail: result });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;