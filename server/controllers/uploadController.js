const { sendSuccess, sendError } = require('../utils/responseHandler');

const uploadSingleImage = (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file uploaded.', 400);
    }

    // Construct public image URL
    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    return sendSuccess(
      res,
      {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
      'Image file uploaded successfully.'
    );
  } catch (error) {
    return sendError(res, error.message || 'Failed to upload image.', 500);
  }
};

const uploadMultipleImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'No image files uploaded.', 400);
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const urls = req.files.map((file) => `${protocol}://${host}/uploads/${file.filename}`);

    return sendSuccess(
      res,
      {
        urls,
        count: req.files.length,
      },
      'Image files uploaded successfully.'
    );
  } catch (error) {
    return sendError(res, error.message || 'Failed to upload images.', 500);
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
};
