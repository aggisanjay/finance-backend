import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';

export const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  const user = await User.create({ name, email, password, role });
  const token = generateToken(user);

  return { user, token };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status === 'inactive') {
    throw ApiError.forbidden('Your account has been deactivated. Contact an admin.');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user);

  return { user, token };
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  const token = generateToken(user);
  return { user, token };
};

