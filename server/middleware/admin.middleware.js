const AppError = require('../utils/AppErros');

// Restricts a route to authenticated admins (req.user is set by `authenticate`).
const adminProtectedRoute = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401));
  }

  const { role } = req.user;

  if (typeof role !== 'string' || role.trim().toLowerCase() !== 'admin') {
    return next(new AppError('Access denied. Admin only.', 403));
  }

  next();
};

module.exports = adminProtectedRoute;