const express = require('express');
const {
  DeleteUserController,
  getAllUserController,
  getCustomerController,
  getTotalUserController
} = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/authMiddleware');
const adminProtectedRoute = require('../middleware/admin.middleware');

const adminRoute = express.Router();

// Every admin endpoint requires a valid JWT AND the 'admin' role
adminRoute.use(authenticate, adminProtectedRoute);

adminRoute.get('/customer', getAllUserController);
adminRoute.get('/customer/total', getTotalUserController);
adminRoute.get('/customer/:id', getCustomerController);
adminRoute.delete('/customer/:id', DeleteUserController);

module.exports = adminRoute;