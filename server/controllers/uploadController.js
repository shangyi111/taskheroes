const cloudinary = require('../utils/cloudinary');

exports.uploadPortfolioImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get folder name from frontend request body (e.g., 'portfolios' or 'profiles')
    // Default to 'general' if none provided
    const targetFolder = req.body.folder || 'general';

    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: targetFolder,
            tags: 'temp_upload',
            resource_type: 'auto',
            // Optional: optimization settings
            transformation: [{ quality: "auto", fetch_format: "auto" }] 
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    console.log("before upload");
    const result = await uploadToCloudinary();
    console.log("Upload Result:", result);
    res.status(200).json({ 
      url: result.secure_url,
      public_id: result.public_id 
    });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};