import { FinancialRecord } from '../models/FinancialRecord.js';
import ApiError from '../utils/ApiError.js';

export const createRecord = async (data, userId) => {
  const record = await FinancialRecord.create({ ...data, createdBy: userId });
  return record.populate('createdBy', 'name email role');
};

export const getRecords = async (query) => {
  const { page, limit, type, category, startDate, endDate, minAmount, maxAmount, search, sortBy, sortOrder } = query;

  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = minAmount;
    if (maxAmount) filter.amount.$lte = maxAmount;
  }

  if (search) {
    filter.description = { $regex: search, $options: 'i' };
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate('createdBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    FinancialRecord.countDocuments(filter),
  ]);

  return {
    records,
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

export const getRecordById = async (recordId) => {
  const record = await FinancialRecord.findById(recordId).populate('createdBy', 'name email role');
  if (!record) {
    throw ApiError.notFound('Financial record not found');
  }
  return record;
};

export const updateRecord = async (recordId, updateData) => {
  const record = await FinancialRecord.findByIdAndUpdate(recordId, updateData, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email role');

  if (!record) {
    throw ApiError.notFound('Financial record not found');
  }

  return record;
};

export const deleteRecord = async (recordId) => {
  const record = await FinancialRecord.findById(recordId);
  if (!record) {
    throw ApiError.notFound('Financial record not found');
  }

  record.isDeleted = true;
  await record.save();

  return { message: 'Financial record deleted successfully' };
};

