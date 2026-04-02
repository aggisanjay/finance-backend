import ApiError from '../utils/ApiError.js';
import { NODE_ENV } from '../config/env.js';

const handleCastError = (err) => {
  return new ApiError(400, `Invalid ${err.path}: ${err.value}`);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new ApiError(409, `Duplicate value for '${field}': '${err.keyValue[field]}'. Please use another value.`);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new ApiError(400, 'Validation failed', errors);
};

const handleJWTError = () => new ApiError(401, 'Invalid token. Please log in again.');
const handleJWTExpiredError = () => new ApiError(401, 'Token has expired. Please log in again.');

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const globalErrorHandler = (err, _req, res, _next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || 'Internal server error',
  };

  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  if (NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  if (statusCode === 500) {
    console.error('❌ UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json(response);
};

