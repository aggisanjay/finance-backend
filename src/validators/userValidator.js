import Joi from 'joi';

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email().lowercase(),
  role: Joi.string().valid('viewer', 'analyst', 'admin'),
  status: Joi.string().valid('active', 'inactive'),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({ 'any.required': 'Current password is required' }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    'string.min': 'New password must be at least 6 characters',
    'any.required': 'New password is required',
  }),
});

export const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid('viewer', 'analyst', 'admin'),
  status: Joi.string().valid('active', 'inactive'),
  search: Joi.string().trim().max(100),
  sortBy: Joi.string().valid('name', 'email', 'createdAt', 'role').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

