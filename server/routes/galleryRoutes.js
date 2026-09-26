const express = require('express');
const router = express.Router();
const {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  toggleGalleryItemStatus,
  deleteGalleryItem
} = require('../controllers/galleryController');

// Gallery Public & Admin Management Endpoints
router.get('/', getGalleryItems);
router.get('/:id', getGalleryItemById);
router.post('/', createGalleryItem);
router.put('/:id', updateGalleryItem);
router.patch('/:id/toggle', toggleGalleryItemStatus);
router.delete('/:id', deleteGalleryItem);

module.exports = router;
