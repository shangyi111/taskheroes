const cloudinary = require('../utils/cloudinary');

// 1. Upload WITH 'temp_upload' tag (For Profiles & Portfolios)
exports.uploadTempImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const targetFolder = req.body.folder || 'general';
    const uploadOptions = {
      folder: targetFolder,
      tags: 'temp_upload',
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

    const targetFolder = req.body.folder || 'general';
    const isImage = req.file.mimetype.startsWith('image/');
    
    const uploadOptions = {
      folder: targetFolder,
      resource_type: isImage ? 'image' : 'raw', // Crucial for PDFs!
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