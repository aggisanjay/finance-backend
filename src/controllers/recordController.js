import catchAsync from '../utils/catchAsync.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import * as recordService from '../services/recordService.js';
import { createRecordSchema, updateRecordSchema, recordQuerySchema } from '../validators/recordValidator.js';

export const createRecord = catchAsync(async (req, res) => {
  const { error, value } = createRecordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw ApiError.badRequest('Validation failed', errors);
  }

  const record = await recordService.createRecord(value, req.user._id);

  ApiResponse.created(res, {
    message: 'Financial record created successfully',
    data: { record },
  });
});

export const getRecords = catchAsync(async (req, res) => {
  const { error, value } = recordQuerySchema.validate(req.query, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw ApiError.badRequest('Invalid query parameters', errors);
  }

  const { records, pagination } = await recordService.getRecords(value);

  ApiResponse.success(res, {
    message: 'Financial records fetched successfully',
    data: { records },
    meta: { pagination },
  });
});

export const getRecordById = catchAsync(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);

  ApiResponse.success(res, {
    message: 'Financial record fetched successfully',
    data: { record },
  });
});

export const updateRecord = catchAsync(async (req, res) => {
  const { error, value } = updateRecordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    throw ApiError.badRequest('Validation failed', errors);
  }

  const record = await recordService.updateRecord(req.params.id, value);

  ApiResponse.success(res, {
    message: 'Financial record updated successfully',
    data: { record },
  });
});

export const deleteRecord = catchAsync(async (req, res) => {
  const result = await recordService.deleteRecord(req.params.id);

  ApiResponse.success(res, {
    message: result.message,
  });
});

