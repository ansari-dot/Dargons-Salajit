const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { validateUserData } = require('../validations/userValidation');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Customer / User Endpoints
router.post('/', validateUserData, createUser);

// User & Admin Management Endpoints
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', validateUserData, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
