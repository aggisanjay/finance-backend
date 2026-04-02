import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as userService from '../services/userService.js';
import { updateUserSchema, userQuerySchema } from '../validators/userValidator.js';

export const getUsers = catchAsync(async (req, res) => {
  const { error, value } = userQuerySchema.validate(req.query, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw ApiError.badRequest('Invalid query parameters', errors);
  }

  const { users, pagination } = await userService.getUsers(value);

  ApiResponse.success(res, {
    message: 'Users fetched successfully',
    data: { users },
    meta: { pagination },
  });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  ApiResponse.success(res, {
    message: 'User fetched successfully',
    data: { user },
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const { error, value } = updateUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw ApiError.badRequest('Validation failed', errors);
  }

  const user = await userService.updateUser(req.params.id, value);

  ApiResponse.success(res, {
    message: 'User updated successfully',
    data: { user },
  });
});

export const deleteUser = catchAsync(async (req, res) => {
  const result = await userService.deleteUser(req.params.id, req.user._id);

  ApiResponse.success(res, {
    message: result.message,
  });
});

