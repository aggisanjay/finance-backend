import ApiError from '../utils/ApiError.js';

/**
 * Role-Based Access Control middleware factory.
 * Usage: authorize('admin', 'analyst')
 */
export const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not authorized to perform this action. Required: ${allowedRoles.join(', ')}`
      );
    }
    next();
  };
};

