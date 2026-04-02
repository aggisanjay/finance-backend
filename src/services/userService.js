import { User } from '../models/User.js';
import ApiError from '../utils/ApiError.js';

export const getUsers = async (query) => {
  const { page, limit, role, status, search, sortBy, sortOrder } = query;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

export const updateUser = async (userId, updateData) => {
  delete updateData.password;

  if (updateData.email) {
    const existing = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
    if (existing) {
      throw ApiError.conflict('Email already in use by another user');
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

export const deleteUser = async (userId, requestingUserId) => {
  if (userId === requestingUserId.toString()) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.isDeleted = true;
  user.status = 'inactive';
  await user.save();

  return { message: 'User deleted successfully' };
};

