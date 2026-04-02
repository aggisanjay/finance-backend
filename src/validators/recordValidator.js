import Joi from 'joi';
import { RECORD_TYPES, CATEGORIES } from '../models/FinancialRecord.js';

export const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be greater than 0',
    'any.required': 'Amount is required',
  }),
  type: Joi.string()
    .valid(...RECORD_TYPES)
    .required()
    .messages({
      'any.only': `Type must be one of: ${RECORD_TYPES.join(', ')}`,
      'any.required': 'Type is required',
    }),
  category: Joi.string()
    .valid(...CATEGORIES)
    .required()
    .messages({
      'any.only': `Category must be one of: ${CATEGORIES.join(', ')}`,
      'any.required': 'Category is required',
    }),
  date: Joi.date().iso().max('now').default(new Date()).messages({
    'date.max': 'Date cannot be in the future',
  }),
  description: Joi.string().trim().max(500).allow('').default(''),
});

export const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid(...RECORD_TYPES),
  category: Joi.string().valid(...CATEGORIES),
  date: Joi.date().iso().max('now'),
  description: Joi.string().trim().max(500).allow(''),
})
  .min(1)
  .messages({ 'object.min': 'At least one field must be provided for update' });

export const recordQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid(...RECORD_TYPES),
  category: Joi.string().valid(...CATEGORIES),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  minAmount: Joi.number().positive(),
  maxAmount: Joi.number().positive().min(Joi.ref('minAmount')),
  search: Joi.string().trim().max(200),
  sortBy: Joi.string().valid('amount', 'date', 'category', 'type', 'createdAt').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

