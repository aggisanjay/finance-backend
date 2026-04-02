import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { JWT_SECRET } from '../config/env.js';

/**
 * Extracts JWT from Authorization header, verifies it, attaches user to req.
 */
export const authenticate = catchAsync(async (req, _res, next) => {
  // 1. Get token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication required. Please log in.');
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid token. Please log in again.');
  }

  // 3. Check user still exists and is active
  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User belonging to this token no longer exists.');
  }
  if (user.status === 'inactive') {
    throw ApiError.forbidden('Your account has been deactivated. Contact an admin.');
  }

  // 4. Attach user to request
  req.user = user;
  next();
});

