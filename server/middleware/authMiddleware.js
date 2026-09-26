const { verifyAccessToken } = require('../utils/jwtHelper');
const { sendError } = require('../utils/responseHandler');

// Middleware to authenticate JWT access token
const authenticate = (req, res, next) => {
  let token = null;

  // 1. Check HTTP-Only Cookie
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Check Authorization Header (Bearer <token>)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Access Denied: No authentication token provided.', 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach user info to request object
    next();
  } catch (error) {
    return sendError(res, 'Access Denied: Invalid or expired access token.', 401);
  }
};

// Middleware to authorize specific user roles (e.g. authorize('admin'))
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Access Denied: User unauthenticated.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Forbidden: Access restricted to [${allowedRoles.join(', ')}] role(s).`, 403);
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  // Allows the route to work for both guests and authenticated users.
  // If a valid token is present it populates req.user; otherwise continues.
  authenticateOptional: (req, res, next) => {
    let token = null;
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const { verifyAccessToken } = require('../utils/jwtHelper');
        req.user = verifyAccessToken(token);
      } catch { /* invalid token — treat as guest */ }
    }
    next();
  },
};
