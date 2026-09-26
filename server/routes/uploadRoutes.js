const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const { uploadSingleImage, uploadMultipleImages } = require('../controllers/uploadController');

// POST /api/upload -> Accepts single 'image' form-data
router.post('/', upload.single('image'), uploadSingleImage);

// POST /api/upload/multiple -> Accepts up to 10 'images' form-data files
router.post('/multiple', upload.array('images', 10), uploadMultipleImages);

module.exports = router;
