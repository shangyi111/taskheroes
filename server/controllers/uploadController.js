const cloudinary = require('../utils/cloudinary');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
const ALLOWED_SUB_FOLDERS = ['profiles', 'portfolios', 'services', 'chat', 'general'];

// 1. Upload WITH 'temp_upload' tag (For Profiles & Portfolios)
exports.uploadTempImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Images only.' });
    }

    const requestedFolder = req.body.folder || 'general';
    const subFolder = ALLOWED_SUB_FOLDERS.includes(requestedFolder) ? requestedFolder : 'general';
    const secureFolder = `taskheroes/user_${req.user.id}/${subFolder}`;

    const uploadOptions = {
      folder: secureFolder,
      tags: ['temp_upload', `user_${req.user.id}`],
      resource_type: 'image', // Profiles/Portfolios are always images
      transformation: [{ quality: "auto", fetch_format: "auto" }] 
    };

    const result = await uploadStream(req.file.buffer, uploadOptions);
    res.status(200).json({ url: result.secure_url, public_id: result.public_id });

  } catch (err) {
    console.error('Upload Temp Error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// 2. Upload WITHOUT tags (For Chatroom Attachments - handles PDFs and Images)
exports.uploadDirectFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!ALLOWED_FILE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Unsupported file format. Only images and PDFs allowed.' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const secureFolder = `taskheroes/user_${req.user.id}/chat`;
    
    const uploadOptions = {
      folder: secureFolder,
      resource_type: isImage ? 'image' : 'raw', // Crucial for PDFs!
      tags: ['chat_attachment', `user_${req.user.id}`]
    };

    // Only compress if it's actually an image
    if (!isImage) {
      // For raw files, Cloudinary MUST have the file extension in the public_id.
      // We attach a timestamp to the original filename so it's always unique (e.g., "17100000_quote.pdf")
      // We also replace spaces with underscores to keep the URL clean.
      const safeFileName = req.file.originalname.replace(/\s+/g, '_');
      uploadOptions.public_id = `${Date.now()}_${safeFileName}`;
    } else {
      // Only apply image compressions if it's actually an image
      uploadOptions.transformation = [{ quality: "auto", fetch_format: "auto" }];
    }

    const result = await uploadStream(req.file.buffer, uploadOptions);
    res.status(200).json({ url: result.secure_url, public_id: result.public_id });

  } catch (err) {
    console.error('Upload Direct Error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// 3. Delete File
exports.deleteFile = async (req, res) => {
  try {
    const { public_id, resource_type } = req.body;
    if (!public_id) return res.status(400).json({ message: 'No public_id provided' });

    // SECURITY: Authorization via Path Validation
    // A user can only delete a file if the path starts with their user ID folder
    const userFolderPrefix = `taskheroes/user_${req.user.id}/`;

    if (!public_id.startsWith(userFolderPrefix)) {
      console.error(`IDOR ALERT: User ${req.user.id} tried to delete ${public_id}`);
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own assets.' });
    }

    // Pass resource_type (default to 'image' if not provided) so Cloudinary knows how to delete PDFs
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type || 'image'
    }); 
    
    res.status(200).json({ message: 'Deleted successfully', result });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// --- Helper Function to keep code DRY ---
const uploadStream = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    stream.end(buffer);
  });
};