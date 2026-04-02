import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as authService from '../services/authService.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { updatePasswordSchema } from '../validators/userValidator.js';

export const register = catchAsync(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw ApiError.badRequest('Validation failed', errors);
  }

  const { user, token } = await authService.register(value);

  ApiResponse.created(res, {
    message: 'User registered successfully',
    data: { user, token },
  });
});

export const login = catchAsync(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw ApiError.badRequest('Validation failed', errors);
  }

  const { user, token } = await authService.login(value);

  ApiResponse.success(res, {
    message: 'Logged in successfully',
    data: { user, token },
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user._id);

  ApiResponse.success(res, {
    message: 'Profile fetched successfully',
    data: { user },
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const { error, value } = updatePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw ApiError.badRequest('Validation failed', errors);
  }

  const { user, token } = await authService.changePassword(
    req.user._id,
    value.currentPassword,
    value.newPassword
  );

  ApiResponse.success(res, {
    message: 'Password changed successfully',
    data: { user, token },
  });
});

